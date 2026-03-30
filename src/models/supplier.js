const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
    supplierId: {
        type: String,
        required: true,
        unique: true,
    },
    supplierName: {
        type: String,
        required: true,
    },
    supplierEmail: {
        type: String,
    },
    supplierPhone: {
        type: String,
        required: true,
    },
    supplierCompany: {
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
    totalPaidToSupplier: {
        type: Number,
        default: 0,
    },
    totalTakenFromSupplier: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
},
    { timestamps: true }
);

const Supplier = mongoose.model('Supplier', supplierSchema);
module.exports = Supplier;
