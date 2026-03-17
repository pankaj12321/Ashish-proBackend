const dotenv = require('dotenv');
dotenv.config();
const Driver = require('../models/driver')
const User = require('../models/User');
const Joi = require('joi');
const { generateUserId } = require('../utils/generateId');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');


const handleToAddTheDriverByHotelAdmin = async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'hotel') {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const payload = req.body;
        if (!payload.SRnumber || !payload.driverName || !payload.carNumber || !payload.mobileNumber || !payload.address || !payload.address.city || !payload.address.state || !payload.address.pincode) {
            return res.status(400).json(generateResponse(false, 'All fields are required (including address.city, address.state, and address.pincode)'));
        }
        const existingDriverByMobile = await Driver.findOne({ mobileNumber: payload.mobileNumber });
        if (existingDriverByMobile) {
            return res.status(400).json(generateResponse(false, 'Driver already exists with this mobile number'));
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
            return res.status(401).json(generateResponse(false, 'Unauthorized'));
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


module.exports = {
    handleToAddTheDriverByHotelAdmin,
    handleToGetAllTheDriverByHotelAdmin
}

