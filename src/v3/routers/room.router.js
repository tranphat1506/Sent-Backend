const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');

// get user info
router.post('/create', roomController.create);
router.post('/add2room', roomController.addMember);
router.post('/getMessageRooms', roomController.getMessageRooms);

module.exports = router;
