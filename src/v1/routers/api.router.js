const express = require('express');
const router = express.Router();

const authRouter = require('./auth.router');
const authMiddleware = require('../middlewares/auth.middleware');
const userRouter = require('../routers/user.router');

router.use('/auth', authRouter);

router.use(authMiddleware.verifyToken);

router.use('/user', userRouter);
module.exports = router;
