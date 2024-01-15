const DB = require('mongoose');

const MEMBER_STATUS = ['Pending', 'Accepted', 'Rejected'];

const MessageRoomMemberSchema = new DB.Schema({
    user_id: { type: DB.Types.ObjectId, ref: 'Users' },
    level: {type: Number, default: 0},
    room_id: { type: DB.Types.ObjectId, ref: 'MessageRooms' },
    status: { type: String, enum: MEMBER_STATUS, default: 'Pending' },
    member_permission: {
        out_group: {type: Boolean, default: true},
        kick_member: {type: Boolean, default: false},
        temp_mute_member: {type: Boolean, default: false},
        ban_member: {type: Boolean, default: false},
    },
    message_notification: { type: Boolean, default: true },
    request_by: { type: DB.Types.ObjectId, ref: 'Users' },
    request_time: { type: Number, default: Date.now() },
    response_time: Number,
});

const MessageRoomMemberModel = DB.model('MessageRoomMembers', MessageRoomMemberSchema);
module.exports = {
    MessageRoomMemberModel,
};