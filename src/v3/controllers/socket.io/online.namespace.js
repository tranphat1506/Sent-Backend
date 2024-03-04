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
const { getFriendList } = require('../../services/user.service');
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

const joinNotificationRoom = async (socket, roomId) => {
    try {
        const resGetFriendList = await getFriendList(socket.user._id);
        if (resGetFriendList.httpCode === 200) {
            const promises = [];
            resGetFriendList.payload.map((friendInfo) => {
                return joinRoomById();
            });
            return Promise.all(promises);
        }
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

const connectEventV2 = async (socket) => {
    // Version 2 is not need to send online state to other users
    // but send to global.
    /* 
        ** Logic.
            User connect to online namespace
        ->  Server add user to redis and update online state
        ->  Server send online state to every client
        ->  Client check online state was friend
        ->  Client UI working ...
    */
    // Create online state and add to online caches
    // const state = new OnlineState()
    //     .push({
    //         autoCreate: true,
    //         required: {
    //             userId: socket.user._id,
    //             socketId: socket.id,
    //             IPAddress: socket.handshake.address,
    //             language: socket.user._id,
    //             latitude: socket.user.geolocation?.latitude,
    //             longitude: socket.user.geolocation?.longitude,
    //             userAgent: socket.user.userAgent,
    //         },
    //     })
    //     .toObject();
};

const disconnectEvent = async (socket) => {
    // Handle disconnect event
    socket.to(socket.user._id).emit('update-online-status__Response', await userDisconnect(socket.user._id));
};

module.exports = onlineNamespace;
