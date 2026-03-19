const express = require('express');
const router = express.Router();
const staffContoller = require('../controllers/staffController')
const authMiddleware = require('../middlewares/authMiddleware');

const { uploadImages } = require('../middlewares/uploadMiddleware');

router.post('/add', authMiddleware, uploadImages, staffContoller.handleToAddStaffUserByAdmin);
router.get('/get-staff', authMiddleware, staffContoller.handleToGetStaffListByAdmin);
router.patch('/update', authMiddleware, uploadImages, staffContoller.handleToUpdateStaffByAdmin);
router.delete('/delete', authMiddleware, staffContoller.handleToDeleteTheStaffByAdmin);



module.exports = router;
