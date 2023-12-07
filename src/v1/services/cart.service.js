const { USER_STATUS, ITEM_STATUS, SERVER_STATUS } = require('../constants/status.code');
const { UserModel } = require('../models/users.model');
const { ItemModel } = require('../models/item.model');
const _ = require('underscore');
const getCartInfoById = (userId, limit = 0) => {
    return new Promise((resolve, reject) => {
        UserModel.aggregate([
            {
                $match: { _id: userId },
            },
            {
                $project: {
                    _id: 1,
                    totalItem: { $size: '$store_details.cart_store' },
                    store: {
                        $sortArray: {
                            input: '$store_details.cart_store',
                            sortBy: { add_time: 1 },
                        },
                    },
                },
            },
        ])
            .then(([data]) => {
                if (_.isEmpty(data) || !data) reject(USER_STATUS.USER__UNDEFINED);
                if (data.totalItem === 0) resolve(data);
                const cartStore = {};
                const itemList = data.store.map((item) => {
                    cartStore[item.item_id] = { ...item };
                    delete cartStore[item.item_id]['item_id']; // dont need this field
                    return item.item_id;
                });
                // console.log('Item List: ', itemList);
                // console.log('Cart Store: ', cartStore);
                return [
                    data,
                    cartStore,
                    ItemModel.aggregate([
                        {
                            $match: {
                                _id: { $in: itemList },
                                publish: true,
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                typeOfItem: '$typeOfItem',
                                itemName: '$itemName',
                                quantity: '$quantity',
                                itemImages: '$itemImages',
                                prices: '$prices',
                                tags: '$tags',
                                publish: '$publish',
                            },
                        },
                        {
                            $addFields: {
                                sort_index: {
                                    $indexOfArray: [itemList, '$_id'],
                                },
                            },
                        },
                        {
                            $sort: { sort_index: 1 },
                        },
                    ]),
                ];
            })
            .then(async ([storeInfo, cartStore, storeQueryPromise]) => {
                const store = await storeQueryPromise; // ferch current store
                let totalSalePrice = 0;
                let totalOriginalPrice = 0;
                let updateCart = false; // if need to be update cart
                store.forEach((item) => {
                    const _id = item._id; // item id
                    // Fix quantity out-stock or in-stock
                    let status;
                    const quantity = cartStore[_id].quantity;
                    const maxQuantity = item.quantity;
                    const lastMaxQuantity = storeInfo.store[item.sort_index].max_quantity;
                    if (maxQuantity !== lastMaxQuantity) {
                        // update last max quantity to new quantity
                        storeInfo.store[item.sort_index].max_quantity = maxQuantity;
                        updateCart = true;
                    }
                    if (maxQuantity <= 0) {
                        cartStore[_id].quantity = maxQuantity;
                        storeInfo.store[item.sort_index].quantity = maxQuantity;
                        status = 'out-stock';
                    } else {
                        if (quantity > maxQuantity) {
                            cartStore[_id].quantity = maxQuantity;
                            storeInfo.store[item.sort_index].quantity = maxQuantity;
                            updateCart = true;
                        }
                        status = 'in-stock';
                    }
                    // total prices
                    totalOriginalPrice += item.prices.isDiscount
                        ? item.prices.originalPrice * quantity
                        : item.prices.salePrice * quantity;
                    totalSalePrice += item.prices.salePrice * quantity;
                    // add to cart store
                    cartStore[_id] = {
                        ...item,
                        ...cartStore[_id],
                        status,
                        max_quantity: maxQuantity,
                    };
                });
                // update cart for user if needed
                if (updateCart)
                    await UserModel.findByIdAndUpdate(userId, {
                        $set: {
                            store_details: {
                                cart_store: storeInfo.store,
                            },
                        },
                    });
                storeInfo.store.reverse();
                return resolve({
                    ...storeInfo,
                    totalOriginalPrice,
                    totalSalePrice,
                    store: cartStore,
                    store_default: storeInfo.store,
                });
            })
            .catch((error) => {
                console.log(`${error.name}: ${error.message}`);
                return reject(SERVER_STATUS.SERVER__DEFAULT_ERROR);
            });
    });
};
const addItemFromCart = (userId, updatedItems) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userData = await UserModel.findOne({ _id: userId });
            if (_.isEmpty(userData)) {
                // fetch with database but dont find this user id
                return reject(USER_STATUS.USER__UNDEFINED);
            }
            const cart = {
                store: userData.store_details.cart_store,
            };
            if (_.isUndefined(cart.store)) {
                cart._id = userId;
                cart.store = [];
            }
            const statusUpdated = await Promise.all(
                updatedItems.map(async (updateItem) => {
                    const item_id = updateItem._id;
                    const quantity = updateItem.quantity;
                    // condition
                    if (!item_id) return { ...ITEM_STATUS.ITEM__REMOVED_OR_MODIFIER, r_time: Date.now() };
                    if (quantity <= 0) return { ...ITEM_STATUS.ITEM__DELETE_ERROR_MIN, r_time: Date.now() };
                    // check quantity is enough
                    const [checkInStock] = await ItemModel.aggregate([
                        {
                            $match: {
                                _id: item_id,
                                publish: true,
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                totalQuantity: '$quantity',
                            },
                        },
                    ]);
                    if (_.isUndefined(checkInStock))
                        return { ...ITEM_STATUS.ITEM__REMOVED_OR_MODIFIER, r_time: Date.now() };
                    const add_time = new Date().getTime();
                    // Loop check if already have item in cart
                    for (let index = 0; index < cart.store.length; index++) {
                        const item = cart.store[index];
                        if (item.item_id === item_id) {
                            if (
                                checkInStock.totalQuantity === 0 ||
                                checkInStock.totalQuantity < item.quantity + quantity
                            )
                                item.quantity = checkInStock.totalQuantity;
                            else item.quantity += quantity;
                            item.add_time = add_time;
                            item.max_quantity = checkInStock.totalQuantity;
                            return { ...ITEM_STATUS.ITEM__UPDATED_OK, r_time: Date.now() }; // return promise
                        }
                    }
                    // Push item to cart if dont found equal item in cart
                    cart.store.push({
                        item_id,
                        quantity:
                            checkInStock.totalQuantity === 0 || quantity > checkInStock.totalQuantity
                                ? checkInStock.totalQuantity
                                : quantity,
                        max_quantity: checkInStock.totalQuantity,
                        add_time,
                    });
                    // return status value for promise
                    return { ...ITEM_STATUS.ITEM__ADD_OK, r_time: Date.now() }; // return promise
                }),
            );
            // update cart
            userData.store_details.cart_store = cart.store;
            await userData.save();
            return resolve({
                store: cart.store,
                store_status: statusUpdated,
            });
        } catch (error) {
            console.log(`${error.name}: ${error.message}`);
            return reject(SERVER_STATUS.SERVER__DEFAULT_ERROR);
        }
    });
};
const removeItemFromCart = (userId, updatedItems) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userData = await UserModel.findOne({ _id: userId });
            if (_.isEmpty(userData)) {
                // fetch with database but dont find this user id
                return reject(USER_STATUS.USER__UNDEFINED);
            }
            const cart = {
                store: userData.store_details.cart_store,
            };
            if (_.isUndefined(cart.store)) {
                cart._id = userId;
                cart.store = [];
            }
            const statusUpdated = await Promise.all(
                updatedItems.map(async (updateItem) => {
                    const item_id = updateItem._id;
                    const quantity = updateItem.quantity;
                    // return
                    if (!item_id) return { ...ITEM_STATUS.ITEM__REMOVED_OR_MODIFIER, r_time: Date.now() };
                    if (quantity <= 0) return { ...ITEM_STATUS.ITEM__DELETE_ERROR_MIN, r_time: Date.now() };
                    // check quantity is enough
                    const [checkInStock] = await ItemModel.aggregate([
                        {
                            $match: {
                                _id: item_id,
                                publish: true,
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                totalQuantity: '$quantity',
                            },
                        },
                    ]);
                    if (_.isUndefined(checkInStock))
                        return { ...ITEM_STATUS.ITEM__REMOVED_OR_MODIFIER, r_time: Date.now() };
                    // Loop check if already have item in cart
                    const add_time = new Date().getTime();
                    for (let index = 0; index < cart.store.length; index++) {
                        const item = cart.store[index];
                        if (item.item_id === item_id) {
                            if (item.quantity - quantity <= 0 || checkInStock.totalQuantity === 0) {
                                // remove event
                                cart.store.splice(index, 1);
                                return { ...ITEM_STATUS.ITEM__DELETE_OK, r_time: Date.now() };
                            }
                            if (checkInStock.totalQuantity < item.quantity - quantity) {
                                item.quantity = checkInStock.totalQuantity;
                            } else item.quantity -= quantity;
                            item.add_time = add_time;
                            item.max_quantity = checkInStock.totalQuantity;
                            return { ...ITEM_STATUS.ITEM__UPDATED_OK, r_time: Date.now() }; // return promise
                        }
                    }
                    // Remove item from cart if dont found equal item in cart
                    return { ...ITEM_STATUS.ITEM__NOT_EXIST, r_time: Date.now() }; // return promise
                }),
            );
            // update cart
            userData.store_details.cart_store = cart.store;
            await userData.save();
            return resolve({
                store: cart.store,
                store_status: statusUpdated,
            });
        } catch (error) {
            console.log(`${error.name}: ${error.message}`);
            return reject(SERVER_STATUS.SERVER__DEFAULT_ERROR);
        }
    });
};
const resetCart = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userData = await UserModel.findOne({ _id: userId });
            if (_.isEmpty(userData)) {
                // fetch with database but dont find this user id
                return reject(USER_STATUS.USER__UNDEFINED);
            }
            userData.store_details.cart_store = [];
            await userData.save();
            return resolve(ITEM_STATUS.ITEM__UPDATED_OK);
        } catch (error) {
            console.log(`${error.name}: ${error.message}`);
            return reject(SERVER_STATUS.SERVER__DEFAULT_ERROR);
        }
    });
};
module.exports = {
    getCartInfoById,
    addItemFromCart,
    removeItemFromCart,
    resetCart,
};
