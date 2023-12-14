const DB = require('mongoose');
const MessageSchema = new DB.Schema({
    message_id: Number,
    send_by: { type: DB.Types.ObjectId, ref: 'Users' },
    isMessageTime: Boolean,
    time: String,
    message: String,
    type: String,
});

module.exports = {
    MessageSchema,
};
