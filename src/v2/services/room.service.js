const { RoomModel } = require('../models/room.model');
const { UserModel } = require('../models/users.model');

const { Types, isObjectIdOrHexString } = require('mongoose');
const { logEvents } = require('../middlewares/logEvents');
const { isMyFriend, isAllowAddToRoom, isNeedToAcceptToJoinRoom } = require('./setting.service');

const createRoom = async ({ ownerId, displayName, isGroupChat = false, memberIds = [], byPass = false }) => {
    try {
        const roomId = new Types.ObjectId().toHexString();
        if (!ownerId || !displayName || !memberIds.length)
            return {
                isCreateSuccess: false,
                message: 'Invalid params!',
                httpCode: 400,
            };
        const newRoom = new RoomModel({
            room_id: roomId,
            is_group_chat: isGroupChat || memberIds.length > 1,
            owner: new Types.ObjectId(ownerId),
            display_name: displayName,
            members: {},
        });
        memberIds.push(ownerId);
        const status = await addToUserRoom(ownerId, memberIds, newRoom, byPass);
        const room = await newRoom.save();
        return {
            isCreateSuccess: true,
            message: `Create room success at ${room.created_at}!`,
            payload: { room, user_status: status },
            httpCode: 200,
        };
    } catch (error) {
        process.env.NODE_ENV != 'development'
            ? logEvents(`${error.name}: ${error.message}`, `errors`)
            : console.log(`${error.name}: ${error.message}`);
        return {
            isCreateSuccess: false,
            message: '500::Fail to create room.',
            payload: error,
            httpCode: 500,
        };
    }
};

const joinRoomByRoomId = async ({ requestSendBy, roomId, memberIds = [], byPass = false }) => {
    try {
        if (!roomId || !memberIds.length || !isObjectIdOrHexString(roomId))
            return {
                httpCode: 400,
                message: 'Invalid params!',
            };
        const existRoom = await RoomModel.findOne({ room_id: roomId });
        // Không tìm thấy id phòng
        if (existRoom === null)
            return {
                message: `Room ${roomId} not exist.`,
                httpCode: 400,
            };
        //Không thể thêm vào phòng nếu không phải là group chat
        if (!existRoom.is_group_chat)
            return {
                message: `Room ${roomId} is a 1-1 room! You cannot add more than one people.`,
                httpCode: 400,
            };

        const status = await addToUserRoom(requestSendBy, memberIds, existRoom, byPass);
        const room = await existRoom.save();
        return {
            message: `Success add member to room:${roomId}.`,
            payload: { room, user_status: status },
            httpCode: 200,
        };
    } catch (error) {
        // Lỗi server
        process.env.NODE_ENV != 'development'
            ? logEvents(`${error.name}: ${error.message}`, `errors`)
            : console.log(`${error.name}: ${error.message}`);
        return {
            message: `500::Fail to add members to room: ${roomId}.`,
            payload: error,
            httpCode: 500,
        };
    }
};

const checkPermissionToAction = (actionType, userId, roomId) => {
    return new Promise((resolve, reject) => {
        if (!actionType || !userId || !isObjectIdOrHexString(userId))
            return reject({ status: false, message: 'Bad request!', httpCode: 400 });
        switch (actionType) {
            case 'MESSAGE_TEXT':
                // Không tìm thấy room với roomId??
                // Maybe lỗi server
                if (!_ROOMS[roomId])
                    return reject({
                        status: false,
                        message: 'Server is busy!',
                        httpCode: 500,
                    });
                if (!_ROOMS[roomId].members.get(userId))
                    return reject({
                        status: false,
                        message: `This user_id:${userId} not allow to message to this room:${roomId}!`,
                        httpCode: 400,
                    });
                return resolve({ status: true, message: `OK!`, httpCode: 200 });
            default:
                return reject({
                    status: false,
                    message: 'Invalid type!',
                    httpCode: 400,
                });
        }
    });
};

const getOnlineStatusRoom = async (userId) => {
    return new Promise((resolve, reject) => {
        const room = _ROOMS[userId];
        if (!room)
            return reject({
                name: 'Error:',
                message: `Missing status room with id:${userId}`,
            });
        return resolve(room);
    });
};

const getUserRooms = (userId) => {
    return new Promise((resolve, reject) => {
        if (!userId || !isObjectIdOrHexString(userId))
            return reject({
                httpCode: 400,
                message: 'Invalid params!',
            });
        UserModel.aggregate([
            {
                $match: {
                    _id: new Types.ObjectId(userId),
                },
            },
            {
                $project: {
                    _id: 1,
                    messagesRooms: '$room_details.message_room.accepted_list',
                },
            },
        ])
            .then((payload) => {
                if (payload.length !== 1)
                    return reject({
                        httpCode: 400,
                        message: `Invalid user id::${user_id}`,
                    });
                return resolve({
                    message: `Success get rooms of userId::${userId}`,
                    payload: payload[0],
                    httpCode: 200,
                });
            })
            .catch((error) => {
                // Lỗi server
                process.env.NODE_ENV != 'development'
                    ? logEvents(`${error.name}: ${error.message}`, `errors`)
                    : console.log(`${error.name}: ${error.message}`);
                return reject({
                    message: `500::Fail to add members to room: ${roomId}.`,
                    payload: error,
                    httpCode: 500,
                });
            });
    });
};

const addToUserRoom = async (request_send_by, memberIds = [], room, bypass = false) => {
    return new Promise((resolve, reject) => {
        if (!memberIds || !memberIds.length || !room) return resolve([]);
        if (!request_send_by && !bypass)
            return reject({
                code: 400,
                message: 'Request id is invalid!',
                name: 'Type Error',
            });
        const objectIds = memberIds.map((id) => new Types.ObjectId(id));
        return UserModel.find({ _id: { $in: objectIds } })
            .then(async (users) => {
                // Nếu không tìm thấy bất kỳ user nào
                if (!users?.length)
                    return resolve(
                        memberIds.map((id) => {
                            return {
                                id,
                                code: 'USER_NOT_FOUND',
                                message: 'Cannot found this user.',
                                name: 'Not Found',
                            };
                        }),
                    );
                const usersMap = {};
                users.forEach((user) => {
                    usersMap[user._id.toString()] = user;
                });
                const result = await Promise.all(
                    memberIds.map((id) => {
                        return new Promise(async (resolve, reject) => {
                            const userDetail = usersMap[id];
                            if (!userDetail)
                                return resolve({
                                    id,
                                    code: 'USER_NOT_FOUND',
                                    message: 'Cannot found this user.',
                                    name: 'Not Found',
                                });
                            const relationship = isMyFriend(
                                id === request_send_by ||
                                    userDetail['friend_details']['accepted_list'].has(request_send_by),
                                true,
                            );
                            if (!isAllowAddToRoom(userDetail['settings'], relationship, bypass))
                                return resolve({
                                    id,
                                    code: 'USER_PREVENT',
                                    message: `This user prevent ${relationship} add to room`,
                                    name: 'No Permission',
                                });
                            // Set to user room
                            // Not need to push in a not_accept_room
                            if (!isNeedToAcceptToJoinRoom(userDetail['settings'], relationship, bypass)) {
                                userDetail.room_details.message_room['accepted_list'].set(String(room.room_id), {
                                    user_id: new Types.ObjectId(request_send_by),
                                    room_id: room.room_id,
                                    response_time: String(Date.now()),
                                });
                                // Get online state on Redis
                                const isOnline = (await _USERS[id]?.is_online) || false;
                                const lastActive = (await _USERS[id]?.last_active) || undefined;
                                // Set to room members list
                                room.members.set(id, {
                                    user_id: id,
                                    last_active: lastActive,
                                    is_online: isOnline,
                                });
                                // Save
                                // save user
                                return userDetail
                                    .save()
                                    .then(() => {
                                        return resolve({
                                            id,
                                            code: 'USER_SUCCESS_JOIN_ROOM',
                                            message: `User has join room.`,
                                            name: 'Success Join',
                                        });
                                    })
                                    .catch((error) => {
                                        return reject(error);
                                    });
                            } else {
                                userDetail.room_details.message_room['waiting_accept_list'].set(String(room.room_id), {
                                    user_id: new Types.ObjectId(request_send_by),
                                    room_id: room.room_id,
                                });
                                // Save
                                // save user
                                return userDetail
                                    .save()
                                    .then(() => {
                                        return resolve({
                                            id,
                                            code: 'USER_NEED_TO_ACCEPT',
                                            message: `Room request was send to user.`,
                                            name: 'Request Sent',
                                        });
                                    })
                                    .catch((error) => {
                                        return reject(error);
                                    });
                            }
                        });
                    }),
                );
                // await room.save();
                return resolve({
                    code: 200,
                    message: 'Success.',
                    name: 'Add user to room',
                    payload: result,
                });
            })
            .catch((error) => {
                return reject(error);
            });
    });
};

module.exports = {
    createRoom,
    joinRoomByRoomId,
    checkPermissionToAction,
    getOnlineStatusRoom,
    getUserRooms,
};
