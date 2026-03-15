const Joi = require('joi');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
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

        let user;
        let message = 'OTP sent successfully';
        if (!existingUser) {
            user = await User.create({
                mobileNo,
                userId: generateUserId(),
                isProfileCompleted: false,
                isMobileVerified: false,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            logger.info(`New user created: ${mobileNo}`);
            message = 'User registered and OTP sent successfully';
        } else {
            user = existingUser;
            logger.info(`OTP requested for existing user: ${mobileNo}`);
        }

        let generatedOtp = '8888';
        user.otp = generatedOtp;
        await user.save();


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
                user.otp = generatedOtp;
                await user.save();
                logger.info(`Twilio SMS sent to ${mobileNo}`);
            } catch (twilioErr) {
                logger.error(`Failed to send Twilio SMS: ${twilioErr.message}. Fallback to 8888.`);
            }
        } else {
            logger.info(`Sending mock OTP 8888 to mobile number ${mobileNo}`);
        }

        // Save OTP to DB
        await Otp.findOneAndUpdate(
            { mobileNo },
            {
                otp: generatedOtp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes 
            },
            { upsert: true, new: true }
        );

        return res.status(200).json(generateResponse(true, message));

    } catch (error) {
        logger.error(`Error in sendOtp: ${error.message}`);
        return res.status(500).json(generateResponse(false, 'Server error during OTP generation'));
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { mobileNo } = req.body;
        if (!mobileNo) {
            return res.status(400).json(generateResponse(false, 'Mobile number is required'));
        }

        let existingUser = await User.findOne({ mobileNo });
        if (!existingUser) {
            return res.status(404).json(generateResponse(false, 'Mobile number not registered'));
        }

        let generatedOtp = '8888';
        if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
            const realOtp = Math.floor(1000 + Math.random() * 9000).toString();
            try {
                await twilioClient.messages.create({
                    body: `Your Ashish Pro login code is: ${realOtp}`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: `+91${mobileNo}`
                });
                generatedOtp = realOtp;
            } catch (twilioErr) {
                logger.error(`Twilio error: ${twilioErr.message}`);
            }
        }

        existingUser.otp = generatedOtp;
        await existingUser.save();

        await Otp.findOneAndUpdate(
            { mobileNo },
            {
                otp: generatedOtp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            },
            { upsert: true, new: true }
        );

        return res.status(200).json(generateResponse(true, 'OTP sent for login', { mobileNo }));

    } catch (error) {
        logger.error(`Error in login: ${error.message}`);
        return res.status(500).json(generateResponse(false, 'Server error during login'));
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { mobileNo, otpCode } = req.body;

        if (!mobileNo || !otpCode) {
            return res.status(400).json('Mobile number and OTP code are required');
        }

        // Check if user exists
        let otp = otpCode
        let existingUser = await User.findOne({ mobileNo, otp });
        if (existingUser) {
            const tokenObj = {
                id: existingUser._id,
                userId: existingUser.userId,
                mobileNo: existingUser.mobileNo,
                role: existingUser.businessCategory
            };
            const token = jwt.sign(tokenObj, process.env.JWT_SECRET, { expiresIn: '1h' });

            // Update user status
            existingUser.isMobileVerified = true;
            existingUser.updatedAt = new Date();
            await existingUser.save();

            // Delete OTP after successful verification
            await Otp.deleteOne({ mobileNo });

            return res.status(200).json({
                success: true,
                message: 'Verification successful',
                token: token,
                user: existingUser
            });
        }

        return res.status(404).json(generateResponse(false, 'Invalid OTP or OTP expired'));

    } catch (error) {
        logger.error(`Error in verifyOtp: ${error.message}`);
        return res.status(500).json(generateResponse(false, 'Server error during OTP verification'));
    }
};
