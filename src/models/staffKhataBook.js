const mongoose = require("mongoose");

const staffKhatabookItemSchema = new mongoose.Schema({
    Rs: { type: Number },
    paymentMode: {
        type: String,
        enum: ["cash", "online", "cheque"],
    },
    description: {
        type: String
    },
    paymentScreenshoot: {
        type: String
    },
    billno: {
        type: Number
    },
    returnDate: {
        type: Date
    },
    hotelBranchName: {
        type: String,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

const staffKhatabookTransectionRecordSchema = mongoose.Schema({
    staffId: {
        type: String,
        required: true,
    },

    paidToStaff: {
        type: [staffKhatabookItemSchema],
        default: [],
    },

    takenFromStaff: {
        type: [staffKhatabookItemSchema],
        default: [],
    },

    totalPaidToStaff: {
        type: Number,
        default: 0,
    },

    totalTakenFromStaffUser: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

staffKhatabookTransectionRecordSchema.pre("save", function () {
    this.totalPaidToStaff = this.paidToStaff.reduce((acc, curr) => acc + (curr.Rs || 0), 0);
    this.totalTakenFromStaffUser = this.takenFromStaff.reduce((acc, curr) => acc + (curr.Rs || 0), 0);
});

staffKhatabookTransectionRecordSchema.post("save", async function (doc) {
    try {
        const Staff = mongoose.model('Staff');
        await Staff.findOneAndUpdate(
            { staffId: doc.staffId },
            {
                totalPaidToStaff: doc.totalPaidToStaff,
                totalTakenFromStaffUser: doc.totalTakenFromStaffUser
            }
        );
    } catch (err) {
        console.error("Error syncing StaffKhatabook totals to Staff model:", err);
    }
});

const StaffKhatabook = mongoose.model('StaffKhatabook', staffKhatabookTransectionRecordSchema);
module.exports = StaffKhatabook;
