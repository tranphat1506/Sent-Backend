const jwt = require('jsonwebtoken');

const verifyToken = (token, secret) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (error, decoded) => {
            if (error) {
                return reject(error);
            }
            return resolve({
                status: 'success',
                decoded,
            });
        });
    });
};
const generateToken = (schema, secret, tokenLife) => {
    const splitSchema = {
        _id: schema._id,
    };
    return new Promise((resolve, reject) => {
        jwt.sign(
            splitSchema,
            secret,
            {
                expiresIn: tokenLife,
                algorithm: 'HS256',
            },
            (error, encoded) => {
                if (error) return reject(error);
                return resolve({
                    status: 'success',
                    encoded,
                });
            },
        );
    });
};
const getPayload = (token) => {
    return jwt.decode(token, { json: true });
};
module.exports = {
    verifyToken,
    generateToken,
    getPayload,
};
