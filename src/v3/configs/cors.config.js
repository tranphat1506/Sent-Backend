const whitelist = ['http://localhost:3000'];
const normalCorsOptions = {
    origin: (origin, callback) => {
        /* Here mean localhost == undefinded */
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization'],
};

const socketCorsOptions = {
    origin: (origin, callback) => {
        /* Here mean localhost == undefinded */
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization'],
};
module.exports = {
    normalCorsOptions,
    socketCorsOptions,
};
