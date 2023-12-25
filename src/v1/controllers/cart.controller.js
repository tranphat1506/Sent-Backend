const GET_CART = 0;
const ADD_ITEM = 1;
const REMOVE_ITEM = 2;
const RESET_CART = 3;
const cartService = require('../services/cart.service');
const { api_version } = require('../configs/globalSetting.config');
const { getPayload } = require('../helpers/jwt.helper');
const { USER_STATUS } = require('../constants/status.code');
const getCartInfo = (req, res) => {
    const a_token = req.cookies.a_token || req.headers.authorization.split(' ')[1];
    const _id = getPayload(a_token)._id;
    if (!_id) {
        const { httpCode, id, message } = USER_STATUS.USER__UNAUTHORIZED;
        return res.status(httpCode).json({
            code: httpCode,
            id,
            message,
        });
    }
    cartService
        .getCartInfoById(_id)
        .then((data) => {
            //console.log(data);
            return res.status(200).json({
                code: 200,
                message: 'Success.',
                payload: {
                    type: GET_CART,
                    ...data,
                    version: api_version.version,
                },
            });
        })
        .catch((error) => {
            const { httpCode, message, id } = error;
            process.env.NODE_ENV != 'development'
                ? logEvents(`${id}: ${message}`, `errors`)
                : console.log(`${id}: ${message}`);
            return res.status(httpCode).json({
                code: httpCode,
                id,
                message,
            });
        });
};

const updateCart = async (req, res) => {
    const a_token = req.cookies.a_token || req.headers.authorization.split(' ')[1];
    const _id = getPayload(a_token)._id;
    if (!_id) {
        const { httpCode, id, message } = USER_STATUS.USER__UNAUTHORIZED;
        return res.status(httpCode).json({
            code: httpCode,
            id,
            message,
        });
    }
    const type = req.body.type;
    const updated_items = req.body.updated_items;
    switch (type) {
        case GET_CART:
            cartService
                .getCartInfoById(_id)
                .then((data) => {
                    //console.log(data);
                    return res.status(200).json({
                        code: 200,
                        message: 'Success.',
                        payload: {
                            type,
                            ...data,
                            version: api_version.version,
                        },
                    });
                })
                .catch((error) => {
                    const { httpCode, message, id } = error;
                    console.log(error);
                    return res.status(httpCode).json({
                        code: httpCode,
                        id,
                        message,
                    });
                });
            break;
        case ADD_ITEM:
            if (!updated_items || !updated_items.length)
                return res.status(403).json({
                    code: 403,
                    message: 'Forbidden!',
                });
            cartService
                .addItemFromCart(_id, updated_items)
                .then((data) => {
                    return res.status(200).json({
                        code: 200,
                        payload: {
                            type,
                            ...data,
                            version: api_version.version,
                        },
                    });
                })
                .catch((error) => {
                    const { httpCode, message, id } = error;
                    console.log(error);
                    return res.status(httpCode).json({
                        code: httpCode,
                        id,
                        message,
                    });
                });
            break;
        case REMOVE_ITEM:
            if (!updated_items || !updated_items.length)
                return res.status(403).json({
                    code: 403,
                    message: 'Forbidden!',
                });
            cartService
                .removeItemFromCart(_id, updated_items)
                .then((data) => {
                    return res.status(200).json({
                        code: 200,
                        payload: {
                            type,
                            ...data,
                            version: api_version.version,
                        },
                    });
                })
                .catch((error) => {
                    const { httpCode, message, id } = error;
                    console.log(error);
                    return res.status(httpCode).json({
                        code: httpCode,
                        id,
                        message,
                    });
                });
            break;
        case RESET_CART:
            cartService
                .resetCart(_id)
                .then((data) => {
                    return res.status(data.httpCode).json({
                        code: data.httpCode,
                        payload: {
                            type,
                            ...data,
                            version: api_version.version,
                        },
                    });
                })
                .catch((error) => {
                    const { httpCode, message, id } = error;
                    console.log(error);
                    return res.status(httpCode).json({
                        code: httpCode,
                        id,
                        message,
                    });
                });
            break;
        default:
            return res.status(403).json({
                code: 403,
                message: 'Forbidden!',
            });
    }
};

module.exports = {
    getCartInfo,
    updateCart,
};
