const DB = require('mongoose');
const UserSchema = new DB.Schema({
    _id: String,
    account_details: {
        user_name: String,
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
            details: { type: String, default: false },
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
});
const UserModel = DB.model('Users', UserSchema);
module.exports = {
    UserModel,
};
