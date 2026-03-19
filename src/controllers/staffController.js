const Joi = require('joi');
const User = require('../models/User');
const { generateResponse } = require('../utils/responseProvider');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const Staff = require('../models/staff');
const { generateUserId, entityIdGenerator } = require('../utils/generateId');
const { attendanceRecord } = require('../models/attendance');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};


const handleToAddStaffUserByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }
        const payload = req.body;
        if (!payload || Object.keys(payload).length === 0) {
            return res.status(400).json({ message: "Bad Request: Missing or empty request body" });
        }
        if (!payload.firstName || !payload.lastName || !payload.adharNumber || !payload.salary || !payload.mobile || !payload.role || !payload.address.city || !payload.DOB) {
            return res.status(400).json({ message: "Bad Request: Missing required fields" });
        }

        const existingStaffUser = await Staff.findOne({ adharNumber: payload.adharNumber, mobile: payload.mobile });

        if (existingStaffUser) {
            return res.status(409).json({
                message: "Conflict: Staff user already exists"
            });
        }


        const baseUrl = `${req.protocol}://${req.get("host")}`;

        let profileImageUrl = "";
        let idProofImageUrls = [];

        if (req.files?.profileImage?.length > 0) {
            profileImageUrl = `${baseUrl}/uploads/images/${req.files.profileImage[0].filename}`;
        } else if (req.files?.profileImageUrl?.length > 0) {
            profileImageUrl = `${baseUrl}/uploads/images/${req.files.profileImageUrl[0].filename}`;
        }

        if (req.files?.IdProofImage?.length > 0) {
            idProofImageUrls = req.files.IdProofImage.map(file => `${baseUrl}/uploads/images/${file.filename}`);
        }

        const staffId = entityIdGenerator("ST");

        const newStaff = new Staff({
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email || "",
            mobile: payload.mobile,
            age: payload.age || "",
            role: payload.role,
            address: {
                city: payload.address.city,
                state: payload.address.state || "",
                country: payload.address.country || ""
            },
            DOB: payload.DOB,
            adharNumber: payload.adharNumber,
            profileImage: profileImageUrl,
            branchName: payload.branchName,
            salary: payload.salary,
            salaryHistory: payload.salary ? [{ salary: payload.salary, effectiveDate: new Date() }] : [],
            IdProofImage: idProofImageUrls,
            createdAt: new Date(),
            updatedAt: new Date(),
            staffId
        });

        await newStaff.save();

        return res.status(201).json({
            message: "Staff user added successfully",
            staff: newStaff
        });

    } catch (err) {
        console.error("Error in adding Staff:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToGetStaffListByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {

            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }
        let matchQuery = {};
        let query = req.query;

        if (query.staffId) {
            matchQuery.staffId = query.staffId
        }
        const staffList = await Staff.find(matchQuery).sort({ createdAt: -1 });
        const countStaffDocuments = await Staff.countDocuments(matchQuery);
        if (!staffList || staffList.length === 0) {
            return res.status(404).json({ message: "No staff users found" });
        }
        return res.status(200).json({
            message: "Staff users fetched successfully", staffList: staffList,
            countStaff: countStaffDocuments
        });

    }
    catch (err) {
        console.error("Error in fetching Staff list:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})


const handleToUpdateStaffByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== "hotel") {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }

        const payload = req.body;

        if (!payload.staffId) {
            return res.status(400).json({ message: "staffId is required" });
        }

        const existingStaffUser = await Staff.findOne({ staffId: payload.staffId });
        if (!existingStaffUser) {
            return res.status(404).json({ message: "Staff user not found" });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;

        let profileImageUrl = existingStaffUser.profileImage;
        let idProofImageUrls = existingStaffUser.IdProofImage || [];

        if (req.files?.profileImage?.length > 0) {
            profileImageUrl = `${baseUrl}/uploads/images/${req.files.profileImage[0].filename}`;
        } else if (req.files?.profileImageUrl?.length > 0) {
            profileImageUrl = `${baseUrl}/uploads/images/${req.files.profileImageUrl[0].filename}`;
        }

        if (req.files?.IdProofImage?.length > 0) {
            idProofImageUrls = req.files.IdProofImage.map(file => `${baseUrl}/uploads/images/${file.filename}`);
        }

        const isSalaryUpdated = payload.salary !== undefined && payload.salary !== existingStaffUser.salary;
        const updateQuery = {
            $set: {
                firstName: payload.firstName ?? existingStaffUser.firstName,
                lastName: payload.lastName ?? existingStaffUser.lastName,
                email: payload.email ?? existingStaffUser.email,
                mobile: payload.mobile ?? existingStaffUser.mobile,
                age: payload.age ?? existingStaffUser.age,
                role: payload.role ?? existingStaffUser.role,
                gender: payload.gender ?? existingStaffUser.gender,
                branchName: payload.branchName ?? existingStaffUser.branchName,
                salary: payload.salary ?? existingStaffUser.salary,
                DOB: payload.DOB ?? existingStaffUser.DOB,
                adharNumber: payload.adharNumber ?? existingStaffUser.adharNumber,
                profileImage: profileImageUrl,
                IdProofImage: idProofImageUrls,
                address: {
                    city: payload.address?.city ?? existingStaffUser.address?.city,
                    state: payload.address?.state ?? existingStaffUser.address?.state,
                    country: payload.address?.country ?? existingStaffUser.address?.country,
                    pincode: payload.address?.pincode ?? existingStaffUser.address?.pincode,
                    street: payload.address?.street ?? existingStaffUser.address?.street,
                },
            }
        };

        if (isSalaryUpdated) {
            const history = existingStaffUser.salaryHistory || [];

            // If this is the first update and history is empty, initialize it with the current salary
            if (history.length === 0 && existingStaffUser.salary !== undefined) {
                updateQuery.$push = {
                    salaryHistory: {
                        $each: [
                            {
                                salary: existingStaffUser.salary,
                                effectiveDate: existingStaffUser.createdAt || new Date(0)
                            },
                            {
                                salary: payload.salary,
                                effectiveDate: payload.effectiveDate ? new Date(payload.effectiveDate) : new Date()
                            }
                        ]
                    }
                };
            } else {
                updateQuery.$push = {
                    salaryHistory: {
                        salary: payload.salary,
                        effectiveDate: payload.effectiveDate ? new Date(payload.effectiveDate) : new Date()
                    }
                };
            }
        }

        const updatedStaff = await Staff.findOneAndUpdate(
            { staffId: payload.staffId },
            updateQuery,
            { new: true }
        );


        return res.status(200).json({
            message: "Staff user updated successfully",
            updatedStaff,
        });
    } catch (err) {
        console.error("Error updating staff:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


const handleToDeleteTheStaffByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }
        const payload = req.body;
        if (!payload || Object.keys(payload).length === 0) {
            return res.status(400).json({ message: "Bad Request: Missing or empty request body" });
        }
        if (!payload.staffId) {
            return res.status(400).json({ message: "Bad Request: Missing required fields" });
        }
        const existingStaffUser = await Staff.findOne({ staffId: payload.staffId });
        if (!existingStaffUser) {
            return res.status(404).json({ message: "Staff user not found" });
        }
        if (existingStaffUser) {
            await Staff.deleteOne({ staffId: payload.staffId });
            return res.status(200).json({ message: "Staff user deleted successfully" });
        }
    }
    catch (err) {
        console.error("Error in deleting Staff user:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})


const handleToMarkAttendanceOfStaff = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }
        const payload = req.body;
        if (!payload || !payload.staffId || !payload.attendance) {
            return res.status(400).json({ message: "Bad Request: staffId and attendance are required" });
        }

        const staff = await Staff.findOne({ staffId: payload.staffId });
        if (!staff) {
            return res.status(404).json({ message: "Staff user not found" });
        }

        const today = new Date();
        const year = today.getFullYear();
        const monthIndex = today.getMonth() + 1;
        const date = today.getDate();
        const monthName = today.toLocaleString('default', { month: 'long' });

        // Logic: After 24 hour or new day start then only staff attendance can mark
        const existingAttendance = await attendanceRecord.findOne({
            staffId: payload.staffId,
            'attendanceDetails.date': date,
            'attendanceDetails.month': monthIndex,
            'attendanceDetails.year': year
        });

        if (existingAttendance) {
            return res.status(409).json({ message: "Attendance already marked for today. Please wait for the next day." });
        }

        const newAttendance = new attendanceRecord({
            staffId: payload.staffId,
            attendanceDetails: {
                firstName: staff.firstName,
                lastName: staff.lastName,
                mobile: staff.mobile,
                addharNumber: staff.adharNumber,
                attendance: payload.attendance,
                month: monthIndex,
                year: year,
                date: date,
                time: today.toLocaleTimeString()
            },
            attendanceStatus: payload.attendance,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newAttendance.save();

        if (payload.attendance === 'present' || payload.attendance === 'paid leave') {
            const daysInMonth = new Date(year, monthIndex, 0).getDate();
            const perDaySalary = (staff.salary || 0) / daysInMonth;

            let salaryRecord = staff.staffPayableSalary.find(record => record.month === monthName && record.year === year);
            if (!salaryRecord) {
                salaryRecord = {
                    month: monthName,
                    year: year,
                    totalPayableSalary: 0,
                    presentDays: 0,
                    paidLeaveDays: 0
                };
                staff.staffPayableSalary.push(salaryRecord);
                salaryRecord = staff.staffPayableSalary[staff.staffPayableSalary.length - 1];
            }

            if (payload.attendance === 'present') salaryRecord.presentDays += 1;
            else if (payload.attendance === 'paid leave') salaryRecord.paidLeaveDays += 1;

            salaryRecord.totalPayableSalary = (salaryRecord.presentDays + salaryRecord.paidLeaveDays) * perDaySalary;
            staff.markModified('staffPayableSalary');
            await staff.save();
        }

        return res.status(201).json({
            message: "Attendance marked successfully",
            attendance: newAttendance,
            updatedSalaryInfo: staff.staffPayableSalary.find(record => record.month === monthName && record.year === year)
        });

    } catch (err) {
        console.error("Error in marking attendance:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToEditAttendanceOfStaffByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }

        const { staffId, date, month, year, attendance } = req.body;

        if (!staffId || !date || !month || !year || !attendance) {
            return res.status(400).json({ message: "staffId, date, month, year, and attendance are required" });
        }

        const staff = await Staff.findOne({ staffId });
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        let record = await attendanceRecord.findOne({
            staffId,
            'attendanceDetails.date': parseInt(date),
            'attendanceDetails.month': parseInt(month),
            'attendanceDetails.year': parseInt(year)
        });

        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        const daysInMonth = new Date(year, month, 0).getDate();
        const perDaySalary = (staff.salary || 0) / daysInMonth;
        let oldStatus = null;

        if (record) {
            oldStatus = record.attendanceStatus;
            if (oldStatus === attendance) {
                return res.status(200).json({ message: "No changes detected", record });
            }
            record.attendanceStatus = attendance;
            record.attendanceDetails.attendance = attendance;
            record.updatedAt = new Date();
            await record.save();
        } else {
            // Create a new record if not found (Admin Override)
            record = new attendanceRecord({
                staffId,
                attendanceDetails: {
                    firstName: staff.firstName,
                    lastName: staff.lastName,
                    mobile: staff.mobile,
                    addharNumber: staff.adharNumber,
                    attendance: attendance,
                    month: parseInt(month),
                    year: parseInt(year),
                    date: parseInt(date),
                    time: "Admin Override"
                },
                attendanceStatus: attendance,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await record.save();
        }

        // Update Salary logic
        let salaryRecord = staff.staffPayableSalary.find(r => r.month === monthName && r.year === parseInt(year));
        if (!salaryRecord) {
            salaryRecord = { month: monthName, year: parseInt(year), totalPayableSalary: 0, presentDays: 0, paidLeaveDays: 0 };
            staff.staffPayableSalary.push(salaryRecord);
            salaryRecord = staff.staffPayableSalary[staff.staffPayableSalary.length - 1];
        }

        // Revert old status if existed
        if (oldStatus === 'present') salaryRecord.presentDays = Math.max(0, salaryRecord.presentDays - 1);
        else if (oldStatus === 'paid leave') salaryRecord.paidLeaveDays = Math.max(0, salaryRecord.paidLeaveDays - 1);

        // Apply new status
        if (attendance === 'present') salaryRecord.presentDays += 1;
        else if (attendance === 'paid leave') salaryRecord.paidLeaveDays += 1;

        salaryRecord.totalPayableSalary = (salaryRecord.presentDays + salaryRecord.paidLeaveDays) * perDaySalary;
        staff.markModified('staffPayableSalary');
        await staff.save();

        return res.status(200).json({ message: record.isNew ? "Attendance created by Admin" : "Attendance updated by Admin", record });

    } catch (err) {
        console.error("Error editing attendance by admin:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToGetAttendanceDetailsOfStaff = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }
        const { staffId, month, year } = req.query;
        let query = {};
        if (staffId) query.staffId = staffId;
        if (month) query['attendanceDetails.month'] = parseInt(month);
        if (year) query['attendanceDetails.year'] = parseInt(year);

        const attendanceHistory = await attendanceRecord.find(query).sort({ 'attendanceDetails.date': -1 });
        return res.status(200).json({ message: "Attendance history fetched successfully", attendanceHistory });
    } catch (err) {
        console.error("Error fetching attendance:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = {
    handleToAddStaffUserByAdmin,
    handleToGetStaffListByAdmin,
    handleToUpdateStaffByAdmin,
    handleToDeleteTheStaffByAdmin,
    handleToMarkAttendanceOfStaff,
    handleToEditAttendanceOfStaffByAdmin,
    handleToGetAttendanceDetailsOfStaff
}