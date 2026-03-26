const express = require('express');
const router = express.Router();
const staffContoller = require('../controllers/staffController')
const authMiddleware = require('../middlewares/authMiddleware');

const { uploadImages } = require('../middlewares/uploadMiddleware');

router.post('/add', authMiddleware, uploadImages, staffContoller.handleToAddStaffUserByAdmin);
router.get('/get-staff', authMiddleware, staffContoller.handleToGetStaffListByAdmin);
router.patch('/update', authMiddleware, uploadImages, staffContoller.handleToUpdateStaffByAdmin);
router.delete('/delete', authMiddleware, staffContoller.handleToDeleteTheStaffByAdmin);


// attendance 
router.post('/mark-attendance', authMiddleware, staffContoller.handleToMarkAttendanceOfStaff);
router.patch('/edit-attendance', authMiddleware, staffContoller.handleToEditAttendanceOfStaffByAdmin);
router.get('/get-attendance', authMiddleware, staffContoller.handleToGetAttendanceDetailsOfStaff);
router.get('/khatabook/:staffId', authMiddleware, staffContoller.handleToGetStaffKhatabook);
router.post('/make-entries/khatabook', authMiddleware, uploadImages, staffContoller.handleToMakeTheEntryInStaffKhatabook);


module.exports = router;
