const router = require('express').Router();
const { verifyTokenBySocketIO } = require('../../middlewares/auth.middleware');
const { countUser } = require('../../services/socket.io/common.service');
const { RoomEventBySocketIO, joinMessageRooms } = require('../../controllers/room.controller');
const { MessageEventBySocketIO } = require('../message.controller');

const messageNamespace = (namespace) => {
    // Authorization
    namespace.use((socket, next) => {
        verifyTokenBySocketIO(socket, next);
    });
    // Logic xử lý kết nối
    namespace.on('connection', async (socket) => {
        // Connect handle on namespace '/online'
        // .....
        // join exist user room
        console.log(await joinMessageRooms(socket, socket.user._id));

        // Handle room event
        RoomEventBySocketIO(socket);
        MessageEventBySocketIO(socket);

        // Disconnect handle on namespace '/online'
        socket.on('disconnect', () => {});
    });
    // Các tuyến đường khác cho namespace có thể được thêm ở đây

    return router;
};

module.exports = messageNamespace;
