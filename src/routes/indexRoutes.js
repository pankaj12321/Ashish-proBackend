const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const hotelRoutes = require('./hotelRoutes');
const staffRoutes = require('./staff');

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/hotel', hotelRoutes);
router.use('/staff', staffRoutes);

module.exports = router;
