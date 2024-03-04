const express = require('express');
const router = express.Router();
const { ENDPOINTS } = require('./socketio.endpoints');
const { NAMESPACE_CONTROLLERS } = require('./socketio.controllers');


Object.keys(ENDPOINTS).map((e) => {
    const endpoint = ENDPOINTS[e];
    const controller = NAMESPACE_CONTROLLERS[e];

    if (!endpoint || !controller) return false;
    try {
        router.use(endpoint, controller(_IO.of(endpoint)));
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
});

module.exports = router;
