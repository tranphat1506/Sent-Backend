const userConnect = (userInfo, socketId) => {
    const userId = userInfo?.id || userInfo?._id || undefined;
    if (!userId) return false;
    _USERS[userId] = { ...userInfo, socketId: socketId };
    return true;
};

const userDisconnect = (userId) => {
    delete _USERS[userId];
    return true;
};

const countUser = () => {
    return Object.keys(_USERS).length || 0;
};
module.exports = {
    userConnect,
    userDisconnect,
    countUser,
};
