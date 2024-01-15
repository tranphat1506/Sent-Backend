const DB = require('mongoose');
const NotificationTypes = ['FRIEND_REQUEST', 'FRIEND_ACCEPT', 'ROOM_REQUEST_JOIN'];
const NotificationMessageSchema = new DB.Schema({
    notification_id: DB.Types.ObjectId,
    user_id: { type: DB.Types.ObjectId, ref: 'Users', required: true },
    recived_at: { type: Number, default: 0},
    created_at: { type: Number, default: Date().now() },
    typeof_notification: {
        type: String,
        enum: NotificationTypes, // Loại thông báo
        required: true,
    },
    params: DB.SchemaTypes.Mixed,
});
const NotificationMessageModel = DB.model('NotificationMessages', NotificationMessageSchema);
module.exports = {
    NotificationMessageModel,
};
