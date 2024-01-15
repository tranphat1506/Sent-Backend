const DB = require('mongoose');
const RoomSchema = new DB.Schema({
    room_id: DB.Types.ObjectId,
    is_group_chat: { type: Boolean, default: false },
    display_name: { type: String, required: true },
    avt_src: { type: String, default: '' },
    created_by: { type: DB.Types.ObjectId, ref: 'Users', required: true },
    created_at: { type: Number, default: Date.now() },
});
const RoomModel = DB.model('MessageRooms', RoomSchema);
module.exports = {
    RoomModel,
};
