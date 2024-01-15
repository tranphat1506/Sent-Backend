const { UserModel } = require('../models/User/users.model');
const { RoomModel } = require('../models/Messages/room.model');
const {SERVER_STATUS, ROOM_ACTION_STATUS} = require('../constants/status.code');
const { Types, isObjectIdOrHexString } = require('mongoose');
const { logEvents } = require('../middlewares/logEvents');
const { isMyFriend, isAllowAddToRoom, isNeedToAcceptToJoinRoom } = require('./setting.service');
const { MessageRoomMemberModel } = require('../models/Messages/member.model');
const { UserSettingModel } = require('../models/User/users.setting.model');
const { FriendModel } = require('../models/friends.model');

const createRoom = async ({ ownerId, displayName, isGroupChat = false, memberIds = [], byPass = false }) => {
    try {
        if (!ownerId || !displayName)
            return ROOM_ACTION_STATUS.ROOM_COMMON__INVALID_PARAMS
        const roomId = new Types.ObjectId().toHexString();
        const newRoom = new RoomModel({
            room_id: roomId,
            is_group_chat: isGroupChat || memberIds.length > 1,
            created_by: new Types.ObjectId(ownerId),
            display_name: displayName,
        });
        // Add owner to member list (not save yet);
        memberIds.push(ownerId);
        const status = await inviteUsersToMessageRoom(ownerId, memberIds, newRoom, byPass);
        const room = await newRoom.save();
        return {
            ...ROOM_ACTION_STATUS.CREATE_ROOM__CREATE_SUCCESS,
            payload: { room, user_status: status },
        };
    } catch (error) {
        return {...SERVER_STATUS.SERVER__DEFAULT_ERROR, payload: error}
    }
};

const sentInviteJoinRoomByRoomId = async ({ requestSendBy, roomId, memberIds = [], byPass = false }) => {
    try {
        if (!roomId || !memberIds.length || !isObjectIdOrHexString(roomId))
            return ROOM_ACTION_STATUS.ROOM_COMMON__INVALID_PARAMS
        const existRoom = await RoomModel.findOne({ room_id: roomId });
        // Không tìm thấy id phòng
        if (existRoom === null)
            return ROOM_ACTION_STATUS.GET_ROOM__FAILED;
        //Không thể thêm vào phòng nếu không phải là group chat
        if (!existRoom.is_group_chat)
            return ROOM_ACTION_STATUS.ADD_TO_ROOM__CANNOT_ADD_TO_ONE_ONE_ROOM;
        const status = await inviteUsersToMessageRoom(requestSendBy, memberIds, existRoom, byPass);
        const room = await existRoom.save();
        return {
            ...ROOM_ACTION_STATUS.CREATE_ROOM__CREATE_SUCCESS,
            payload: { room, user_status: status },
        };
    } catch (error) {
        return {...SERVER_STATUS.SERVER__DEFAULT_ERROR, payload: error}
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
/**
 * Get all messages rooms by user id
 * @param {string} userId 
 * @returns 
 */
const getUserJoinedRooms = (userId) => {
    return new Promise((resolve, reject) => {
        if (!userId || !isObjectIdOrHexString(userId))
            return resolve(ROOM_ACTION_STATUS.ROOM_COMMON__INVALID_PARAMS);
        MessageRoomMemberModel.aggregate([
            {
                $match: {
                    user_id: new Types.ObjectId(userId),
                    status: 'Accepted'
                },
            },
            {
                $lookup: {
                    from: 'messagerooms',
                    localField: 'room_id',
                    foreignField: 'room_id',
                    as: 'room_detail'
                }
            },
            {
                $unwind: '$room_detail'
            }
        ])
            .then((rooms) => {
                return resolve({
                    message: `Success get rooms of userId::${userId}`,
                    payload: rooms,
                    httpCode: 200,
                });
            })
            .catch((error) => {
                return reject({...SERVER_STATUS.SERVER__DEFAULT_ERROR, payload: error})
            });
    });
};

const inviteUsersToMessageRoom = async (request_send_by, memberIds = [], room, bypass = false) => {
    return new Promise((resolve, reject) => {
        if (!memberIds || !memberIds.length || !room) return resolve({...ROOM_ACTION_STATUS.ROOM_COMMON__INVALID_PARAMS, payload: []});
        if (!request_send_by && !bypass)
            return resolve({...ROOM_ACTION_STATUS.ROOM_COMMON__INVALID_PARAMS, payload: []})
        const objectIds = memberIds.map((id) => new Types.ObjectId(id));
        return UserSettingModel.find({ user_id: { $in: objectIds } })
            .then(async (users) => {
                // Nếu không tìm thấy bất kỳ user nào
                if (!users?.length)
                    return resolve(
                        memberIds.map((id) => {
                            return {...ROOM_ACTION_STATUS.ADD_TO_ROOM__USER_NOT_FOUND, user_id: id};
                        }),
                    );
                // Get friend list of request user
                const friendList = await FriendModel.find({
                    user_id: new Types.ObjectId(request_send_by),
                    friend_id: {$in: objectIds},
                    status: 'Accepted'
                })
                // Get exists member in room
                const memberList = await MessageRoomMemberModel.find({
                    user_id: {$in: objectIds},
                    room_id: new Types.ObjectId(room.room_id),
                })
                // Create a user object for an exist user
                const usersMap = {};
                users.forEach((user) => {
                    usersMap[user.user_id.toString()] = user;
                    // Append the friend status
                    usersMap[user.user_id.toString()].is_friend = friendList.includes({friend_id: user.user_id});
                    const memberInList = memberList.find(member=>member.user_id === user.user_id);
                    if (memberInList){
                        usersMap[user.user_id.toString()].response_invite = memberInList.status;
                    }
                });
                const result = await Promise.all(
                    memberIds.map((memberId) => {
                        return new Promise(async (resolve, reject) => {
                            const isSelf = String(request_send_by) === String(memberId);
                            const userSetting = usersMap[memberId];
                            if (!userSetting)
                                return resolve({...ROOM_ACTION_STATUS.ADD_TO_ROOM__USER_NOT_FOUND, user_id: memberId});
                            // If user already in group
                            if (userSetting.response_invite === 'Accepted'){
                                return resolve({...ROOM_ACTION_STATUS.ADD_TO_ROOM__USER_ALREADY_JOIN, user_id: memberId})
                            }
                            // If already sent request for this user
                            if (userSetting.response_invite === 'Pending'){
                                return resolve({...ROOM_ACTION_STATUS.ADD_TO_ROOM__ALREADY_INVITE, user_id: memberId})
                            }
                            const relationship = isMyFriend(
                                isSelf ||
                                    userSetting.is_friend,
                                true,
                            );
                            // Check if user allow you to add to the room
                            if (!isAllowAddToRoom(userSetting, relationship, bypass))
                                return resolve({...ROOM_ACTION_STATUS.ADD_TO_ROOM__USER_NOT_ALLOW, user_id: memberId});
                            // Set user to member room
                            const newMember = new MessageRoomMemberModel({
                                user_id: new Types.ObjectId(memberId),
                                room_id: new Types.ObjectId(room.room_id),
                                level: isSelf ? 9999 : 0,
                                request_by: new Types.ObjectId(request_send_by),
                                request_time: Date.now(),
                            })
                            // Check if user not need to accept to join room.
                            if (!isNeedToAcceptToJoinRoom(userSetting, relationship, bypass)) {
                                newMember.status = 'Accepted'; // Accept now
                                // Save and response success sent invite to this user
                                await newMember.save();
                                return resolve({...ROOM_ACTION_STATUS.ADD_TO_ROOM__SUCCESS_JOIN_ROOM, user_id: memberId});
                            } else {
                                newMember.status = 'Pending'
                                // Save and response success sent invite to this user
                                await newMember.save();
                                return resolve({...ROOM_ACTION_STATUS.ADD_TO_ROOM__SUCCESS_SENT_INVITE, user_id: memberId});
                            }
                            
                        });
                    }),
                );
                return resolve({...ROOM_ACTION_STATUS.ADD_TO_ROOM__INVITE_USERS, payload: result});
            })
            .catch((error) => {
                return reject({...SERVER_STATUS.SERVER__DEFAULT_ERROR, payload: error});
            });
    });
};

module.exports = {
    createRoom,
    sentInviteJoinRoomByRoomId,
    checkPermissionToAction,
    getOnlineStatusRoom,
    getUserJoinedRooms,
    inviteUsersToMessageRoom
};
