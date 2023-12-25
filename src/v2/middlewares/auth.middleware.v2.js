const jwtHelper = require('../helpers/jwt.helper');
const _ = require('underscore');
const { logEvents } = require('./logEvents');
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const { USER_STATUS } = require('../constants/status.code');
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_LIFE = process.env.ACCESS_TOKEN_LIFE;

const verifyToken = async (req, res, next) => {
    try {
        const a_token = req.cookies.a_token || req.headers.authorization?.split(' ')[1] || undefined;
        jwtHelper
            .verifyToken(a_token, ACCESS_TOKEN_SECRET)
            .then(() => {
                next();
            })
            .catch(async () => {
                const r_token = req.cookies.r_token || req.body.r_token;
                if (!r_token) throw Error('No refresh token!');
                const { decoded } = await jwtHelper.verifyToken(r_token, REFRESH_TOKEN_SECRET);
                const newAccessToken = await jwtHelper.generateToken(decoded, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_LIFE);
                req.cookies.a_token = newAccessToken.encoded;
                res.cookie('a_token', newAccessToken.encoded, {
                    maxAge: 3600000, // 1 hour
                    sameSite: 'none',
                    httpOnly: false,
                    secure: true,
                });
                next();
            });
    } catch (error) {
        process.env.NODE_ENV != 'development'
            ? logEvents(`${error.name}: ${error.message}`, `errors`)
            : console.log(`${error.name}: ${error.message}`);
        const { httpCode, id, message } = USER_STATUS.USER__UNAUTHORIZED;
        return res.status(httpCode).json({
            code: httpCode,
            id,
            message,
        });
    }
};

const verifyTokenBySocketIO = async (socket, next) => {
    const a_token = socket.handshake.auth.token || socket.handshake.headers.token;
    if (!a_token) {
        // no token provided
        return next(new Error('Authentication error: Token missing'));
    }
    try {
        const { decoded } = await jwtHelper.verifyToken(a_token, ACCESS_TOKEN_SECRET);
        socket.user = socket.handshake.user || decoded;
        next();
    } catch (error) {
        process.env.NODE_ENV != 'development'
            ? logEvents(`${error.name}: ${error.message}`, `errors`)
            : console.log(`${error.name}: ${error.message}`);
        return next(new Error('Authentication error: Invalid token'));
    }
};

module.exports = {
    verifyToken,
    verifyTokenBySocketIO,
};
