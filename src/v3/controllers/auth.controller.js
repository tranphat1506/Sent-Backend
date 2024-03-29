const GlobalSetting = require('../configs/globalSetting.config');
const jwtHelper = require('../helpers/jwt.helper');
const _ = require('underscore');
const { UserModel } = require('../models/User/users.model');
const { RoomModel } = require('../models/Messages/room.model');
const { MessageRoomMemberModel } = require('../models/Messages/member.model');


const { Types } = require('mongoose');
const joiValidation = require('../helpers/joi.helper');
const { sendVerifyEmail } = require('../services/mail.service');
// const { v4: uuidv4 } = require('uuid');
const { logEvents } = require('../middlewares/logEvents');
const md5 = require('md5');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_LIFE = process.env.ACCESS_TOKEN_LIFE;
const REFRESH_TOKEN_LIFE = process.env.REFRESH_TOKEN_LIFE;
const bcrypt = require('bcrypt');
const { createRoom } = require('../services/room.service');
const { UserSettingModel } = require('../models/User/users.setting.model');
const saltRounds = 8;
const signIn = async (req, res) => {
    const { account, password, remember_pwd } = req.body;
    try {
        const userWasFound = await UserModel.findOne({
            $or: [
                { 'account_details.user_name': account },
                { 'account_details.email.details': account },
                { 'account_details.phone.details': account },
            ],
        });
        if (_.isNull(userWasFound))
            return res.status(400).json({
                code: 400,
                message: 'Tài khoản hoặc mật khẩu không hợp lệ!',
            });
        if (!userWasFound.account_details.email.is_verify && !userWasFound.account_details.phone.is_verify)
            return res.status(400).json({
                code: 400,
                message: 'Tài khoản này vẫn chưa xác thực!',
            });
        const passwordMatch = await bcrypt.compare(password, userWasFound.account_details.password);
        if (!passwordMatch)
            return res.status(400).json({
                code: 400,
                message: 'Tài khoản hoặc mật khẩu không hợp lệ!',
            });
        const cutSomePrivateInfoFromUser = {
            _id: userWasFound._id,
            username: userWasFound.account_details.user_name,
            role: userWasFound.account_details.role,
            email: {
                is_verify: userWasFound.account_details.email.is_verify,
                details: userWasFound.account_details.email.details,
            },
            phone: {
                is_verify: userWasFound.account_details.phone.is_verify,
                details: userWasFound.account_details.phone.details,
            },
            created_at: userWasFound.account_details.created_at,
            sex: userWasFound.info_details.sex,
            avt_url: userWasFound.info_details.avatar_url,
            display_name: userWasFound.info_details.display_name,
            room_details: userWasFound.room_details,
            friend_details: userWasFound.friend_details,
            settings: userWasFound.settings,
        };
        Promise.all([
            jwtHelper.generateToken(cutSomePrivateInfoFromUser, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_LIFE),
            jwtHelper.generateToken(cutSomePrivateInfoFromUser, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_LIFE),
        ]).then(async (arrayToken) => {
            // neu client muon luu tai khoan
            if (remember_pwd) {
                return res.status(200).json({
                    code: 200,
                    user: cutSomePrivateInfoFromUser,
                    a_token: arrayToken[0].encoded,
                    r_token: arrayToken[1].encoded,
                });
            }
            return res.status(200).json({
                code: 200,
                user: cutSomePrivateInfoFromUser,
                a_token: arrayToken[0].encoded,
            });
        });
        // Catch error
    } catch (error) {
        process.env.NODE_ENV != 'development'
            ? logEvents(`${error.name}: ${error.message}`, `errors`)
            : console.log(`${error.name}: ${error.message}`);
        return res.status(500).json({
            message: 'Hệ thống đang bận!',
        });
    }
};
const signUp = async (req, res) => {
    const { email, user_name, password, display_name, accept_marketing, birth, sex } = req.body;
    //
    const errorValidation = joiValidation.signUp({
        birth: new Date(birth.year + '-' + birth.month + '-' + birth.day).toISOString(),
        sex: sex.info,
        email,
        user_name,
        password,
        display_name,
    });
    if (errorValidation) {
        return res.status(400).json({
            httpCode: 400,
            message: errorValidation.message,
            type: errorValidation.details[0].context.key,
        });
    }
    try {
        const hashPassword = await bcrypt.hash(password, saltRounds);
        const userInDB = await UserModel.findOne({
            $or: [
                { 'account_details.user_name': user_name },
                {
                    'account_details.email.details': email,
                    'account_details.email.is_verify': true,
                },
            ],
        });
        if (_.isNull(userInDB)) {
            const id = new Types.ObjectId().toHexString();
            // save user info to data
            const newUser = new UserModel({
                _id: id,
                account_details: {
                    user_name,
                    password: hashPassword,
                    email: {
                        details: email,
                        verify_code: md5(user_name + id),
                        accept_marketing: accept_marketing,
                    },
                },
                info_details: {
                    display_name,
                    sex,
                    birth,
                },
            });
            const success = await newUser.save();
            // send verify email link to device
            const hashVerifyLink =
                `${process.env.BE_URL}:${process.env.PORT}` +
                '/api/auth/verify/?method=email&h=' +
                md5(user_name + success._id);
            if (process.env.NODE_ENV === 'development') console.log(hashVerifyLink);
            else await sendVerifyEmail(hashVerifyLink, user_name, email);

            //send OK status
            return res.status(200).json({
                httpCode: 200,
                message: 'Đăng ký thành công!',
            });
        }
        // if already have account
        return res.status(400).json({
            httpCode: 400,
            message: 'Người dùng đã tồn tại!',
        });

        // Catch error
    } catch (error) {
        console.log(error);
        process.env.NODE_ENV != 'development'
            ? logEvents(`${error.name}: ${error.message}`, `errors`)
            : console.log(`${error.name}: ${error.message}`);
        return res.status(500).json({
            code: 500,
            message: 'Hệ thống đang bận!',
        });
    }
};

const signOut = (req, res) => {
    res.clearCookie('a_token');
    res.clearCookie('r_token');
    return res.sendStatus(200);
};

const refreshAccessToken = async (req, res) => {
    if (!req.headers.authorization) {
        // no token provided
        return res.status(403).json({
            code: 403,
            message: 'No token provided or token expired!',
        });
    }
    try {
        const r_token = req.headers.authorization?.split(' ')[1];
        const { decoded } = await jwtHelper.verifyToken(r_token, REFRESH_TOKEN_SECRET);
        const newAccessToken = await jwtHelper.generateToken(decoded, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_LIFE);
        return res.status(200).json({
            token: newAccessToken.encoded,
        });
    } catch (error) {
        process.env.NODE_ENV != 'development'
            ? logEvents(`${error.name}: ${error.message}`, `errors`)
            : console.log(`${error.name}: ${error.message}`);
        return res.status(500).json({
            code: 500,
            message: 'Hệ thống đang bận!',
        });
    }
};
const verify = async (req, res) => {
    const hashCode = req.query.h || false;
    const method = req.query.method || false;
    if (!hashCode || !GlobalSetting.verify_methods_support[method]) {
        return res.status(400).json({
            code: 400,
            message: 'Bad Request.',
        });
    }
    try {
        const userInDB = await UserModel.findOne({
            'account_details.email.verify_code': hashCode,
        });
        if (!userInDB) {
            return res.status(403).json({
                code: 403,
                message: 'The verification link has expired!',
            });
        }
        // clear code
        userInDB.account_details.email.verify_code = false;
        // change status
        userInDB.account_details.email.is_verify = true;
        // Create setting and save user
        await new UserSettingModel({
            user_id: userInDB._id
        }).save()
        // Create & save self room ()
        const selfRoomResponse = await createRoom({
            ownerId: userInDB._id,
            displayName: `Self room of ${userInDB._id}`,
            isGroupChat: false,
        })
        // Save
        await userInDB.save();
        return res.status(200).json({
            httpCode: 200,
            message: 'Verify email success.',
        });
    } catch (error) {
        process.env.NODE_ENV != 'development'
            ? logEvents(`${error.name}: ${error.message}`, `errors`)
            : console.log(`${error.name}: ${error.message}`);
        return res.status(500).json({
            httpCode: 500,
            message: 'Hệ thống đang bận!',
        });
    }
};
const authCheck = (req, res) => {
    if (!req.headers.authorization) {
        // no token provided
        return res.status(403).json({
            code: 403,
            message: 'No token provided or token expired!',
        });
    }
    const a_token = req.headers.authorization?.split(' ')[1];
    jwtHelper
        .verifyToken(a_token, ACCESS_TOKEN_SECRET)
        .then(() => {
            return res.status(200).json({
                code: 200,
                message: 'Welcome back user!',
            });
        })
        .catch(() => {
            return res.status(401).json({
                code: 401,
                message: 'No Authorized!',
            });
        });
};
module.exports = {
    signIn,
    signUp,
    signOut,
    verify,
    refreshAccessToken,
    authCheck,
};
