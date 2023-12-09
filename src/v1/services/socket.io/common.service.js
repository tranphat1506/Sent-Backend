const addUser = (userInfo, socketId) => {
    const userId = userInfo?.id || userInfo?._id || undefined;
    if (!userId) return false;
    _USERS[userId] = { ...userInfo, socketId: socketId };
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

module.exports = {
    fetchAllRooms,
    addUser,
    removeUser,
    countUser,
    getUserByUserId,
};
