const Supplier = require('../models/supplier');
const SupplierKhatabook = require('../models/supplierKhataBook');
const { entityIdGenerator } = require('../utils/generateId');
const logger = require('../utils/logger');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const handleToAddSupplierByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }
        const payload = req.body;
        if (!payload.supplierName || !payload.supplierPhone) {
            return res.status(400).json({ message: "Bad Request: supplierName and supplierPhone are required" });
        }

        const existingSupplier = await Supplier.findOne({ supplierPhone: payload.supplierPhone });
        if (existingSupplier) {
            return res.status(409).json({ message: "Conflict: Supplier already exists with this phone number" });
        }

        const supplierId = entityIdGenerator("SUP");
        const newSupplier = new Supplier({
            supplierId,
            supplierName: payload.supplierName,
            supplierEmail: payload.supplierEmail || "",
            supplierPhone: payload.supplierPhone,
            supplierCompany: payload.supplierCompany || "",
            address: {
                city: payload.address?.city || "",
                state: payload.address?.state || "",
                country: payload.address?.country || "",
                pincode: payload.address?.pincode || "",
                street: payload.address?.street || ""
            }
        });

        await newSupplier.save();

        return res.status(201).json({
            message: "Supplier added successfully",
            supplier: newSupplier
        });

    } catch (err) {
        console.error("Error in adding Supplier:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToGetSupplierListByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }
        const query = req.query;
        let matchQuery = {};

        if (query.supplierId) {
            matchQuery.supplierId = query.supplierId;
        }
        if (query.supplierName) {
            matchQuery.supplierName = query.supplierName;
        }
        if (query.supplierPhone) {
            matchQuery.supplierPhone = query.supplierPhone;
        }
        if (query.supplierEmail) {
            matchQuery.supplierEmail = query.supplierEmail;
        }
        if (query.supplierCompany) {
            matchQuery.supplierCompany = query.supplierCompany;
        }
        if (query.address) {
            matchQuery.address = query.address;
        }

        const suppliers = await Supplier.find(matchQuery).sort({ createdAt: -1 });
        const count = await Supplier.countDocuments(matchQuery);

        return res.status(200).json({
            message: "Suppliers fetched successfully",
            suppliers,
            count
        });
    } catch (err) {
        console.error("Error in fetching Supplier list:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


const handleToUpdateSupplierByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }

        const payload = req.body;
        if (!payload.supplierId) {
            return res.status(400).json({ message: "supplierId is required" });
        }

        const updatedSupplier = await Supplier.findOneAndUpdate(
            { supplierId: payload.supplierId },
            {
                $set: {
                    supplierName: payload.supplierName,
                    supplierEmail: payload.supplierEmail,
                    supplierPhone: payload.supplierPhone,
                    supplierCompany: payload.supplierCompany,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        if (!updatedSupplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }


        return res.status(200).json({
            message: "Supplier updated successfully",
            updatedSupplier
        });
    } catch (err) {
        console.error("Error updating supplier:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToDeleteSupplierByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }

        const { supplierId } = req.body;
        if (!supplierId) {
            return res.status(400).json({ message: "supplierId is required" });
        }

        const deletedSupplier = await Supplier.findOneAndDelete({ supplierId });
        if (!deletedSupplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        // Also delete their Khatabook
        await SupplierKhatabook.findOneAndDelete({ supplierId });

        return res.status(200).json({ message: "Supplier and their khatabook deleted successfully" });
    } catch (err) {
        console.error("Error deleting supplier:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToGetSupplierKhatabook = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }

        const { supplierId } = req.params;
        if (!supplierId) {
            return res.status(400).json({ message: "supplierId is required" });
        }
        const query = req.query;
        let matchQuery = {
            supplierId: supplierId
        };

        if (query.type) {
            matchQuery.type = query.type;
        }
        if (query.paymentMode) {
            matchQuery.paymentMode = query.paymentMode;
        }

        let khatabook = await SupplierKhatabook.findOne(matchQuery);
        if (!khatabook) {
            khatabook = {
                supplierId,
                paidToSupplier: [],
                takenFromSupplier: [],
                totalPaidToSupplier: 0,
                totalTakenFromSupplier: 0
            };
        }

        return res.status(200).json({
            message: "Supplier Khatabook fetched successfully",
            khatabook
        });
    } catch (err) {
        console.error("Error fetching supplier khatabook:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToMakeEntryInSupplierKhatabook = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }

        const { supplierId, Rs, paymentMode, description, type, billno, returnDate } = req.body;

        if (!supplierId || !Rs || !type) {
            return res.status(400).json({ message: "supplierId, Rs, and type (given/taken) are required" });
        }

        const supplier = await Supplier.findOne({ supplierId });
        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        let paymentScreenshotUrl = "";

        if (req.files?.paymentScreenshot?.length > 0) {
            paymentScreenshotUrl = `${baseUrl}/uploads/images/${req.files.paymentScreenshot[0].filename}`;
        }
        const entryId = entityIdGenerator("ENT");
        const transactionItem = {
            Rs: Number(Rs),
            paymentMode: paymentMode || "cash",
            description: description || "",
            entryId: entryId,
            paymentScreenshot: paymentScreenshotUrl,
            billno: billno || "",
            returnDate: returnDate || null,
            updatedAt: new Date()
        };

        let khatabook = await SupplierKhatabook.findOne({ supplierId });
        if (!khatabook) {
            khatabook = new SupplierKhatabook({
                supplierId,
                paidToSupplier: [],
                takenFromSupplier: [],
                totalPaidToSupplier: 0,
                totalTakenFromSupplier: 0
            });
        }

        if (type === "given") {
            khatabook.paidToSupplier.push(transactionItem);
        } else if (type === "taken") {
            khatabook.takenFromSupplier.push(transactionItem);
        } else {
            return res.status(400).json({ message: "Invalid transaction type. Use 'given' or 'taken'." });
        }

        await khatabook.save();

        return res.status(200).json({
            message: "Transaction added successfully",
            khatabook
        });
    } catch (err) {
        console.error("Error in making manual entry in supplier khatabook:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToUpdateSupplierKhatabookEntry = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }

        const { supplierId, entryId, Rs, paymentMode, description, type, billno, returnDate } = req.body;

        if (!supplierId || !entryId || !type) {
            return res.status(400).json({ message: "supplierId, entryId, and type (given/taken) are required" });
        }

        const khatabook = await SupplierKhatabook.findOne({ supplierId });
        if (!khatabook) {
            return res.status(404).json({ message: "Khatabook not found" });
        }

        let entry;
        if (type === "given") {
            entry = khatabook.paidToSupplier.find(entry => entry.entryId === entryId);
        } else if (type === "taken") {
            entry = khatabook.takenFromSupplier.find(entry => entry.entryId === entryId);
        } else {
            return res.status(400).json({ message: "Invalid type. Use 'given' or 'taken'." });
        }

        if (!entry) {
            return res.status(404).json({ message: "Entry not found" });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        let paymentScreenshotUrl = entry.paymentScreenshot;

        if (req.files?.paymentScreenshot?.length > 0) {
            paymentScreenshotUrl = `${baseUrl}/uploads/images/${req.files.paymentScreenshot[0].filename}`;
        }

        // Update fields if provided
        if (Rs !== undefined) entry.Rs = Number(Rs);
        if (paymentMode !== undefined) entry.paymentMode = paymentMode;
        if (description !== undefined) entry.description = description;
        if (billno !== undefined) entry.billno = billno;
        if (returnDate !== undefined) entry.returnDate = returnDate;
        entry.paymentScreenshot = paymentScreenshotUrl;
        entry.updatedAt = new Date();

        await khatabook.save();

        return res.status(200).json({
            message: "Entry updated successfully",
            khatabook
        });
    } catch (err) {
        console.error("Error updating khatabook entry:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToDeleteSupplierKhatabookEntry = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }

        const { supplierId, entryId, type } = req.body;

        if (!supplierId || !entryId || !type) {
            return res.status(400).json({ message: "supplierId, entryId, and type (given/taken) are required" });
        }

        const khatabook = await SupplierKhatabook.findOne({ supplierId });
        if (!khatabook) {
            return res.status(404).json({ message: "Khatabook not found" });
        }

        if (type === "given") {
            khatabook.paidToSupplier.pull({ entryId: entryId });
        } else if (type === "taken") {
            khatabook.takenFromSupplier.pull({ entryId: entryId });
        } else {
            return res.status(400).json({ message: "Invalid type. Use 'given' or 'taken'." });
        }

        await khatabook.save();

        return res.status(200).json({
            message: "Entry deleted successfully",
            khatabook
        });
    } catch (err) {
        console.error("Error deleting khatabook entry:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = {
    handleToAddSupplierByAdmin,
    handleToGetSupplierListByAdmin,
    handleToUpdateSupplierByAdmin,
    handleToDeleteSupplierByAdmin,
    handleToGetSupplierKhatabook,
    handleToMakeEntryInSupplierKhatabook,
    handleToUpdateSupplierKhatabookEntry,
    handleToDeleteSupplierKhatabookEntry
};
