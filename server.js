const env = require('dotenv');
env.config();
const colors = require('colors/safe');
colors.enable();
const PORT = process.env.PORT || 3001;
const HOST = process.env.BE_URL || 'http://locahost';
const STATUS_TIME = new Date(Date.now() + 7 * 60 * 60 * 1000).toUTCString();
const { socketCorsOptions } = require('./src/v3/configs/cors.config');

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const connectDB = require('./src/v3/configs/database.config');
const { fetchAllRooms, countUser, countRoom } = require('./src/v3/services/socket.io/common.service');
const { OnlineService } = require('./src/v3/socket.io/online.socket.io/online.service');
const { connectRedis, Redis } = require('./src/v3/configs/redis.config');

// Global var
global._STATUS_TIME = STATUS_TIME;
global._USERS = {};
global._MESSAGE_ROOMS = {};
global._NOTIFICATION_ROOMS = {};
global._ONLINE_ROOMS = {};
global._SERVER = server;
// Socket IO
const io = require('socket.io')(server, { cors: socketCorsOptions });
global._IO = io;

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
const { normalCorsOptions } = require('./src/v3/configs/cors.config');
app.use(cors(normalCorsOptions));

// Default headers
app.use((req, res, next) => {
    // Khong su dung cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return next();
});

// LOGGER
const { reqHandle, errorHandle, logEvents } = require('./src/v3/middlewares/logEvents');

app.use(reqHandle);
app.use(errorHandle);

// Routes
const Router = require('./src/v3/routers/routers');
app.use(Router);

// Run Server
class InitService {
    constructor(serviceName = 'UNDEFINED', runFunc = async () => {}) {
        this.serviceName = `${serviceName.toUpperCase()}_SERVICE`;
        this.status = false;
        this.connectFunction = runFunc;
        this.service = null;
        this.RUNNING_FAIL_MESSAGE = `RUNNING ${this.serviceName} FAIL :(.`;
        this.RUNNING_SUCCESS_MESSAGE = `RUNNING ${this.serviceName} SUCCESS :).`;
    }

    async init() {
        try {
            console.log(colors.yellow(`SERVER: TRYING CONNECTING TO ${this.serviceName}`));
            this.service = await this.connectFunction();
            // If success.
            this.status = true;
            console.log(colors.green(`SERVER: ${this.RUNNING_SUCCESS_MESSAGE}`));
        } catch (error) {
            // If service running fail
            console.log(colors.red(`SERVER: ${this.RUNNING_FAIL_MESSAGE}`));
            process.env.NODE_ENV != 'development'
                ? logEvents(`${error.name}: ${error.message}`, `errors`)
                : console.log(`${error.name}: ${error.message}`);
            this.status = false;
            this.service = null;
        }
    }
}

class ServiceStatus {
    constructor(services = []) {
        this.services = services;
        this.currentService = 0;
    }

    async startServices() {
        this.startTime = Date.now();
        for (let i = 0; i < this.services.length; i++) {
            this.currentService = i;
            const service = this.services[this.currentService];
            await service.init();
            // If running service fail
            // if (service.status === false) break;
        }
        this.endTime = Date.now();
    }

    get getRunningTime() {
        if (!this.startTime) return undefined;
        return this.endTime - this.startTime;
    }

    get isDone() {
        return !this.services.find((service) => {
            return service.status == false;
        });
    }
}

const INIT_SERVER_FUNC = {
    mongoose: connectDB,
    redis: connectRedis,
    message_rooms: fetchAllRooms,
    online: OnlineService.init,
};

const initServices = Object.keys(INIT_SERVER_FUNC).map((name) => {
    return new InitService(name, INIT_SERVER_FUNC[name]);
});
const serviceStatus = new ServiceStatus(initServices);
global._SERVICE_STATUS = serviceStatus;
console.clear();
console.log(colors.green('START RUNNING SERVER...'));
// Running database, redis, microservice and more
serviceStatus
    .startServices()
    .catch((err) => {
        console.log(`${colors.red(err.name)}: ${err.message}`);
        process.env.NODE_ENV != 'development' ? logEvents(`${err.name}: ${err.message}`, `errors`) : false;
    })
    .then(async () => {
        const totalTime = serviceStatus.getRunningTime;
        console.log(_SERVICE_STATUS);
        if (serviceStatus.isDone) {
            process.env.NODE_ENV != 'development'
                ? logEvents(`Running server success:::${totalTime / 1000}s`, `server`)
                : console.log(`Running server success:::${colors.bold(colors.yellow(`${totalTime / 1000}` + 's'))}`);
            server.listen(PORT, () => {
                process.env.NODE_ENV != 'development' ? logEvents(`Server run on ${HOST}:${PORT}`, `server`) : false;
                console.log(colors.green('Server run on'), colors.cyan(colors.bold(`${HOST}:${PORT}`)));
            });
            console.log(`${await countUser()} users Online`, `\n${await countRoom()} rooms Exist`);
        }
    });
