const { RoomModel } = require('../../models/room.model');
const { Types } = require('mongoose');
const { UserModel } = require('../../models/users.model');
const joinRoomById = async (roomId, socket, autoAdd = false) => {
    return new Promise(async (resolve, reject) => {
        getRoomInRedis(roomId, autoAdd)
            .then((room) => {
                // Join room
                // console.log(`User with id::${socket.user._id} join room id::${room.room_id}`);
                socket.join(room.room_id);
                // Return room
                return resolve(room);
            })
            .catch((error) => {
                return reject(error);
            });
    });
};

const getRoomInRedis = async (roomId, autoAdd = false) => {
    return new Promise(async (resolve, reject) => {
        if (!roomId) return reject({ name: 'Error', message: `Invalid room id::${roomId}.` });
        const existRoom = await _ROOMS[roomId];
        if (!existRoom) {
            if (!autoAdd) return reject({ name: 'Error', message: `Room with id::${roomId} not exist.` });
            return fetchOneRoom(roomId)
                .then((room) => {
                    if (!room) return reject({ name: 'Error', message: `Room with id::${roomId} not exist.` });
                    resolve(room);
                })
                .catch((error) => {
                    reject(error);
                });
        }
        return resolve(existRoom);
    });
};

const addUser = async (userInfo, socketId) => {
    try {
        const userId = userInfo?._id || undefined;
        if (!userId) return false;
        // const user = await UserModel.findOne({ _id: userId }).select('-account_details.password -_id');
        // if (!user) return false;
        // _USERS[userId] = { user_id: userId, socket_id: socketId, ...user.toObject() };
        _USERS[userId] = { user_id: userId, socket_id: socketId };
        await userActive(userId);
        return true;
    } catch (error) {
        return error;
    }
};

const removeUser = (userId) => {
    delete _USERS[userId];
    return true;
};

const getUserByUserId = async (userId) => {
    return _USERS[userId];
};

const countUser = async () => {
    return Object.keys(await _USERS).length || 0;
};

const countRoom = async () => {
    return Object.keys(await _ROOMS).length || 0;
};

const addRoom = async (roomId, roomDetail) => {
    return new Promise(async (resolve, reject) => {
        if (!roomId) return reject({ status: false, message: 'Missing room id!' });
        _ROOMS[String(roomId)] = { ...roomDetail.toObject(), room_id: String(roomId), messages: [] };
        return resolve({ status: true, message: 'OK', payload: roomDetail });
    });
};

const fetchAllRooms = async () => {
    return new Promise((resolve, reject) => {
        RoomModel.find({}, { messages: 0 })
            .then((rooms) => {
                return resolve(
                    Promise.all(
                        rooms.map((room) => {
                            return addRoom(room.room_id, room);
                        }),
                    ),
                );
            })
            .catch((error) => {
                return reject({ status: false, message: '500:SERVER IS BUSY.', payload: error });
            });
    });
};

const fetchOneRoom = async (roomId) => {
    return new Promise((resolve, reject) => {
        RoomModel.findOne({ room_id: new Types.ObjectId(roomId) }, { messages: 0 })
            .then(async (room) => {
                await addRoom(room.room_id, room);
                return resolve(room);
            })
            .catch((error) => {
                return reject({ status: false, message: '500:SERVER IS BUSY.', payload: error });
            });
    });
};

const userDisconnect = async (userId) => {
    if (!_USERS[userId]) return false;
    _USERS[userId] = { ..._USERS[userId], is_online: false };
    return true;
};

const userActive = async (userId) => {
    _USERS[userId] = { ..._USERS[userId], is_online: true, last_active: Date.now() };
    return true;
};

module.exports = {
    fetchAllRooms,
    addUser,
    removeUser,
    countUser,
    getUserByUserId,
    userActive,
    userDisconnect,
    joinRoomById,
    getRoomInRedis,
    fetchOneRoom,
    addRoom,
    countRoom,
};
