const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/add-driver', authMiddleware, hotelController.handleToAddTheDriverByHotelAdmin);
router.get('/get-all-driver', authMiddleware, hotelController.handleToGetAllTheDriverByHotelAdmin);
router.patch('/edit-driver', authMiddleware, hotelController.handleToEditTheDriverByHotelAdmin);

// driver entry routes

router.post('/add-driver-entry', authMiddleware, hotelController.handleToAddDriverEntryByAdmin);
router.get('/get-all-driver-entry', authMiddleware, hotelController.handleToGetAllTheDriverEntryByAdmin);
router.patch('/edit-driver-entry', authMiddleware, hotelController.handleToEditTheDriverEntryByAdmin);
router.delete('/delete-driver-entry', authMiddleware, hotelController.handleToDeleteTheDriversEntryByAdmin);
module.exports = router;