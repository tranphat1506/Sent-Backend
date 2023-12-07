const router = require('express').Router();
const { verifyTokenBySocketIO } = require('../../middlewares/auth.middleware');
const { userConnect, userDisconnect, countUser } = require('../../services/socket.io/common.service');

const messageNamespace = (namespace) => {
    // Authorization
    namespace.use((socket, next) => {
        verifyTokenBySocketIO(socket, next);
    });
    // Logic xử lý kết nối
    namespace.on('connection', async (socket) => {
        // Handle connect event
        userConnect(socket.user, socket.id);
        console.log(countUser);

        socket.on('disconnect', () => {
            // Handle disconnect event
            userDisconnect(socket?.user?._id || socket?.user?.id);
            console.log(countUser);
        });
    });
    // Các tuyến đường khác cho namespace có thể được thêm ở đây

    return router;
};

module.exports = messageNamespace;
