const { logEvents } = require('../middlewares/logEvents');
const { addToFriendList } = require('../services/friend.service');
const { getOnlineStatusRoom } = require('../services/room.service');
const { getUserByUserId } = require('../services/socket.io/common.service');

const OnlineEventSocketIO = (socket) => {
    // Update online
    socket.on('update-online-status__Request', () => {
        // get room for send status
        getOnlineStatusRoom(socket.user._id)
            .then((room) => {
                // Get user info
                getUserByUserId(socket.user._id).then((userInfo) => {
                    console.log(userInfo);
                    // Send to this room is this user online
                    socket.to(room.room_id).emit('update-online-status__Response', userInfo);
                });
            })
            .catch((error) => {
                // Lỗi server
                process.env.NODE_ENV != 'development'
                    ? logEvents(`${error.name}: ${error.message}`, `errors`)
                    : console.log(error);
            });
    });
};

const FriendEventSocketIO = (socket) => {
    // Add friend
    socket.on('add-friend__Request', ({friend_id}) => {
        // get friend list
        getOnlineStatusRoom(socket.user._id)
            .then(async (room) => {
                const response = await addToFriendList(room.room_id, friend_id)
                socket  
            })
            .catch((error) => {
                // Lỗi server
                process.env.NODE_ENV != 'development'
                    ? logEvents(`${error.name}: ${error.message}`, `errors`)
                    : console.log(error);
            });
    });
};

module.exports = { OnlineEventSocketIO };
