const router = require('express').Router();
const { verifyTokenBySocketIO } = require('../../middlewares/auth.middleware');
const { logEvents } = require('../../middlewares/logEvents');
const { getOnlineStatusRoom } = require('../../services/room.service');
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
            // Only join socket room not other room
            console.log(
                socket.user._id,
                'was join',
                (await joinOnlineStatusRoom(socket, socket.user._id)).length,
                'rooms',
            );
            // Join other room

            OnlineEventSocketIO(socket);

            socket.on('disconnect', async () => {
                // Handle disconnect event
                userDisconnect(socket.user._id);
                console.log('Online', await countUser());
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
    try {
        const room = await getOnlineStatusRoom(roomId);
        if (!room.members) throw new Error(`The user with id::${roomId} not in their friendlist ???`);
        const promises = [];
        room.members.forEach((_, memberId) => {
            promises.push(joinRoomById(memberId, socket, true));
        });
        return Promise.all(promises);
    } catch (error) {
        return error;
    }
};

module.exports = onlineNamespace;
