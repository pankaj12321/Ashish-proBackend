const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    SRnumber: {
        type: String,

    },
    driverId: {
        type: String,
    },
    driverName: {
        type: String,
        required: true
    },
    carNumber: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true,
    },
    address: {
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,

        },
        pincode: {
            type: String,
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    isProfileUpdated: {
        type: Boolean,
        default: false
    },
    addedBy: {
        name: { type: String, default: '' },
        mobileNo: { type: String },
        businessCategory: { type: String, default: '' },
        businessName: { type: String, default: '' },
        role: { type: String },
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
