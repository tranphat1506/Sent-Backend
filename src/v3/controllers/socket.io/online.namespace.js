const router = require('express').Router();
const { verifyTokenBySocketIO } = require('../../middlewares/auth.middleware');
const { logEvents } = require('../../middlewares/logEvents');
const { getOnlineStatusRoom } = require('../../services/room.service');
const {
    addUser,
    countUser,
    userDisconnect,
    joinRoomById,
    getUserByUserId,
} = require('../../services/socket.io/common.service');
const { OnlineEventSocketIO } = require('../online.controller');

const onlineNamespace = (namespace) => {
    // Authorization
    namespace.use((socket, next) => {
        verifyTokenBySocketIO(socket, next);
    });
    // Logic xử lý kết nối
    namespace.on('connection', async (socket) => {
        try {
            // Handle connect event
            await connectEvent(socket);

            OnlineEventSocketIO(socket);

            socket.on('disconnect', async () => {
                // Handle disconnect event

                await disconnectEvent(socket);
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

const connectEvent = async (socket) => {
    // Join status room
    console.log(
        socket.user._id,
        'was join',
        (await joinOnlineStatusRoom(socket, socket.user._id)).length,
        'status rooms',
    );
    // Add and join their room when they connect
    const socketUser = await addUser(socket.user._id, socket.id);
    socket.to(socket.user._id).emit('update-online-status__Response', await getUserByUserId(String(socket.user._id)));
    const friendStatusList = [];
    socketUser?.friend_details?.accepted_list.forEach((friend) => {
        friendStatusList.push(getUserByUserId(String(friend.user_id)));
    });
    socket.emit('my-list-friend__Response', await Promise.all(friendStatusList));
};

const disconnectEvent = async (socket) => {
    // Handle disconnect event
    socket.to(socket.user._id).emit('update-online-status__Response', await userDisconnect(socket.user._id));
};

module.exports = onlineNamespace;
