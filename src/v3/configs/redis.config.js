const { createClient } = require('redis');
// Redis
const Redis = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_CONNECT_STRING,
        port: process.env.REDIS_PORT,
    },
    legacyMode: true,
});
const connectRedis = () => {
    // Redis.on('error', (err) => console.log('Redis Client Error', err));
    return Redis.connect();
};
module.exports = { connectRedis, Redis };
