const DB = require('mongoose');

const FRIEND_STATUS = ['Pending', 'Accepted', 'Rejected'];

// Main schema
const FriendSchema = new DB.Schema({
    user_id: { type: DB.Types.ObjectId, ref: 'Users', required: true },
    friend_id: { type: DB.Types.ObjectId, ref: 'Users', required: true },
    status: { type: String, enum: FRIEND_STATUS, default: 'Pending' },
    request_time: { type: Number, default: Date.now() },
    response_time: Number,
});

const FriendModel = DB.model('Friends', FriendSchema);
module.exports = {
    FriendModel,
    FRIEND_STATUS
};
