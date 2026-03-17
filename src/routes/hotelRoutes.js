const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/add-driver', authMiddleware, hotelController.handleToAddTheDriverByHotelAdmin);
router.get('/get-all-driver', authMiddleware, hotelController.handleToGetAllTheDriverByHotelAdmin);



module.exports = router;