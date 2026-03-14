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
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    address: { type: addressSchema, default: () => ({}) },
    token: { type: String, default: '' }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
