const DB = require('mongoose');
const UserSchema = new DB.Schema({
    _id: DB.Types.ObjectId,
    account_details: {
        user_name: { type: String, required: true, unique: true },
        password: String,
        role: {
            info: { type: String, default: 'client' }, // Only client or admin
            display: { type: String, default: '' }, // Display a role to web
        },
        email: {
            is_verify: { type: Boolean, default: false },
            details: { type: String, default: '' },
            verify_code: { type: String, default: '' },
        },
        phone: {
            is_verify: { type: Boolean, default: false },
            details: { type: String, default: '' },
        },
        created_at: { type: Number, default: Date.now() },
    },
    info_details: {
        display_name: String,
        birth: {
            day: Number,
            month: Number,
            year: Number,
        },
        sex: {
            display: { type: String, default: 'Chưa cập nhật' },
            info: { type: Number, enum: [-1, 0 , 1, 2] , default: -1 },
        },
        avatar_url: {
            type: String,
            default: 'https://cdn141.picsart.com/357697367045201.jpg',
        },
    }
});

const UserModel = DB.model('Users', UserSchema);
module.exports = {
    UserModel,
};
