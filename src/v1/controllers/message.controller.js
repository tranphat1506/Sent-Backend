const { saveMessageToHistory } = require('../services/message.service');
const roomService = require('../services/room.service');

const MessageEventBySocketIO = (socket) => {
    // Event create room
    socket.on('create-room__Request', async ({ members = [], display_name, is_group_chat = false }) => {
        const _id = socket.user?._id || undefined;
        // Create room
        roomService
            .createRoom(_id, display_name, is_group_chat, members)
            .then((payload) => {
                socket.emit('create-room__Response', payload);
            })
            .catch((error) => {
                const { httpCode, payload, message } = error;
                process.env.NODE_ENV != 'development'
                    ? logEvents(`${error.name}: ${error.message}`, `errors`)
                    : console.log(`${error.name}: ${error.message}`);
                socket.emit('create-room__Response', {
                    code: httpCode,
                    payload,
                    message,
                });
            });
    });
};

const SentMessageEvent = (socket) => {
    const userId = socket.user._id;
    // Sending message event handling
    socket.on('message__Request', ({ room_id, message, type }) => {
        // Check if user is permit to send message in this room
        roomService
            .checkPermissionToAction(type.uppercase(), userId, room_id)
            .then(async () => {
                const messageResponse = {
                    type,
                    message,
                    send_by: userId,
                    time: Date.now(),
                };
                // save message history
                await saveMessageToHistory(messageResponse, room_id);
                // response message to all members in room
                socket.to(room_id).emit('message__Response');
            })
            .catch((error) => {
                const { httpCode, payload, message } = error;
                process.env.NODE_ENV != 'development'
                    ? logEvents(`${error.name}: ${error.message}`, `errors`)
                    : console.log(`${error.name}: ${error.message}`);
                socket.emit('message__Response', {
                    code: httpCode,
                    payload,
                    message,
                });
            });
    });
};

module.exports = {
    MessageEventBySocketIO,
};
