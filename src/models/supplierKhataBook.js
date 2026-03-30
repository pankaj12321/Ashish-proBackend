const mongoose = require("mongoose");

const supplierKhatabookItemSchema = new mongoose.Schema({
    Rs: { type: Number },
    paymentMode: {
        type: String,
        enum: ["cash", "online", "cheque"],
    },
    description: {
        type: String
    },
    paymentScreenshot: {
        type: String
    },
    billno: {
        type: String
    },
    returnDate: {
        type: Date
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

const supplierKhatabookSchema = new mongoose.Schema({
    supplierId: {
        type: String,
        required: true,
        unique: true,
    },
    entryId: {
        type: String,
    },
    paidToSupplier: {
        type: [supplierKhatabookItemSchema],
        default: [],
    },
    takenFromSupplier: {
        type: [supplierKhatabookItemSchema],
        default: [],
    },
    totalPaidToSupplier: {
        type: Number,
        default: 0,
    },
    totalTakenFromSupplier: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

supplierKhatabookSchema.pre("save", function () {
    this.totalPaidToSupplier = this.paidToSupplier.reduce((acc, curr) => acc + (curr.Rs || 0), 0);
    this.totalTakenFromSupplier = this.takenFromSupplier.reduce((acc, curr) => acc + (curr.Rs || 0), 0);
});

supplierKhatabookSchema.post("save", async function (doc) {
    try {
        const Supplier = mongoose.model('Supplier');
        await Supplier.findOneAndUpdate(
            { supplierId: doc.supplierId },
            {
                totalPaidToSupplier: doc.totalPaidToSupplier,
                totalTakenFromSupplier: doc.totalTakenFromSupplier
            }
        );
    } catch (err) {
        console.error("Error syncing SupplierKhatabook totals to Supplier model:", err);
    }
});

const SupplierKhatabook = mongoose.model('SupplierKhatabook', supplierKhatabookSchema);
module.exports = SupplierKhatabook;
