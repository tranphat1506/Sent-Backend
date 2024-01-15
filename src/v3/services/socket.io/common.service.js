const { RoomModel } = require('../../models/Messages/room.model');
const { Types } = require('mongoose');
const { UserModel } = require('../../models/User/users.model');
const { SERVER_STATUS } = require('../../constants/status.code');
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

const addUser = async (userId, socketId) => {
    try {
        if (!userId) return false;
        const user = await UserModel.findOne({ _id: userId });
        if (!user) return false;
        // const user = await UserModel.findOne({ _id: userId }).select('-account_details.password -_id');
        // if (!user) return false;
        // _USERS[userId] = { user_id: userId, socket_id: socketId, ...user.toObject() };
        _USERS[userId] = { _id: userId, socket_id: socketId, is_online: true, last_active: Date.now() };
        return user;
    } catch (error) {
        return error;
    }
};

const removeUser = (userId) => {
    delete _USERS[userId];
    return true;
};

const getUserByUserId = async (userId) => {
    try {
        if (!userId) throw new Error('Invalid id.');
        const getUser = await _USERS[userId];
        if (!getUser) return { _id: userId, socket_id: null, is_online: false, last_active: null };
        return getUser;
    } catch (error) {}
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
        _ROOMS[String(roomId)] = { ...roomDetail, room_id: String(roomId), messages: [] };
        return resolve({ status: true, message: 'OK', payload: roomDetail });
    });
};

const fetchAllRooms = async () => {
    return new Promise((resolve, reject) => {
        RoomModel.find()
            .then((rooms) => {
                return resolve(
                    Promise.all(
                        rooms.map((room) => {
                            return addRoom(room.room_id, { ...room.toObject() });
                        }),
                    ),
                );
            })
            .catch((error) => {
                return reject({ ...SERVER_STATUS.SERVER__DEFAULT_ERROR, payload: error });
            });
    });
};

const fetchOneRoom = async (roomId) => {
    return new Promise((resolve, reject) => {
        RoomModel.findOne({ room_id: new Types.ObjectId(roomId) }, { messages: 0 })
            .then(async (room) => {
                const membersFlat = new Map();
                room.members.forEach((member, key) => {
                    membersFlat.set(key, {
                        ...member.toObject(),
                        username: member.user_id.account_details.user_name,
                        display_name: member.user_id.info_details.display_name,
                        avt_src: member.user_id.info_details.avatar_url,
                        user_id: key, // important
                    });
                });
                await addRoom(room.room_id, { ...room.toObject(), members: membersFlat });
                return resolve(room);
            })
            .catch((error) => {
                return reject({ ...SERVER_STATUS.SERVER__DEFAULT_ERROR, payload: error });
            });
    });
};

const userDisconnect = async (userId) => {
    try {
        const user = await _USERS[userId];
        if (!user) return false;
        _USERS[userId] = { ...user, is_online: false };
        return { ...user, is_online: false };
    } catch (error) {
        return error;
    }
};

module.exports = {
    fetchAllRooms,
    addUser,
    removeUser,
    countUser,
    getUserByUserId,
    userDisconnect,
    joinRoomById,
    getRoomInRedis,
    fetchOneRoom,
    addRoom,
    countRoom,
};
