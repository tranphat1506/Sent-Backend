const { RoomModel } = require('../models/room.model');
const { Types } = require('mongoose');
const createRoom = async (ownerId, displayName, isGroupChat = false, memberIds = []) => {
    return new Promise(async (resolve, reject) => {
        const roomId = new Types.ObjectId().toHexString();
        if (!ownerId || !displayName || !memberIds.length)
            return reject({ isCreateSuccess: false, message: 'Invalid params!', httpCode: 401 });
        const membersMap = {};
        memberIds.forEach((id) => {
            const isOnline = !!_USERS[id] || _USERS[id]?.is_online || false;
            const lastActive = _USERS[id]?.last_active || undefined;
            membersMap[id] = { user_id: id, last_active: lastActive, is_online: isOnline };
        });
        console.log('map', membersMap);
        const newRoom = new RoomModel({
            room_id: roomId,
            is_group_chat: isGroupChat || memberIds.length > 1,
            owner: new Types.ObjectId(ownerId),
            display_name: displayName,
            members: membersMap,
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
                return reject({
                    isCreateSuccess: false,
                    message: '505::Fail to create room.',
                    payload: error,
                    httpCode: 505,
                });
            });
    });
};

module.exports = {
    createRoom,
};
