const messageNamespace = require('../controllers/socket.io/message.namespace');
const mainNamespace = require('../controllers/socket.io/online.namespace');
const NAMESPACE_CONTROLLERS = {
    online: mainNamespace,
    message: messageNamespace,
};

module.exports = { NAMESPACE_CONTROLLERS };
