const { getPayload } = require('../helpers/jwt.helper');
const { logEvents } = require('../middlewares/logEvents');
const { addFriendByUserId } = require('../services/user.service');
const { getOnlineStatusRoom } = require('../services/room.service');
const userService = require('../services/user.service');

const getInfo = async (req, res) => {
    // get what ?
    const a_token = req.headers.authorization?.split(' ')[1];
    const _id = getPayload(a_token)._id;
    userService
        .getUserInfoById(_id)
        .then((payload) => {
            if (payload.httpCode === 200)
                return res.status(payload.httpCode).json({
                    code: payload.httpCode,
                    name: payload.name,
                    message: payload.message,
                    payload: payload.user,
                });
            return res.status(payload.httpCode).json({
                code: payload.httpCode,
                name: payload.name,
                message: payload.message,
            });
        })
        .catch((error) => {
            // Lỗi server
            process.env.NODE_ENV != 'development'
                ? logEvents(
                      `${error.name}: ${error.message}\n${error.payload.name}: ${error.payload.message}`,
                      `errors`,
                  )
                : console.log(error);
            return res.status(error.httpCode).json({
                httpCode: error.httpCode,
                name: error.name,
                message: error.message,
            });
        });
};

const addFriend = async (req, res) => {
    try {
        const a_token = req.headers.authorization?.split(' ')[1];
        const friend_id = req.body.friend_id || undefined;
        const _id = getPayload(a_token)._id;
        const response = await userService.addFriendByUserId(_id, friend_id);
        return res.status(response.httpCode).json(response);
    } catch (error) {
        // Lỗi server
        process.env.NODE_ENV != 'development'
            ? logEvents(`${error.name}: ${error.message}\n${error.payload.name}: ${error.payload.message}`, `errors`)
            : console.log(error);
        return res.status(error.httpCode).json({
            httpCode: error.httpCode,
            name: error.name,
            message: error.message,
        });
    }
};

const getFriendList = async (req, res) => {
    try {
        const a_token = req.headers.authorization?.split(' ')[1];
        const _id = getPayload(a_token)._id;
        const response = await userService.getFriendList(_id);
        return res.status(response.httpCode).json(response);
    } catch (error) {
        // Lỗi server
        process.env.NODE_ENV != 'development'
            ? logEvents(`${error.name}: ${error.message}\n${error.payload.name}: ${error.payload.message}`, `errors`)
            : console.log(error);
        return res.status(error.httpCode).json({
            httpCode: error.httpCode,
            name: error.name,
            message: error.message,
        });
    }
};

const FriendEventSocketIO = (socket) => {
    // Add friend
    socket.on('add-friend__Request', ({ friend_id }) => {
        // get friend list
        getOnlineStatusRoom(socket.user._id)
            .then(async (room) => {
                console.log(room.room_id, '+', friend_id);
                const response = await addFriendByUserId(room.room_id, friend_id);
                socket.emit('add-friend__Response', response);
            })
            .catch((error) => {
                // Lỗi server
                process.env.NODE_ENV != 'development'
                    ? logEvents(
                          `${error.name}: ${error.message}\n${error.payload.name}: ${error.payload.message}`,
                          `errors`,
                      )
                    : console.log(error);
            });
    });
};
module.exports = {
    getInfo,
    FriendEventSocketIO,
    addFriend,
    getFriendList,
};
