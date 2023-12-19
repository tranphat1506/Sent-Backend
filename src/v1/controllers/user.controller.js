const { getPayload } = require('../helpers/jwt.helper');
const { logEvents } = require('../middlewares/logEvents');
const { addToFriendList } = require('../services/user.service');
const { getOnlineStatusRoom } = require('../services/room.service');
const userService = require('../services/user.service');

const getInfo = async (req, res) => {
    // get what ?
    const a_token = req.headers.authorization?.split(' ')[1];
    const _id = getPayload(a_token)._id;
    userService
        .getUserInfoById(_id)
        .then((payload) => {
            return res.status(payload.httpCode).json({
                code: payload.httpCode,
                id: payload.id,
                message: payload.message,
                payload: payload.user,
            });
        })
        .catch((error) => {
            process.env.NODE_ENV != 'development'
                ? logEvents(`${error.id}: ${error.error}`, `errors`)
                : console.log(`${error.id}: ${error.error}`);
            return res.status(error.httpCode).json({
                code: error.httpCode,
                id: error.id,
                message: error.message,
            });
        });
};

const addFriend = async (req, res) => {
    try {
        const a_token = req.headers.authorization?.split(' ')[1];
        const friend_id = req.body.friend_id || undefined;
        const _id = getPayload(a_token)._id;
        if (!_id || !friend_id)
            return res.status(400).json({
                code: 400,
                message: 'Id is invalid!',
            });
        const response = await addToFriendList(_id, friend_id);
        return res.status(response.code).json(response);
    } catch (error) {
        // Lỗi server
        process.env.NODE_ENV != 'development'
            ? logEvents(`${error.name}: ${error.message}`, `errors`)
            : console.log(error);
        return res.status(500).json({
            code: 500,
            message: 'Server đang bận, vui lòng thử lại trong giây lát.',
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
                const response = await addToFriendList(room.room_id, friend_id);
                socket.emit('add-friend__Response', response);
            })
            .catch((error) => {
                // Lỗi server
                process.env.NODE_ENV != 'development'
                    ? logEvents(`${error.name}: ${error.message}`, `errors`)
                    : console.log(error);
            });
    });
};
module.exports = {
    getInfo,
    FriendEventSocketIO,
    addFriend,
};
