const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' }
}, { _id: false });

const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true, index: true },
    name: { type: String, default: '' },
    mobileNo: { type: String, required: true, unique: true },
    businessCategory: { type: String, default: '' },
    businessName: { type: String, default: '' },
    role: { type: String },
    otp: { type: String },
    isProfileCompleted: { type: Boolean, default: false },
    isProfileUpdated: { type: Boolean, default: false }, // Added as requested
    isMobileVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    address: { type: addressSchema, default: () => ({}) },
    token: { type: String, default: '' },
    loginHistory: [{
        loginTime: { type: Date, default: Date.now },
        ip: { type: String },
        userAgent: { type: String }
    }], // Added as requested
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
