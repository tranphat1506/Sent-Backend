const DB = require('mongoose');
const NotificationTypes = ['FRIEND_REQUEST', 'FRIEND_ACCEPT', 'ROOM_REQUEST_JOIN'];
const NotificationMessageSchema = new DB.Schema({
    is_recive: { type: Boolean, default: false },
    created_at: { type: String, default: new Date().toISOString() },
    typeof_notification: {
        type: String,
        enum: NotificationTypes, // Loại thông báo
        required: true,
    },
    params: DB.SchemaTypes.Mixed,
});
const NotificationRoomSchema = new DB.Schema({
    user_id: { type: DB.Types.ObjectId, ref: 'Users', required: true },
    notifications: { type: [NotificationMessageSchema], default: [] },
});
const NotificationRoomModel = DB.model('NotificationRooms', NotificationRoomSchema);
module.exports = {
    NotificationRoomModel,
};
