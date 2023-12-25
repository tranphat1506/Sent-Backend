const express = require('express');
const router = express.Router();

const authRouter = require('./auth.router');
const authMiddleware = require('../middlewares/auth.middleware');
const userRouter = require('../routers/user.router');
const roomRouter = require('../routers/room.router');

router.use('/auth', authRouter);

router.use(authMiddleware.verifyToken);
router.use('/user', userRouter);
router.use('/room', roomRouter);

module.exports = router;
