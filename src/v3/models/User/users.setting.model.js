const DB = require('mongoose');

const ONLY_FRIEND_OR_EVERYONE = ['everyone', 'friend'];
const ONLY_STRANGER_OR_EVERYONE = ['everyone', 'stranger'];

const UserSettingSchema = new DB.Schema({
    user_id: { type: DB.Types.ObjectId, ref: 'Users', required: true },
    allow_add_to_room: { type: String, enum: ONLY_FRIEND_OR_EVERYONE, default: 'everyone' },
    need_accept_request_join_room: { type: String, enum: ONLY_STRANGER_OR_EVERYONE, default: 'stranger' },
    allow_messaging: { type: String, enum: ONLY_FRIEND_OR_EVERYONE, default: 'everyone' },
    allow_add_friend: { type: Boolean, default: true },
});

const UserSettingModel = DB.model('UserSettings', UserSettingSchema);
module.exports = {
    UserSettingModel,
};
