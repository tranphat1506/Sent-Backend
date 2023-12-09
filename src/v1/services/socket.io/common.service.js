const addUser = async (userInfo, socketId) => {
    const userId = userInfo?._id || undefined;
    if (!userId) return false;
    _USERS[userId] = { user_id: userId, socket_id: socketId };
    await userActive();
    return true;
};

const removeUser = (userId) => {
    delete _USERS[userId];
    return true;
};

const getUserByUserId = (userId) => {
    return _USERS[userId];
};

const countUser = () => {
    return Object.keys(_USERS).length || 0;
};

const fetchAllRooms = async () => {
    return _ROOMS;
};

const userActive = async (userId) => {
    if (!_USERS[userId]) return false;
    _USERS[userId] = { ..._USERS[userId], is_online: true, last_active: Date.now() };
};

module.exports = {
    fetchAllRooms,
    addUser,
    removeUser,
    countUser,
    getUserByUserId,
    userActive,
};
