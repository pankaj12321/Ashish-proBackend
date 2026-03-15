const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    mobileNo: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '5m' } // Automatically delete OTP after 5 minutes
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Otp', otpSchema);
