const router = require('express').Router();
const { verifyTokenBySocketIO } = require('../../middlewares/auth.middleware');
const { addUser, removeUser, countUser } = require('../../services/socket.io/common.service');
const { RoomEventBySocketIO } = require('../../controllers/room.controller');
const { MessageEventBySocketIO } = require('../message.controller');

const messageNamespace = (namespace) => {
    // Authorization
    namespace.use((socket, next) => {
        console.log('123');
        verifyTokenBySocketIO(socket, next);
    });
    // Logic xử lý kết nối
    namespace.on('connection', async (socket) => {
        // Handle connect event
        addUser(socket.user, socket.id);
        console.log(countUser(), 'Online');

        // Handle room event
        RoomEventBySocketIO(socket);
        MessageEventBySocketIO(socket);

        socket.on('disconnect', () => {
            // Handle disconnect event
            removeUser(socket?.user?._id || socket?.user?.id);
            console.log(countUser(), 'Online');
        });
    });
    // Các tuyến đường khác cho namespace có thể được thêm ở đây

    return router;
};

module.exports = messageNamespace;
