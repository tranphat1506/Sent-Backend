const { UserModel } = require('../models/User/users.model');
const { UserSettingModel } = require('../models/User/users.setting.model');

const { RoomModel } = require('../models/Messages/room.model');
const { USER_STATUS, SERVER_STATUS, FRIEND_ACTION_STATUS } = require('../constants/status.code');
const _ = require('underscore');
const { Types } = require('mongoose');
const { isAllowAddFriend } = require('./setting.service');
const { FriendModel, FRIEND_STATUS } = require('../models/friends.model');

/**
 * Get user info by id, but cut some privacy info (password, ...)
 * @param {string} _id 
 * @returns 
 */
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

/**
 * This function return promise response message add friend of two user
 * @param {string} request_send_by 
 * @param {string} friend_id 
 * @returns 
 */
const addFriendByUserId = async (request_send_by, friend_id) => {
    return new Promise((resolve, reject) => {
        // Checking param valid
        if (!request_send_by || !friend_id)
            return resolve(FRIEND_ACTION_STATUS.ADD_FRIEND__MISSING_PARAMS || FRIEND_ACTION_STATUS.ADD_FRIEND__INVALID_PARAMS);
        if (request_send_by === friend_id)
            return resolve(FRIEND_ACTION_STATUS.ADD_FRIEND__SELF_ADD_FRIEND);
        // Parse string id to object id array
        const ids = [new Types.ObjectId(request_send_by), new Types.ObjectId(friend_id)]
        // Check if valid users
        return UserSettingModel.find({
            user_id: {$in : ids}
        })
        .then(async (existUserSettings)=>{
            // Check if valid users
            if (existUserSettings.length < 2){
                return resolve(FRIEND_ACTION_STATUS.ADD_FRIEND__INVALID_PARAMS);
            }
            // Check if exist friend request
            const existFriendRequests = await FriendModel.find({
                user_id: {$in: ids},
                friend_id: {$in: ids}
            })
            const requestCount = existFriendRequests.length;
            // If exist 2 request, then two user already friend
            if (requestCount === 2){
                return resolve(FRIEND_ACTION_STATUS.ADD_FRIEND__ALREADY_FRIEND);
            }
            // If exist 1 request
            else if (requestCount === 1){
                const fR = existFriendRequests[0];
                // if you already sent request, then return response;
                if (fR.user_id === ids[0])
                    return resolve(FRIEND_ACTION_STATUS.ADD_FRIEND__ALREADY_REQUEST);
                // if their already sent request, then accept the request and create a new request for you.
                const timeNow = Date.now()
                // Accept the request from their
                fR.status = 'Accepted';
                fR.response_time = timeNow;
                // Create a new request for you
                const newFR = new FriendModel({
                    user_id: ids[0],
                    friend_id: ids[1],
                    status: 'Accepted',
                    response_time: timeNow,
                    request_time: timeNow
                })
                await newFR.save(); // Save
                return resolve(FRIEND_ACTION_STATUS.ADD_FRIEND__ACCEPT_REQUEST_SUCCESS)
            }
            // Create a new request for you
            else{
                const friendSetting = existUserSettings[0].user_id === friend_id ? existUserSettings[0] : existUserSettings[1];
                // Check if other user allow to add friend
                if (!isAllowAddFriend(friendSetting)){
                    return resolve(FRIEND_ACTION_STATUS.ADD_FRIEND__NOT_ALLOW);
                }
                await new FriendModel({
                    user_id: ids[0],
                    friend_id: ids[1],
                    status: 'Pending',
                    request_time: Date.now()
                }).save() // Create and save together
                return resolve(FRIEND_ACTION_STATUS.ADD_FRIEND__CREATE_REQUEST_SUCCESS);
            }
        })
        .catch((error)=>{
            return reject({...SERVER_STATUS.SERVER__DEFAULT_ERROR, payload: error});
        })
        
    });
};

module.exports = {
    getUserInfoById,
    addFriendByUserId,
};
