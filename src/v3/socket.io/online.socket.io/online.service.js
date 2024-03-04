const OnlineState = require('./states/online.state');
const { Redis } = require('../../configs/redis.config');
const initOnlineServiceSchema = {
    online: 0,
    users: {},
};
const DB_NAME = 'online-db';
class OnlineServiceClass {
    init() {
        return new Promise(async (resolve, reject) => {
            const initPromises = Promise.all(
                Object.keys(initOnlineServiceSchema).map((key) => {
                    return Redis.HSET(DB_NAME, key, JSON.stringify(initOnlineServiceSchema[key]));
                }),
            );

            return initPromises
                .then(async () => {
                    return resolve(OnlineService);
                })
                .catch((error) => {
                    return reject(error);
                });
        });
    }
    push() {}
}

const OnlineService = new OnlineServiceClass();
module.exports = { OnlineService };
