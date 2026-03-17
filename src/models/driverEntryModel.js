const mongoose = require("mongoose");

const driverCommisionEntrySchema = new mongoose.Schema(
    {
        entryId: {
            type: String,
        },
        driverId: {
            type: String,
        },
        driverName: {
            type: String,
        },
        carNumber: {
            type: String,
        },
        mobileNumber: {
            type: String,
        },
        SRnumber: {
            type: String,
        },
        driverCommisionAmount: {
            type: Number,
            default: 0,
        },
        description: {
            type: String,
        },
        partyAmount: {
            type: Number,
            default: 0,
        },
        foodTaken: {
            type: Boolean,
        },
        status: {
            type: String,
            enum: ["pending", "completed", "cancelled"],

        },
        entryDate: {
            type: Date,
            default: Date.now,
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
const DriverCommisionEntry = mongoose.model("DriverCommisionEntry", driverCommisionEntrySchema);
module.exports = DriverCommisionEntry;