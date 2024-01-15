const DB = require('mongoose');
const RoomMessagesSchema = new DB.Schema({
    message_id: DB.Types.ObjectId,
    room_id: { type: DB.Types.ObjectId, ref: 'MessageRooms' },
    send_by: { type: DB.Types.ObjectId, ref: 'Users' },
    response_to: { type: DB.Types.ObjectId, ref: 'RoomMessages' },
    time: { type: Number, default: Date.now() },
    message_type: {type: String, required: true},
    message: String,
});
const RoomMessagesModel = DB.model('RoomMessages', RoomMessagesSchema);

module.exports = {
    RoomMessagesModel,
};
