const { strRemoveUnicode, stringToSlug } = require('../utils/string.utils');
const { urlAlphabet, customAlphabet } = require('nanoid');
const { ItemModel } = require('../models/item.model');
const genUuid = customAlphabet(urlAlphabet, 15);

const findItemById = (id) => {
    return new Promise((resolve, reject) => {
        ItemModel.findById(id)
            .then((item) => {
                return resolve(item);
            })
            .catch((err) => {
                return reject(err);
            });
    });
};

const findItemByTag = async (tagsArray) => {
    const tagsArrayRegex = tagsArray.map((tag) => new RegExp(tag, 'miu'));
    return new Promise((resolve, reject) => {
        ItemModel.find({
            $or: [{ tags: { $in: tagsArrayRegex } }, { itemName: tagsArrayRegex }],
        })
            .sort({ 'prices.isDiscount': -1, 'prices.salePrice': 1 })
            .then((items) => {
                return resolve({ found: items.length, items });
            })
            .catch((err) => {
                return reject(err);
            });
    });
};

const createItem = ({
    itemName,
    quantity,
    isDiscount,
    originalPrice,
    salePrice,
    publish,
    typeId,
    typeDisplay,
    tagsArray,
}) => {
    const id = genUuid();
    console.log(id);
    const newItem = new ItemModel({
        _id: id,
        publish,
        itemName,
        quantity,
        prices: {
            isDiscount,
            originalPrice,
            salePrice,
        },
        typeOfItem: {
            id: typeId,
            display: typeDisplay,
        },
        tags: tagsArray,
    });
    return newItem.save();
};

const detailStore = () => {
    const allItems = ItemModel.find().count();
    const privateItems = ItemModel.find({ publish: false }).count();
    const publishItems = ItemModel.find({ publish: true }).count();
    return new Promise((resolve, reject) => {
        Promise.all([allItems, privateItems, publishItems])
            .then((result) => {
                return resolve({
                    totalCount: result[0],
                    privateCount: result[1],
                    publishCount: result[2],
                });
            })
            .catch((err) => {
                return reject(err);
            });
    });
};
// const findItemByDeepSearching = async (searchQuery) => {
//     //const tagsArrayRegex = new RegExp(tagsArray.join('|'), 'mui');
//     //console.log(tagsArrayRegex);
//     return new Promise((resolve, reject) => {
//         ItemModel.find(
//             // prettier-ignore
//             { $text: { $search: searchQuery } },
//             { score: { $meta: 'textScore' } },
//         )
//             .sort({ score: { $meta: 'textScore' } })
//             .then((items) => {
//                 return resolve({ found: items.length, items });
//             })
//             .catch((err) => {
//                 return reject(err);
//             });
//     });
// };
module.exports = {
    createItem,
    detailStore,
    findItemById,
    findItemByTag,
    //findItemByDeepSearching,
};
