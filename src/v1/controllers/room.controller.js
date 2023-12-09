const { getPayload } = require('../helpers/jwt.helper');
const roomService = require('../services/room.service');

const create = async (req, res) => {
    // get id
    const a_token = req.cookies.a_token || req.headers.authorization.split(' ')[1];
    const _id = getPayload(a_token)._id;
    // Create room
    roomService
        .createRoom(_id, 'Test', false, [
            '6573e5e61dfa33a7a41d503b',
            '6574b473239ae37696fb8245',
            '6574bd9b39d5aa97deff4251',
        ])
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
                ? logEvents(`${error.name}: ${error.message}`, `errors`)
                : console.log(`${error.name}: ${error.message}`);
            return res.status(httpCode).json({
                code: httpCode,
                payload,
                message,
            });
        });
};

const addMember = async (req, res) => {
    // get id
    const a_token = req.cookies.a_token || req.headers.authorization.split(' ')[1];
    const _id = getPayload(a_token)._id;
    // Create room
    roomService
        .joinRoomByRoomId('6574bd19f1373b43c894b98e', ['6574b473239ae37696fb8245', '6574bd9b39d5aa97deff4251'])
        .then((payload) => {
            return res.status(payload.httpCode).json({
                code: payload.httpCode,
                message: payload.message,
                payload: payload.payload,
            });
        })
        .catch((error) => {
            const { httpCode, payload, message } = error;
            return res.status(httpCode).json({
                code: httpCode,
                payload,
                message,
            });
        });
};

const RoomEventBySocketIO = (socket) => {
    // Event create room
    socket.on('create-room__Request', async ({ members = [], display_name, is_group_chat = false }) => {
        const _id = socket.user?._id || undefined;
        // Create room
        roomService
            .createRoom(_id, display_name, is_group_chat, members)
            .then((payload) => {
                socket.emit('create-room__Response', payload);
            })
            .catch((error) => {
                process.env.NODE_ENV != 'development'
                    ? logEvents(`${error.name}: ${error.message}`, `errors`)
                    : console.log(`${error.name}: ${error.message}`);
                socket.emit('create-room__Response', {
                    code: httpCode,
                    payload,
                    message,
                });
            });
    });
};

module.exports = {
    create,
    addMember,
    RoomEventBySocketIO,
};
