const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/send/otp', authController.sendOtp);
router.post('/login-user', authController.loginUser);
router.post('/verify-otp', authController.verifyOtp);

module.exports = router;
