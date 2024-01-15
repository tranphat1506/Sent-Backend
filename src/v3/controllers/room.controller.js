const { getPayload } = require('../helpers/jwt.helper');
const { paramsToMessageResponseVer0 } = require('../services/message.service');
const roomService = require('../services/room.service');
const { joinRoomById, addRoom } = require('../services/socket.io/common.service');
const { ENDPOINTS } = require('../routers/socketio.endpoints');

const create = async (req, res) => {
    // get id
    const a_token = req.headers.authorization?.split(' ')[1];
    const _id = getPayload(a_token)._id;

    // get query
    // const members

    // Create room
    roomService
        .createRoom({
            ownerId: _id,
            displayName: 'Test',
            isGroupChat: false,
            memberIds: ['6573e5e61dfa33a7a41d503b', '6574b473239ae37696fb8245', '6574bd9b39d5aa97deff4251'],
        })
        .then(async (response) => {
            if (response.httpCode === 200){
                await addRoom(response.payload.room.room_id, response.payload.room);
                return res.status(response.httpCode).json({
                    code: response.httpCode,
                    message: response.message,
                    name: response.name,
                    payload: response.payload,
                });
            }
            return res.status(response.httpCode).json({
                code: response.httpCode,
                name: response.name,
                message: response.message,
            });
        })
        .catch((error) => {
            // Lỗi server
            process.env.NODE_ENV != 'development'
            ? logEvents(`${error.name}: ${error.message}\n${error.payload.name}: ${error.payload.message}`, `errors`)
            : console.log(error);
            return res.status(error.httpCode).json({
                httpCode: error.httpCode,
                name: error.name,
                message: error.message,
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
                name: error.name,
                message: response.message,
                payload: response.payload,
            });
        })
        .catch((error) => {
            // Lỗi server
            process.env.NODE_ENV != 'development'
            ? logEvents(`${error.name}: ${error.message}\n${error.payload.name}: ${error.payload.message}`, `errors`)
            : console.log(error);
            return res.status(error.httpCode).json({
                httpCode: error.httpCode,
                name: error.name,
                message: error.message,
            });
        });
};

const getMessageRooms = async (req, res)=>{
    // get id
    const a_token = req.headers.authorization?.split(' ')[1];
    const _id = getPayload(a_token)._id;

    roomService.getUserJoinedRooms(_id)
    .then((response)=>{
        res.status(response.httpCode).json(response);
    })
    .catch((error)=>{
        console.log(error);
        res.status(error.httpCode).json(error)
    })
}

const joinMessageRooms = async (socket, userId) => {
    return roomService
        .getUserJoinedRooms(userId)
        .then(({ payload }) => {
            if (!payload) return false;
            return {
                rooms: payload,
                joinPromises: Promise.all(
                    payload.map((room) => joinRoomById(room.room_id, socket)),
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
                if (response.httpCode === 200) {
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
    // Event request to get rooms
    socket.on('get-message-rooms__Request', async ()=>{
        console.log(_id);
        roomService.getUserJoinedRooms(_id)
        .then((response)=>{
            _IO.of(ENDPOINTS.message).to('657fe7faff7d32af9a1cd75d').emit('get-message-rooms__Response', response);
        })
        .catch((err)=>{
            _IO.of(ENDPOINTS.message).to(_id).emit('get-message-rooms__Response', err);
        })
    })
};

module.exports = {
    create,
    addMember,
    RoomEventBySocketIO,
    joinMessageRooms,
    getMessageRooms
};
