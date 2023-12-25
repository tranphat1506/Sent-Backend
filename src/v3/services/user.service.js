const { UserModel } = require('../models/users.model');
const { USER_STATUS, SERVER_STATUS } = require('../constants/status.code');
const _ = require('underscore');
const { Types } = require('mongoose');
const { isAllowAddFriend } = require('./setting.service');
const { RoomModel } = require('../models/room.model');

const getUserInfoById = async (_id) => {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ _id: _id })
            .then((user) => {
                if (_.isEmpty(user)) {
                    return resolve(USER_STATUS.USER__UNDEFINED);
                }
                const cutSomePrivateInfoFromUser = {
                    _id: _id,
                    username: user.account_details.user_name,
                    role: user.account_details.role,
                    email: {
                        is_verify: user.account_details.email.is_verify,
                        details: user.account_details.email.details,
                    },
                    phone: {
                        is_verify: user.account_details.phone.is_verify,
                        details: user.account_details.phone.details,
                    },
                    created_at: user.account_details.created_at,
                    sex: user.info_details.sex,
                    avt_url: user.info_details.avatar_url,
                    display_name: user.info_details.display_name,
                    room_details: user.room_details,
                    friend_details: user.friend_details,
                    settings: user.settings,
                };
                // if this is author account
                return resolve({
                    ...USER_STATUS.USER__GET_OK,
                    user: { ...cutSomePrivateInfoFromUser },
                });
            })
            .catch((error) => {
                return reject({ ...SERVER_STATUS.SERVER__DEFAULT_ERROR, error });
            });
    });
};

const addToFriendList = async (request_send_by, friend_id) => {
    return new Promise((resolve, reject) => {
        if (!request_send_by || !friend_id)
            return resolve({ code: 400, message: 'Request or friend id is invalid!', name: 'Type Error' });
        if (request_send_by === friend_id)
            return resolve({ code: 403, message: 'You cannot add friend yourself', name: 'Self Add Friend' });
        const ids = [new Types.ObjectId(request_send_by), new Types.ObjectId(friend_id)];
        return UserModel.find({ _id: { $in: ids } })
            .then(async (users) => {
                // Nếu không tìm thấy bất kỳ user nào
                if (!(users.length === 2))
                    return resolve({ code: 404, message: 'Cannot found one of this ids.', name: 'Not Found' });
                const sortedUsers = ids.map((id) =>
                    users.find((user) => {
                        if (user._id.toString() === id.toString()) return user;
                    }),
                );
                const userDetail = sortedUsers[0];
                const friendDetail = sortedUsers[1];
                if (friendDetail['friend_details']?.['accepted_list']?.has(request_send_by))
                    return resolve({
                        id: friend_id,
                        code: 200,
                        payload: friendDetail['friend_details']?.['accepted_list']?.get(request_send_by),
                        message: 'This user already your friend with you',
                        name: 'OK',
                        isBothFriend: true,
                    });
                // If friend already in your waiting accept friend list
                if (userDetail.friend_details?.waiting_accept_list?.has(friend_id)) {
                    const rooms = await RoomModel.find({ room_id: { $in: ids } });
                    if (!rooms.length === 2) throw new Error('Lack of one of two rooms');
                    const sortedUserRooms = ids.map((id) =>
                        rooms.find((room) => {
                            if (room.room_id.toString() === id.toString()) return room;
                        }),
                    );
                    const userRoom = sortedUserRooms[0];
                    const friendRoom = sortedUserRooms[1];
                    const currentTime = Date.now();
                    const friendRequest = userDetail.friend_details.waiting_accept_list.get(friend_id);
                    // Add both to friend list
                    userDetail.friend_details.accepted_list.set(friend_id, {
                        ...friendRequest,
                        response_time: `${currentTime}`,
                    });
                    friendDetail.friend_details.accepted_list.set(request_send_by, {
                        user_id: new Types.ObjectId(request_send_by),
                        friendlist_id: request_send_by,
                        response_time: `${currentTime}`,
                    });
                    // Remove both friend request
                    userDetail.friend_details.waiting_accept_list.delete(friend_id);
                    friendDetail.friend_details.waiting_accept_list.delete(request_send_by); // Maybe have

                    // add to room
                    userRoom.members.set(friend_id, {
                        user_id: friend_id,
                        last_active: undefined,
                        is_online: undefined,
                    });
                    friendRoom.members.set(request_send_by, {
                        user_id: request_send_by,
                        last_active: undefined,
                        is_online: undefined,
                    });
                    await Promise.all([
                        await userRoom.save(),
                        await friendRoom.save(),
                        await userDetail.save(),
                        await friendDetail.save(),
                    ]);
                    return resolve({
                        id: friend_id,
                        payload: friendDetail.friend_details.accepted_list.get(request_send_by),
                        code: 200,
                        message: `Friend accept success.`,
                        name: '200',
                        isBothFriend: true,
                    });
                }
                if (!isAllowAddFriend(friendDetail['settings']))
                    return resolve({
                        id: friend_id,
                        code: 403,
                        message: `This user prevent add friend`,
                        name: 'No Permission',
                    });
                // Set to waiting accepted friend list
                friendDetail.friend_details['waiting_accept_list'].set(request_send_by, {
                    user_id: new Types.ObjectId(request_send_by),
                    friendlist_id: request_send_by,
                });
                // Save
                // save user
                const success = await friendDetail.save();
                return resolve({
                    id: friend_id,
                    payload: success.friend_details.waiting_accept_list.get(request_send_by),
                    code: 200,
                    message: `Success`,
                    name: '200',
                });
            })
            .catch((error) => {
                return reject(error);
            });
    });
};

module.exports = {
    getUserInfoById,
    addToFriendList,
};
