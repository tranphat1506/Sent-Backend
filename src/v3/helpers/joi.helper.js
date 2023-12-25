const Joi = require('joi');
const minAge = new Date('1905-1-1').toISOString();
const maxAge = new Date(Date.now() - 315569259747).toISOString(); // 11 years ago from now
const Regex = {
    email: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
    password: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*-_]).{8,}$/,
    phone: /(\+84|0)+([0-9]{9})\b/,
    user_name: /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{6,32}$/,
};
const Message = {
    space: ' ',
    required: 'không được để trống!',
    min: 'tối thiểu {{#limit}} ký tự!',
    max: 'tối đa {{#limit}} ký tự!',
    pattern: 'không hợp lệ!',
    empty: 'không được để trống!',
    equal: 'không trùng với mật khẩu vừa nhập!',
};
const Label = {
    fname: 'Tên',
    lname: 'Họ và tên đệm',
    display_name: 'Tên hiển thị',
    user_name: 'Tên tài khoản',
    password: 'Mật khẩu',
    re_password: 'Mật khẩu nhập lại',
    email: 'Email',
    phone: 'Số điện thoại',
    birth: 'Tuổi của bạn',
    sex: 'Giới tính',
    role: 'Vai trò của bạn',
    method: 'Phương thức xác thực',
};
const signUpRule = Joi.object({
    display_name: Joi.string()
        .min(8)
        .required()
        .messages({
            'string.empty': Label.display_name + Message.space + Message.empty,
            'any.required': Label.display_name + Message.space + Message.required,
            'string.min': Label.display_name + Message.space + Message.min,
        }),
    user_name: Joi.string()
        .min(6)
        .max(32)
        .pattern(Regex.user_name)
        .messages({
            'string.min': Label.user_name + Message.space + Message.min,
            'string.empty': Label.user_name + Message.space + Message.empty,
            'string.max': Label.user_name + Message.space + Message.max,
            'string.pattern.base': Label.user_name + Message.space + Message.pattern,
        }),
    password: Joi.string()
        .min(8)
        .pattern(Regex.password)
        .required()
        .messages({
            'any.required': Label.password + Message.space + Message.required,
            'string.min': Label.password + Message.space + Message.min,
            'string.empty': Label.password + Message.space + Message.empty,
            'string.pattern.base': Label.password + Message.space + Message.pattern,
        }),
    birth: Joi.date()
        .max(maxAge)
        .min(minAge)
        .iso()
        .required()
        .messages({
            'date.empty': Label.birth + Message.space + Message.empty,
            'any.required': Label.birth + Message.space + Message.required,
            'date.max': Label.birth + Message.space + 'phải tối thiểu là 11 tuổi!',
            'date.min': Label.birth + Message.space + Message.pattern,
        }),
    sex: Joi.number()
        .required()
        .min(0)
        .max(2)
        .messages({
            'number.empty': Label.sex + Message.space + Message.empty,
            'any.required': Label.sex + Message.space + Message.required,
            'number.min': Label.sex + Message.space + Message.pattern,
            'number.max': Label.sex + Message.space + Message.pattern,
        }),
    // re_password: Joi.string()
    //     .equal(Joi.ref('password'))
    //     .required()
    //     .messages({
    //         'any.required':
    //             Label.re_password + Message.space + Message.required,
    //         'string.empty': Label.re_password + Message.space + Message.empty,
    //         'any.only': Label.re_password + Message.space + Message.equal,
    //     }),
    email: Joi.string()
        .pattern(Regex.email)
        .required()
        .messages({
            'any.required': Label.email + Message.space + Message.required,
            'string.empty': Label.email + Message.space + Message.empty,
            'string.pattern.base': Label.email + Message.space + Message.pattern,
        }),
});
module.exports = {
    signUp: (schema) => {
        const { error } = signUpRule.validate(schema);
        if (error) return error;
    },
};
