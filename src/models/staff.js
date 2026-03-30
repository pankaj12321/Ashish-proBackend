const mongoose = require('mongoose');
const { entityIdGenerator } = require('../utils/generateId');

const staffSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String
    },
    mobile: {
        type: String,
    },
    staffId: {
        type: String,
        unique: true,
    },
    age: {
        type: Number,
    },
    salary: {
        type: Number
    },
    salaryHistory: [
        {
            salary: { type: Number },
            effectiveDate: { type: Date, default: Date.now }
        }
    ],
    gender: {
        type: String,
    },
    profileImage: {
        type: String,
    },
    IdProofImage: {
        type: [String],
    },
    adharNumber: {
        type: String
    },
    DOB: {
        type: String,
    },
    address: {
        city: {
            type: String,
        },
        state: {
            type: String,
        },
        country: {
            type: String,
        },
        pincode: {
            type: String,
        },
        street: {
            type: String,
        }
    },
    role: {
        type: String,
        default: "staff"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    staffPayableSalary: [
        {
            month: { type: String },
            year: { type: Number },
            totalPayableSalary: { type: Number, default: 0 },
            presentDays: { type: Number, default: 0 },
            paidLeaveDays: { type: Number, default: 0 }
        }
    ],
    totalPaidToStaff: {
        type: Number,
        default: 0,
    },
    totalTakenFromStaffUser: {
        type: Number,
        default: 0,
    },

},
    { timestamps: true }
)

const Staff = new mongoose.model('Staff', staffSchema);
module.exports = Staff;