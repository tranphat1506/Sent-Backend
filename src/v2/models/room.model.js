const DB = require('mongoose');
const { MessageSchema } = require('./message.model');
const RoomMemberSchema = new DB.Schema({
    user_id: { type: DB.Types.ObjectId, ref: 'Users' },
    room_setting: {
        message_notification: { type: Boolean, default: true },
    },
    last_active: String,
    is_online: Boolean,
});
const SeenInfoSchema = new DB.Schema({
    user_id: { type: DB.Types.ObjectId, ref: 'Users' },
    room_id: { type: DB.Types.ObjectId, ref: 'Rooms' },
    is_recive: Boolean,
    is_seen: Boolean,
    time: String,
});
const RoomSchema = new DB.Schema({
    room_id: DB.Types.ObjectId,
    is_group_chat: { type: Boolean, default: false },
    is_friendlist_room: { type: Boolean, default: false },
    display_name: String,
    avt_src: String,
    members: {
        type: Map,
        of: RoomMemberSchema,
    },
    seen_info: {
        type: Map,
        of: SeenInfoSchema,
    },
    message_details: {
        total_message: { type: Number, default: 0 },
        history: { type: Map, of: MessageSchema, default: {} },
    },
    owner: { type: DB.Types.ObjectId, ref: 'Users', required: true },
    created_at: { type: String, default: new Date().toISOString() },
});
const RoomModel = DB.model('Rooms', RoomSchema);
module.exports = {
    RoomModel,
};
