const { RoomModel } = require('../models/room.model');
const { Types, isObjectIdOrHexString } = require('mongoose');
const { logEvents } = require('../middlewares/logEvents');

const createRoom = async (ownerId, displayName, isGroupChat = false, memberIds = []) => {
    return new Promise(async (resolve, reject) => {
        const roomId = new Types.ObjectId().toHexString();
        if (!ownerId || !displayName || !memberIds.length)
            return reject({ isCreateSuccess: false, message: 'Invalid params!', httpCode: 400 });
        const newRoom = new RoomModel({
            room_id: roomId,
            is_group_chat: isGroupChat || memberIds.length > 1,
            owner: new Types.ObjectId(ownerId),
            display_name: displayName,
            members: {},
        });
        memberIds.forEach((id) => {
            const isOnline = !!_USERS[id] || _USERS[id]?.is_online || false;
            const lastActive = _USERS[id]?.last_active || undefined;
            newRoom.members.set(id, { user_id: id, last_active: lastActive, is_online: isOnline });
        });
        newRoom
            .save()
            .then((room) => {
                return resolve({
                    isCreateSuccess: true,
                    message: `Create room success at ${room.created_at}!`,
                    payload: room,
                    httpCode: 200,
                });
            })
            .catch((error) => {
                process.env.NODE_ENV != 'development'
                    ? logEvents(`${id}: ${message}`, `errors`)
                    : console.log(`${id}: ${message}`);
                return reject({
                    isCreateSuccess: false,
                    message: '500::Fail to create room.',
                    payload: error,
                    httpCode: 500,
                });
            });
    });
};

const joinRoomByRoomId = async (roomId, memberIds = []) => {
    return new Promise(async (resolve, reject) => {
        if (!roomId || !memberIds.length || !isObjectIdOrHexString(roomId))
            return reject({
                httpCode: 400,
                message: 'Invalid params!',
            });
        RoomModel.findOne({ room_id: roomId })
            .then(async (existRoom) => {
                // Không tìm thấy id phòng
                if (existRoom === null)
                    return reject({
                        message: `Room ${roomId} not exist.`,
                        httpCode: 400,
                    });
                // Không thể thêm vào phòng nếu không phải là group chat
                // if (!existRoom.is_group_chat)
                //     return reject({
                //         message: `Room ${roomId} is a 1-1 room! You cannot add more than one people.`,
                //         httpCode: 400,
                //     });

                const addStatus = memberIds.map((memberId) => {
                    if (!isObjectIdOrHexString(memberId))
                        return {
                            status: false,
                            room_id: roomId,
                            user_id: memberId,
                            message: `Member with id:${memberId} had invalid user_id !`,
                        };
                    if (existRoom.members.get(memberId)) {
                        return {
                            status: false,
                            room_id: roomId,
                            user_id: memberId,
                            message: `Member with id:${memberId} already in room!`,
                        };
                    }
                    existRoom.members.set(memberId, {
                        user_id: memberId,
                        last_active: _USERS[memberId].last_active,
                        is_online: _USERS[memberId].is_online,
                    });
                    return {
                        status: true,
                        room_id: roomId,
                        user_id: memberId,
                        message: `Member with id:${memberId} success add to room:${roomId}!`,
                    };
                });
                await existRoom.save();
                return resolve({
                    message: `Success add all member to room:${roomId}.`,
                    payload: addStatus,
                    httpCode: 200,
                });
            })
            .catch((error) => {
                // Lỗi server
                console.log(error);
                process.env.NODE_ENV != 'development'
                    ? logEvents(`${error.name}: ${error.message}`, `errors`)
                    : console.log(`${error.name}: ${error.message}`);
                return reject({
                    message: `500::Fail to add members to room: ${roomId}.`,
                    payload: error,
                    httpCode: 500,
                });
            });
        memberIds.map(() => {});
    });
};

const checkPermissionToAction = (actionType, userId, roomId) => {
    return new Promise((resolve, reject) => {
        if (!actionType || !userId || !isObjectIdOrHexString(userId))
            return reject({ status: false, message: 'Bad request!', httpCode: 400 });
        switch (actionType) {
            case 'MESSAGE_TEXT':
                // Không tìm thấy room với roomId??
                // Maybe lỗi server
                if (!_ROOMS[roomId]) return reject({ status: false, message: 'Server is busy!', httpCode: 500 });
                if (!_ROOMS[roomId][userId])
                    return reject({
                        status: false,
                        message: `This user_id:${userId} not allow to message to this room:${roomId}!`,
                        httpCode: 400,
                    });
                return resolve({ status: true, message: `OK!`, httpCode: 200 });
            default:
                return reject({ status: false, message: 'Server is busy!', httpCode: 500 });
        }
    });
};

module.exports = {
    createRoom,
    joinRoomByRoomId,
    checkPermissionToAction,
};
