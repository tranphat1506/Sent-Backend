const DB = require('mongoose');
const MessageSchema = new DB.Schema({
    send_by: { type: DB.Types.ObjectId, ref: 'Users' },
    isMessageTime: Boolean,
    time: String,
    message: String,
});

module.exports = {
    MessageSchema,
};
