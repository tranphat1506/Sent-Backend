const env = require('dotenv');
env.config();
const PORT = process.env.PORT || 3001;
const HOST = process.env.BE_URL || 'http://locahost';
const STATUS_TIME = new Date(Date.now() + 7 * 60 * 60 * 1000).toUTCString();
global._STATUS_TIME = STATUS_TIME;

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
global._SERVER = server;
//MIDDLEWARES
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const cookieParser = require('cookie-parser');
app.use(cookieParser('abc'));
if (process.env.NODE_ENV !== 'development') app.set('trust proxy', 1);
// Security
const helmet = require('helmet');
app.use(helmet());

// CORS
const cors = require('cors');
const { normalCorsOptions } = require('./src/v1/configs/cors.config');
app.use(cors(normalCorsOptions));

// Default headers
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return next();
});

// LOGGER
const { reqHandle, errorHandle, logEvents } = require('./src/v1/middlewares/logEvents');

app.use(reqHandle);
app.use(errorHandle);

// Routes
const Router = require('./src/v1/routers/routers');
app.use(Router);

// Run
server.listen(PORT, () => {
    process.env.NODE_ENV != 'development' ? logEvents(`Server run on PORT ${PORT}`, `server`) : false;
    console.log(`Server run on PORT ${PORT}`);
});
// DB
const connectDB = require('./src/v1/configs/database.config');
connectDB
    .catch((err) => {
        process.env.NODE_ENV != 'development' ? logEvents(`${err.name}: ${err.message}`, `errors`) : false;
        console.log(`${err.name}: ${err.message}`);
        server.close();
    })
    .then(() => {
        process.env.NODE_ENV != 'development' ? logEvents(`Connect DB SUCCESS!`, `server`) : false;
        console.log(`Connect DB SUCCESS!`);
    });
// Redis
// const { createClient } = require('redis');
// const Redis = createClient({
//     password: process.env.REDIS_PASSWORD,
//     socket: {
//         host: process.env.REDIS_CONNECT_STRING,
//         port: process.env.REDIS_PORT,
//     },
// });
// global._REDIS = Redis;
// const connectRedis = async (redis) => {
//     redis.on('error', (err) => console.log('Redis Client Error', err));
//     return await redis.connect();
// };
// connectRedis(Redis)
//     .catch((err) => {
//         process.env.NODE_ENV != 'development' ? logEvents(`${err.name}: ${err.message}`, `errors`) : false;
//         console.log(`${err.name}: ${err.message}`);
//         server.close();
//     })
//     .then(() => {
//         process.env.NODE_ENV != 'development' ? logEvents(`Connect Redis SUCCESS!`, `server`) : false;
//         console.log('Connect Redis SUCCESS!');
//     });
global._ROOM = {};
global._USERS = {};
