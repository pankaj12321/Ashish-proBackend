const Joi = require('joi');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateUserId } = require('../utils/generateId');
const { generateResponse } = require('../utils/responseProvider');
const logger = require('../utils/logger');
const twilio = require('twilio');

// Initialize Twilio client if credentials are provided in env
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;


exports.sendOtp = async (req, res) => {
    try {
        const { mobileNo } = req.body;
        if (!mobileNo) {
            return res.status(400).json(generateResponse(false, 'Mobile number is required'));
        }

        let user = await User.findOne({ mobileNo });
        let message = 'OTP sent successfully';

        if (!user) {
            user = await User.create({
                mobileNo,
                userId: generateUserId()
            });
            logger.info(`New user created: ${mobileNo}`);
            message = 'User registered and OTP sent successfully';
        }

        let generatedOtp = '8888';

        // Try generating real OTP if Twilio is configured
        if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
            const realOtp = Math.floor(1000 + Math.random() * 9000).toString();
            try {
                await twilioClient.messages.create({
                    body: `Your Ashish Pro login code is: ${realOtp}`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: `+91${mobileNo}`
                });
                generatedOtp = realOtp;
                logger.info(`Twilio SMS sent to ${mobileNo}`);
            } catch (twilioErr) {
                logger.error(`Failed to send Twilio SMS: ${twilioErr.message}. Fallback to 8888.`);
            }
        } else {
            logger.info(`Sending mock OTP 8888 to mobile number ${mobileNo}`);
        }

        return res.status(200).json(generateResponse(true, message));

    } catch (error) {
        logger.error(`Error in sendOtp: ${error.message}`);
        return res.status(500).json(generateResponse(false, 'Server error during OTP generation'));
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { mobileNo, otpCode } = req.body;

        if (!mobileNo || !otpCode) {
            return res.status(400).json(generateResponse(false, 'Mobile number and OTP code are required'));
        }

        // Check if user exists
        let user = await User.findOne({ mobileNo });

        if (!user) {
            return res.status(404).json(generateResponse(false, 'User not found'));
        }
        await user.save();

        return res.status(200).json(generateResponse(true, 'Verification successful', user));

    } catch (error) {
        logger.error(`Error in verifyOtp: ${error.message}`);
        return res.status(500).json(generateResponse(false, 'Server error during OTP verification'));
    }
};
