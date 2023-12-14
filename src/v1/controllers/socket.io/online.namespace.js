const router = require('express').Router();
const { verifyTokenBySocketIO } = require('../../middlewares/auth.middleware');
const { logEvents } = require('../../middlewares/logEvents');
const { addUser, countUser, userDisconnect, joinRoomById } = require('../../services/socket.io/common.service');
const { OnlineEventSocketIO } = require('../online.controller');

const onlineNamespace = (namespace) => {
    // Authorization
    namespace.use((socket, next) => {
        verifyTokenBySocketIO(socket, next);
    });
    // Logic xử lý kết nối
    namespace.on('connection', async (socket) => {
        try {
            // Add and join their room when they connect
            await addUser(socket.user, socket.id);
            await joinOnlineStatusRoom(socket, socket.user._id);

            OnlineEventSocketIO(socket);

            socket.on('disconnect', () => {
                // Handle disconnect event
                userDisconnect(socket.user._id);
                console.log('Online', countUser());
            });
        } catch (error) {
            // Lỗi server
            process.env.NODE_ENV != 'development'
                ? logEvents(`${error.name}: ${error.message}`, `errors`)
                : console.log(error);
        }
    });
    // Các tuyến đường khác cho namespace có thể được thêm ở đây

    return router;
};

const joinOnlineStatusRoom = async (socket, roomId) => {
    return joinRoomById(roomId, socket, true);
};

module.exports = onlineNamespace;
