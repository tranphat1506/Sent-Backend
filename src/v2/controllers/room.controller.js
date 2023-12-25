const { getPayload } = require('../helpers/jwt.helper');
const { paramsToMessageResponseVer0 } = require('../services/message.service');
const roomService = require('../services/room.service');
const { joinRoomById, addRoom } = require('../services/socket.io/common.service');
const { ENDPOINTS } = require('../routers/socketio.endpoints');

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

const joinMessageRooms = async (socket, userId) => {
    return roomService
        .getUserRooms(userId)
        .then(({ payload }) => {
            if (!payload['messagesRooms']) return false;
            return {
                rooms: payload['messagesRooms'],
                joinPromises: Promise.all(
                    Object.keys(payload['messagesRooms']).map((roomId) => joinRoomById(roomId, socket)),
                ),
            };
        })
        .catch((error) => {
            console.log(error);
        });
};

const RoomEventBySocketIO = (socket) => {
    const _id = socket.user?._id || undefined;
    // Event create room
    socket.on('create-room__Request', async ({ members = [], display_name, is_group_chat = false }) => {
        // Create room
        roomService
            .createRoom({
                ownerId: _id,
                displayName: display_name,
                isGroupChat: is_group_chat,
                memberIds: members,
            })
            .then(async (response) => {
                if (response.isCreateSuccess) {
                    // add room to redis
                    await addRoom(response.payload.room.room_id, response.payload.room);
                    // sent message to all user
                    response.payload.user_status.payload.forEach((status) => {
                        const user_id = status.id;
                        const user_status = status.code;
                        switch (user_status) {
                            case 'USER_NEED_TO_ACCEPT':
                                // _IO.of(ENDPOINTS.message).
                                // push notification to user if online or notification database
                                break;
                            case 'USER_SUCCESS_JOIN_ROOM':
                                const messageResponse = paramsToMessageResponseVer0({
                                    typeMessage: 'SERVER_MESSAGE',
                                    params: {
                                        type: 'USER_WAS_ADDED',
                                        userId: user_id,
                                        addBy: _id,
                                    },
                                });
                                // Send message of new user was added
                                console.log(_IO);
                                _IO.of(ENDPOINTS.message)
                                    .to(response.payload.room.room_id)
                                    .emit('message__Response', messageResponse);
                                break;
                            default:
                                throw new Error('Invalid user join room status.');
                        }
                    });
                    socket.emit('create-room__Response', response);
                } else {
                    socket.emit('create-room__Response', response);
                }
            })
            .catch((error) => {
                console.log(error);
                socket.emit('create-room__Response', error);
            });
    });
    // Event add to room
    socket.on('add-to-room__Request', async ({ room_id, members = [] }) => {
        // Create room
        roomService
            .joinRoomByRoomId({
                requestSendBy: _id,
                roomId: room_id,
                memberIds: members,
            })
            .then(async (response) => {
                if (response.httpCode === 200) {
                    socket.emit('add-to-room__Response', response);
                } else {
                    socket.emit('add-to-room__Response', response);
                }
            })
            .catch((error) => {
                socket.emit('add-to-room__Response', error);
            });
    });
};

module.exports = {
    create,
    addMember,
    RoomEventBySocketIO,
    joinMessageRooms,
};
