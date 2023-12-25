const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', (req, res) => {
    return res.sendStatus(200);
});

router.post('/isLogin', authMiddleware.verifyToken, authController.authCheck);

router.post('/refresh-token', authController.refreshAccessToken);

router.post('/signup', authController.signUp);

router.post('/signin', authController.signIn);

router.post('/verify', authController.verify);

router.post('/logout', authController.signOut);

module.exports = router;
