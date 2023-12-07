const express = require('express');
const router = express.Router();
const io = require('socket.io')(_SERVER);
const messageNamespace = require('../controllers/socket.io/message.namespace');

const ENDPOINTS = {
    message: '/message',
};

const NAMESPACE_CONTROLLERS = {
    message: messageNamespace,
};

Object.keys(ENDPOINTS).map((e) => {
    const endpoint = ENDPOINTS[e];
    const controller = NAMESPACE_CONTROLLERS[e];

    if (!endpoint || !controller) return false;
    try {
        router.use(endpoint, controller(io.of(endpoint)));
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
});

module.exports = router;
