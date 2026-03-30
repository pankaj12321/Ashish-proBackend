const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const authMiddleware = require('../middlewares/authMiddleware');
const { uploadImages } = require('../middlewares/uploadMiddleware');

// Supplier CRUD
router.post('/add', authMiddleware, supplierController.handleToAddSupplierByAdmin);
router.get('/list', authMiddleware, supplierController.handleToGetSupplierListByAdmin);
router.patch('/update', authMiddleware, supplierController.handleToUpdateSupplierByAdmin);
router.delete('/delete', authMiddleware, supplierController.handleToDeleteSupplierByAdmin);

// Supplier Khatabook
router.get('/khatabook/:supplierId', authMiddleware, supplierController.handleToGetSupplierKhatabook);
router.post('/make-entry', authMiddleware, uploadImages, supplierController.handleToMakeEntryInSupplierKhatabook);
router.patch('/edit-entry', authMiddleware, uploadImages, supplierController.handleToUpdateSupplierKhatabookEntry);
router.delete('/delete-entry', authMiddleware, supplierController.handleToDeleteSupplierKhatabookEntry);

module.exports = router;
