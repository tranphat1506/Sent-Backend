const DB = require('mongoose');
const FriendRequestSchema = new DB.Schema({
    user_id: { type: DB.Types.ObjectId, ref: 'Users' },
    friendlist_id: { type: DB.Types.ObjectId, ref: 'Rooms' },
    request_time: { type: String, default: String(Date.now()) },
    response_time: String,
});
const RoomRequestSchema = new DB.Schema({
    user_id: { type: DB.Types.ObjectId, ref: 'Users' },
    room_id: { type: DB.Types.ObjectId, ref: 'Rooms' },
    request_time: { type: String, default: String(Date.now()) },
    response_time: String,
});
const SettingSchema = {
    allow_add_to_room: { type: String, default: 'everyone' },
    need_accept_request_join_room: { type: String, default: 'stranger' },
    allow_add_friend: { type: Boolean, default: true },
    allow_messaging: { type: String, default: 'everyone' },
};
const UserSchema = new DB.Schema({
    _id: DB.Types.ObjectId,
    account_details: {
        user_name: { type: String, required: true, unique: true },
        password: String,
        role: {
            info: { type: String, default: 'client' }, // Only client or admin
            display: { type: String, default: false }, // Display a role to web
        },
        email: {
            is_verify: { type: Boolean, default: false },
            details: { type: String, default: false },
            verify_code: { type: String, default: false },
            accept_marketing: { type: Boolean, default: false },
        },
        phone: {
            is_verify: { type: Boolean, default: false },
            details: { type: String, default: '' },
        },
        created_at: { type: String, default: new Date().toISOString() },
    },
    info_details: {
        display_name: { type: String, default: 'Chưa cập nhật' },
        birth: {
            day: Number,
            month: Number,
            year: Number,
        },
        sex: {
            display: { type: String, default: 'Chưa cập nhật' },
            info: { type: Number, default: 0 },
        },
        avatar_url: {
            type: String,
            default: 'https://cdn141.picsart.com/357697367045201.jpg',
        },
    },
    room_details: {
        online_status_room_id: {
            type: DB.Types.ObjectId,
            ref: 'Rooms',
            required: true,
        },
        message_room: {
            accepted_list: { type: Map, of: RoomRequestSchema, default: {} },
            waiting_accept_list: { type: Map, of: RoomRequestSchema, default: {} },
        },
    },
    friend_details: {
        waiting_accept_list: { type: Map, of: FriendRequestSchema },
        accepted_list: { type: Map, of: FriendRequestSchema },
    },
    settings: SettingSchema,
});

const UserModel = DB.model('Users', UserSchema);
module.exports = {
    UserModel,
};
