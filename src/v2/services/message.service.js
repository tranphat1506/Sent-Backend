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

const paramsToMessageResponseVer0 = ({ typeMessage, params }) => {
    const ver = 0;
    const time_now = Date.now();
    let response = {};
    switch (typeMessage) {
        case 'SERVER_MESSAGE': // This type is the server response to room
            switch (
                params.type // Check type of server message
            ) {
                case 'USER_WAS_ADDED':
                    response.message = {
                        type: params.type,
                        user_id: params.userId,
                        add_by: params.addById,
                        time: time_now,
                    };
                    break;
                default:
                    throw new Error({
                        name: 'Type Error',
                        message: `Type::${typeMessage} in type::SERVER_MESSAGE not invalid in version::${ver} or not exist.`,
                    });
            }
            response.time = time_now;
            response.__v = ver;
            response.send_by = 'SERVER';
            break;
        default:
            throw new Error({
                name: 'Type Error',
                message: `Type::${typeMessage} not invalid in version::${ver} or not exist.`,
            });
    }
    return response;
};
module.exports = {
    saveMessageToHistory,
    paramsToMessageResponseVer0,
};
