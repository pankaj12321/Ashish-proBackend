const dotenv = require('dotenv');
dotenv.config();
const Driver = require('../models/driver')
const User = require('../models/User');
const Joi = require('joi');
const { generateUserId } = require('../utils/generateId');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const DriverCommisionEntry = require('../models/driverEntryModel')


const handleToAddTheDriverByHotelAdmin = async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const payload = req.body;
        if (!payload.SRnumber || !payload.driverName || !payload.carNumber || !payload.mobileNumber || !payload.address || !payload.address.city) {
            return res.status(400).json({ message: 'All fields are required (including address.city, address.state, and address.pincode)' });
        }
        const existingDriverByMobile = await Driver.findOne({ mobileNumber: payload.mobileNumber });
        if (existingDriverByMobile) {
            return res.status(400).json({ message: 'Driver already exists with this mobile number' });
        }



        const driverId = generateUserId();
        const newDriver = new Driver({
            SRnumber: payload.SRnumber,
            driverId,
            driverName: payload.driverName,
            carNumber: payload.carNumber,
            mobileNumber: payload.mobileNumber,
            address: payload.address,
            addedBy: {
                name: decodedToken.name,
                mobileNo: decodedToken.mobileNo,
                businessCategory: decodedToken.role,
                role: decodedToken.role
            }
        });
        await newDriver.save();

        return res.status(201).json({ message: 'Driver added successfully', newDriver });
    } catch (error) {
        logger.error(`Error in handleToAddTheDriverByHotelAdmin: ${error.message}`);
        return res.status(500).json({ message: 'Server error during adding driver' });
    }
}

const handleToGetAllTheDriverByHotelAdmin = async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const query = req.query;
        let matchQuery = { 'addedBy.role': 'hotel' };
        if (query.SRnumber) {
            matchQuery.SRnumber = query.SRnumber;
        }
        if (query.driverName) {
            matchQuery.driverName = query.driverName;
        }
        if (query.carNumber) {
            matchQuery.carNumber = query.carNumber;
        }
        if (query.mobileNumber) {
            matchQuery.mobileNumber = query.mobileNumber;
        }
        if (query.city) {
            matchQuery['address.city'] = query.city;
        }

        const drivers = await Driver.find(matchQuery);
        const count = await Driver.countDocuments(matchQuery);
        return res.status(200).json({ message: 'Drivers fetched successfully', drivers, count });
    } catch (error) {
        logger.error(`Error in handleToGetAllTheDriverByHotelAdmin: ${error.message}`);
        return res.status(500).json({ message: 'Server error during fetching drivers' });
    }
}

const handleToEditTheDriverByHotelAdmin = async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const payload = req.body;
        if (!payload.driverId) {
            return res.status(400).json({ message: 'Driver ID is required' });
        }
        const existingDriver = await Driver.findOne({ driverId: payload.driverId });
        if (!existingDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        const updatedDriver = await Driver.findOneAndUpdate(
            { driverId: payload.driverId },
            {
                $set: {
                    driverName: payload.driverName,
                    SRnumber: payload.SRnumber,
                    carNumber: payload.carNumber,
                    mobileNumber: payload.mobileNumber,
                    address: payload.address,
                    status: payload.status,
                    isProfileUpdated: payload.isProfileUpdated,
                    "address.city": payload.address?.city,
                    "address.state": payload.address?.state,
                    "address.pincode": payload.address?.pincode
                }
            },
            { new: true }
        );
        return res.status(200).json({ message: 'Driver updated successfully', updatedDriver });
    }
    catch (error) {
        logger.error(`Error in handleToEditTheDriverByHotelAdmin: ${error.message}`);
        return res.status(500).json({ message: 'Server error during editing driver' }, error.message);
    }
}
const handleToAddDriverEntryByAdmin = async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const payload = req.body;
        if (!payload.driverId) {
            return res.status(400).json({ message: 'Driver ID is required' });
        }
        const existingDriver = await Driver.findOne({ driverId: payload.driverId });
        if (!existingDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        const entryId = generateUserId("ENT");

        const newDriverCommissionEntry = new DriverCommisionEntry({
            entryId,
            driverId: existingDriver.driverId,
            driverName: existingDriver.driverName,
            carNumber: existingDriver.carNumber,
            mobileNumber: existingDriver.mobileNumber,

            SRnumber: existingDriver.SRnumber,

            driverCommisionAmount: payload.driverCommisionAmount || 0,
            partyAmount: payload.partyAmount || 0,
            description: payload.description || "",

            foodTaken: payload.foodTaken ?? false,
            status: payload.status || "pending",

            entryDate: payload.entryDate || new Date(),
        });

        await newDriverCommissionEntry.save();

        return res.status(201).json({
            message: 'Driver commission entry created successfully',
            data: newDriverCommissionEntry
        });

    } catch (error) {
        logger.error(`Error in handleToAddDriverEntryByAdmin: ${error.message}`);
        return res.status(500).json({
            message: 'Server error during adding driver entry',
            error: error.message
        });
    }
};

const handleToGetAllTheDriverEntryByAdmin = async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const query = req.query;
        let matchQuery = {};
        if (query.driverId) {
            matchQuery.driverId = query.driverId;
        }
        if (query.driverName) {
            matchQuery.driverName = query.driverName;
        }
        if (query.carNumber) {
            matchQuery.carNumber = query.carNumber;
        }
        if (query.mobileNumber) {
            matchQuery.mobileNumber = query.mobileNumber;
        }
        if (query.city) {
            matchQuery['address.city'] = query.city;
        }
        const drivers = await DriverCommisionEntry.find(matchQuery);
        const count = await DriverCommisionEntry.countDocuments(matchQuery);
        return res.status(200).json({ message: 'Drivers fetched successfully', drivers, count });
    }
    catch (error) {
        logger.error(`Error in handleToGetAllTheDriverEntryByAdmin: ${error.message}`);
        return res.status(500).json({ message: 'Server error during fetching drivers' }, error.message);
    }
}

const handleToEditTheDriverEntryByAdmin = async (req, res) => {
    try {

        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const payload = req.body;
        if (!payload.entryId || !payload.driverId) {
            return res.status(400).json({ message: 'Entry ID and driver ID is required' });
        }
        const existingDriverEntry = await DriverCommisionEntry.findOne({ entryId: payload.entryId, driverId: payload.driverId });
        if (!existingDriverEntry) {
            return res.status(404).json({ message: 'Driver entry not found' });
        }
        const updatedDriverEntry = await DriverCommisionEntry.findOneAndUpdate(
            { entryId: payload.entryId },
            {
                $set: {
                    driverCommisionAmount: payload.driverCommisionAmount,
                    partyAmount: payload.partyAmount,
                    description: payload.description,
                    foodTaken: payload.foodTaken,
                    status: payload.status,
                    entryDate: payload.entryDate,
                }
            },
            { new: true }
        );
        return res.status(200).json({ message: 'Driver entry updated successfully', updatedDriverEntry });

    }
    catch (error) {
        logger.error(`Error in handleToGetAllTheDriverEntryByAdmin: ${error.message}`);
        return res.status(500).json({ message: 'Server error during fetching drivers' }, error.message);
    }
}

const handleToDeleteTheDriversEntryByAdmin = async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const payload = req.body;
        if (!payload.entryId || !payload.driverId) {
            return res.status(400).json({ message: 'Entry ID and driver ID is required' });
        }
        const existingDriverEntry = await DriverCommisionEntry.findOne({ entryId: payload.entryId, driverId: payload.driverId });
        if (!existingDriverEntry) {
            return res.status(404).json({ message: 'Driver entry not found' });
        }
        const deletedDriverEntry = await DriverCommisionEntry.findOneAndDelete({ entryId: payload.entryId });
        return res.status(200).json({ message: 'Driver entry deleted successfully', deletedDriverEntry });
    }
    catch (error) {
        logger.error(`Error in handleToDeleteTheDriversEntryByAdmin: ${error.message}`);
        return res.status(500).json({ message: 'Server error during deleting drivers entry' }, error.message);
    }
}


module.exports = {
    handleToAddTheDriverByHotelAdmin,
    handleToGetAllTheDriverByHotelAdmin,
    handleToEditTheDriverByHotelAdmin,
    handleToAddDriverEntryByAdmin,
    handleToGetAllTheDriverEntryByAdmin,
    handleToEditTheDriverEntryByAdmin,
    handleToDeleteTheDriversEntryByAdmin
}

