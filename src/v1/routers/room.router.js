const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');

// get user info
router.post('/create', roomController.create);
module.exports = router;
