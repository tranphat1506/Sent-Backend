const express = require('express');
const router = express.Router();
// api route
const apiRouter = require('./api.router');
router.use('/api', apiRouter);
// Socket router
const socketIORouter = require('./socketio.router');
router.use('/socket-io', socketIORouter);
// status route
router.post('/status', (req, res) => {
    return res.status(200).json({ status: 'OK', code: 200, last_modified: _STATUS_TIME });
});

// route notfound
router.all('*', (req, res) => {
    return res.sendStatus('404');
});
module.exports = router;
