const { UserModel } = require('../models/users.model');
const { USER_STATUS, SERVER_STATUS } = require('../constants/status.code');
const _ = require('underscore');
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
                return resolve({ ...USER_STATUS.USER__GET_OK, user: { ...cutSomePrivateInfoFromUser } });
            })
            .catch((error) => {
                return reject(SERVER_STATUS.SERVER__DEFAULT_ERROR);
            });
    });
};

module.exports = {
    getUserInfoById,
};
