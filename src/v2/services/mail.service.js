const nodeMailer = require('../helpers/nodemailer.helper');
const emailTemplate = require('../helpers/email.template');
const sendVerifyEmail = (hashVerifyLink, user_name, user_email) => {
    const { html } = emailTemplate.sendVerifyEmail(hashVerifyLink, user_name);
    const emailStatus = nodeMailer.sendMail(
        'gmail',
        user_email,
        'Xác thực email',
        html,
    );
    return new Promise((resolve, reject) => {
        emailStatus
            .then((r) => {
                console.log(r);
                resolve(r);
            })
            .catch((error) => {
                reject(error);
            });
    });
};

module.exports = {
    sendVerifyEmail,
};
