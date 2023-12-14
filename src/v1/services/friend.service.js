const { Types } = require('mongoose');
const { UserModel } = require('../models/users.model');
const { isAllowAddFriend } = require('./setting.service');

const addToFriendList = async (request_send_by, friend_id, bypass = false) => {
    return new Promise((resolve, reject) => {
        if (!memberIds || !memberIds.length) return resolve([]);
        if (!request_send_by && !bypass)
            return reject({ code: 400, message: 'Request id is invalid!', name: 'Type Error' });
        return UserModel.findOne({ _id: new Types.ObjectId(friend_id) })
            .then(async (userDetail) => {
                // Nếu không tìm thấy bất kỳ user nào
                if (!userDetail)
                    return resolve({ id: friend_id, code: 404, message: 'Cannot found this user.', name: 'Not Found' });
                if (userDetail['friend_details']?.['accepted_list']?.[request_send_by])
                    return resolve({
                        id: friend_id,
                        code: 200,
                        message: 'This user already your friend with you',
                        name: 'OK',
                    });
                if (!isAllowAddFriend(userDetail['settings']))
                    return resolve({
                        id: friend_id,
                        code: 403,
                        message: `This user prevent add friend`,
                        name: 'No Permission',
                    });
                // Set to wating accepted friend list for 2
                userDetail.friend_details['waiting_accept_list'].set(String(request_send_by), {
                    user_id: new Types.ObjectId(request_send_by),
                    friendlist_id: request_send_by,
                });
                // Save
                // save user
                const success = await userDetail.save();
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
    addToFriendList,
};
