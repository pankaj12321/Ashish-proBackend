const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const hotelRoutes = require('./hotelRoutes');

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/hotel', hotelRoutes);

module.exports = router;
