const { getPayload } = require('../helpers/jwt.helper');
const roomService = require('../services/room.service');
const { joinRoomById, addRoom } = require('../services/socket.io/common.service');

const create = async (req, res) => {
    // get id
    const a_token = req.headers.authorization?.split(' ')[1];
    const _id = getPayload(a_token)._id;
    // Create room
    roomService
        .createRoom({
            ownerId: _id,
            displayName: 'Test',
            isGroupChat: false,
            memberIds: ['6573e5e61dfa33a7a41d503b', '6574b473239ae37696fb8245', '6574bd9b39d5aa97deff4251'],
        })
        .then(async (response) => {
            await addRoom(response.payload.room.room_id, response.payload.room);
            return res.status(response.httpCode).json({
                code: response.httpCode,
                message: response.message,
                payload: response.payload,
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
    const a_token = req.headers.authorization?.split(' ')[1];
    const _id = getPayload(a_token)._id;
    // Create room
    roomService
        .joinRoomByRoomId({
            requestSendBy: _id,
            roomId: '6574bd19f1373b43c894b98e',
            memberIds: ['6574b473239ae37696fb8245', '6574bd9b39d5aa97deff4251'],
        })
        .then((response) => {
            return res.status(response.httpCode).json({
                code: response.httpCode,
                message: response.message,
                payload: response.payload,
            });
        })
        .catch((error) => {
            console.log(error);
            const { httpCode, payload, message } = error;
            return res.status(httpCode).json({
                code: httpCode,
                payload,
                message,
            });
        });
};

const RoomEventBySocketIO = (socket) => {
    const _id = socket.user?._id || undefined;
    // Event create room
    socket.on('create-room__Request', async ({ members = [], display_name, is_group_chat = false }) => {
        // Create room
        roomService
            .createRoom({ ownerId: _id, displayName: display_name, isGroupChat: is_group_chat, memberIds: members })
            .then(async (response) => {
                await addRoom(response.payload.room.room_id, response.payload.room);
                socket.emit('create-room__Response', response);
            })
            .catch((error) => {
                socket.emit('create-room__Response', error);
            });
    });
    // Event add to room
    socket.on('add-to-room__Request', async ({ room_id, members = [] }) => {
        // Create room
        roomService
            .joinRoomByRoomId({ requestSendBy: _id, roomId: room_id, memberIds: members })
            .then(async (response) => {
                socket.emit('add-to-room__Response', response);
            })
            .catch((error) => {
                socket.emit('add-to-room__Response', error);
            });
    });
};

const joinMessageRooms = async (socket, userId) => {
    return roomService
        .getUserRooms(userId)
        .then(({ payload }) => {
            if (!payload['messagesRooms']) return false;
            return Promise.all(Object.keys(payload['messagesRooms']).map((roomId) => joinRoomById(roomId, socket)));
        })
        .catch((error) => {
            console.log(error);
        });
};
module.exports = {
    create,
    addMember,
    RoomEventBySocketIO,
    joinMessageRooms,
};
