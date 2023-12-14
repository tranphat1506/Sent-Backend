const saveMessageToHistory = async (messageResponse, roomId) => {
    try {
        const roomDetail = await _ROOMS[roomId];
        if (!roomDetail) throw new Error({ status: false, message: 'Server is busy!', httpCode: 500 });
        const idMessage = roomDetail.message_details.total_message;
        _ROOMS[roomId].message_details.history[idMessage + 1] = { ...messageResponse, message_id: idMessage + 1 };
        _ROOMS[roomId].message_details.total_message = idMessage + 1;
        return { status: true, message: `OK!`, httpCode: 200 };
    } catch (error) {
        return error;
    }
};
module.exports = {
    saveMessageToHistory,
};
