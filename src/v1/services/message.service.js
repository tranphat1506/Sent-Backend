const saveMessageToHistory = (messageResponse, roomId) => {
    return new Promise((resolve, reject) => {
        if (!_ROOMS[roomId]) return reject({ status: false, message: 'Server is busy!', httpCode: 500 });
        _ROOMS[roomId].messages.push(messageResponse);
        return resolve({ status: true, message: `OK!`, httpCode: 200 });
    });
};
const userWasAction = (userId) => {};
module.exports = {
    saveMessageToHistory,
};
