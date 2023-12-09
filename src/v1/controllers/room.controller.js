const { getPayload } = require('../helpers/jwt.helper');
const roomService = require('../services/room.service');
const create = async (req, res) => {
    // get id
    const a_token = req.cookies.a_token || req.headers.authorization.split(' ')[1];
    const _id = getPayload(a_token)._id;
    // Create room
    roomService
        .createRoom(_id, 'Test', false, ['6573e5e61dfa33a7a41d503b'])
        .then((payload) => {
            return res.status(payload.httpCode).json({
                code: payload.httpCode,
                message: payload.message,
                payload: payload.payload,
            });
        })
        .catch((error) => {
            const { httpCode, payload, message } = error;
            process.env.NODE_ENV != 'development'
                ? logEvents(`${id}: ${message}`, `errors`)
                : console.log(`${id}: ${message}`);
            return res.status(httpCode).json({
                code: httpCode,
                payload,
                message,
            });
        });
};

module.exports = {
    create,
};
