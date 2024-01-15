const { logEvents } = require('../middlewares/logEvents');
const { getOnlineStatusRoom } = require('../services/room.service');
const { getUserByUserId } = require('../services/socket.io/common.service');
const { FriendEventSocketIO } = require('./user.controller');

const OnlineEventSocketIO = (socket) => {
    // Update online
    socket.on('update-online-status__Request', () => {
        // get room for send status
        getOnlineStatusRoom(socket.user._id)
            .then((room) => {
                // Get user info
                getUserByUserId(room.room_id).then((userInfo) => {
                    // Send to this room is this user online
                    socket.to(room.room_id).emit('update-online-status__Response', userInfo);
                });
            })
            .catch((error) => {
                // Lỗi server
                process.env.NODE_ENV != 'development'
                ? logEvents(`${error.name}: ${error.message}\n${error.payload.name}: ${error.payload.message}`, `errors`)
                : console.log(error);
            });
    });
    FriendEventSocketIO(socket);
};

module.exports = { OnlineEventSocketIO };
