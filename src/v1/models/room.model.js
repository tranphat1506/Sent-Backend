const DB = require('mongoose');
const RoomMemberSchema = new DB.Schema({
    user_id: { type: DB.Types.ObjectId, ref: 'Users' },
    last_active: String,
    is_online: Boolean,
});
const RoomSchema = new DB.Schema({
    room_id: DB.Types.ObjectId,
    is_group_chat: { type: Boolean, default: false },
    display_name: String,
    avt_src: String,
    members: {
        type: Map,
        of: RoomMemberSchema,
    },
    owner: { type: DB.Types.ObjectId, ref: 'Users', required: true },
    created_at: { type: String, default: new Date().toISOString() },
});
const RoomModel = DB.model('Rooms', RoomSchema);
module.exports = {
    RoomModel,
};
