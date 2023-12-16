const { getPayload } = require('../helpers/jwt.helper');
const userService = require('../services/user.service');
const getInfo = async (req, res) => {
    // get what ?
    const a_token = req.headers.authorization?.split(' ')[1];
    const _id = getPayload(a_token)._id;
    // is permit to get this data
    userService
        .getUserInfoById(_id)
        .then((payload) => {
            return res.status(payload.httpCode).json({
                code: payload.httpCode,
                id: payload.id,
                message: payload.message,
                payload: payload.user,
            });
        })
        .catch((error) => {
            const { httpCode, id, message } = error;
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

module.exports = {
    getInfo,
};
