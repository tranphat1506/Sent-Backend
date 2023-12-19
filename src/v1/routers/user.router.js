const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// get user info
router.post('/me', userController.getInfo);

router.post('/friend/add', userController.addFriend);
module.exports = router;
