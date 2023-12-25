const express = require('express');
const router = express.Router();
const { socketCorsOptions } = require('../configs/cors.config');
const { ENDPOINTS } = require('./socketio.endpoints');
const { NAMESPACE_CONTROLLERS } = require('./socketio.controllers');
const io = require('socket.io')(_SERVER, { cors: socketCorsOptions });
global._IO = io;

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
