const GlobalSetting = require('../configs/globalSetting.config');
const jwtHelper = require('../helpers/jwt.helper');
const _ = require('underscore');
const { UserModel } = require('../models/users.model');
const joiValidation = require('../helpers/joi.helper');
const { sendVerifyEmail } = require('../services/mail.service');
const { v4: uuidv4 } = require('uuid');
const { logEvents } = require('../middlewares/logEvents');
const md5 = require('md5');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_LIFE = process.env.ACCESS_TOKEN_LIFE;
const REFRESH_TOKEN_LIFE = process.env.REFRESH_TOKEN_LIFE;
const bcrypt = require('bcrypt');
const saltRounds = 8;
const signIn = async (req, res) => {
    const { account, password, remember_pwd } = req.body;
    try {
        const userWasFound = await UserModel.findOne({
            $or: [{ 'account_details.user_name': account }, { 'account_details.email.details': account }],
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

        Promise.all([
            jwtHelper.generateToken(userWasFound, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_LIFE),
            jwtHelper.generateToken(userWasFound, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_LIFE),
        ]).then(async (arrayToken) => {
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
            };
            // neu client muon luu tai khoan
            if (remember_pwd) {
                res.cookie('a_token', arrayToken[0].encoded, {
                    maxAge: 3600000, // 1 hour
                    sameSite: 'none',
                    httpOnly: true,
                    secure: true,
                });
                res.cookie('r_token', arrayToken[1].encoded, {
                    maxAge: 2678400000, // 31 days
                    sameSite: 'none',
                    httpOnly: false,
                    secure: true,
                });
                return res.status(200).json({
                    code: 200,
                    user: cutSomePrivateInfoFromUser,
                    a_token: arrayToken[0].encoded,
                    r_token: arrayToken[1].encoded,
                });
            }
            res.cookie('a_token', arrayToken[0].encoded, {
                sameSite: 'none',
                httpOnly: true,
                secure: true,
                path: '/',
            });
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
    const { email, user_name, password, re_password, accept_marketing } = req.body;
    //
    const errorValidation = joiValidation.signUp({
        email,
        user_name,
        password,
        re_password,
    });
    if (errorValidation) {
        return res.status(400).json({
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
            const id = uuidv4();
            // send verify email link to device
            const hashVerifyLink =
                `${process.env.BE_URL}:${process.env.PORT}` + '/api/auth/verify/?method=email&h=' + md5(user_name + id);
            // send
            if (process.env.NODE_ENV === 'development') console.log(hashVerifyLink);
            else await sendVerifyEmail(hashVerifyLink, user_name, email);
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
            });
            await newUser.save();
            //send OK status
            return res.status(200).json({
                message: 'Đăng ký thành công!',
            });
        }
        // if already have account
        return res.status(400).json({
            message: 'Người dùng đã tồn tại!',
        });

        // Catch error
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

const signOut = (req, res) => {
    console.log(req.cookies.a_token);
    res.clearCookie('a_token');
    return res.sendStatus(200);
};

const refreshAccessToken = async (req, res) => {
    if (!req.headers.authorization && !req.cookies.r_token && !req.body.r_token) {
        // no token provided
        return res.status(403).json({
            code: 403,
            message: 'No token provided or token expired!',
        });
    }
    try {
        const r_token = req.cookies.r_token || req.headers.authorization.split(' ')[1] || req.body.r_token;
        const { decoded } = await jwtHelper.verifyToken(r_token, REFRESH_TOKEN_SECRET);
        const newAccessToken = await jwtHelper.generateToken(decoded, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_LIFE);
        res.cookie('a_token', newAccessToken.encoded, {
            maxAge: 3600000, // 1 hour
            sameSite: 'none',
            httpOnly: false,
            secure: true,
        });
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
        await userInDB.save();
        return res.status(200).json({
            code: 200,
            message: 'Verify email success.',
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
const authCheck = (req, res) => {
    if (!req.headers.authorization && !req.cookies.a_token && !req.body.a_token) {
        // no token provided
        return res.status(403).json({
            code: 403,
            message: 'No token provided or token expired!',
        });
    }
    const a_token = req.cookies.a_token || req.headers.authorization.split(' ')[1] || req.body.a_token;
    jwtHelper
        .verifyToken(a_token, ACCESS_TOKEN_SECRET)
        .then(() => {
            return res.status(200).json({
                code: 200,
                message: 'Welcome back user!',
            });
        })
        .catch((error) => {
            process.env.NODE_ENV != 'development'
                ? logEvents(`${error.name}: ${error.message}`, `errors`)
                : console.log(`${error.name}: ${error.message}`);
            console.log(req.cookies.a_token);
            res.cookie('a_token', '', {
                maxAge: 1, // 1 hour
                sameSite: 'none',
                httpOnly: false,
                secure: true,
            });
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
