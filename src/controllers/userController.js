const Joi = require('joi');
const User = require('../models/User');
const { generateResponse } = require('../utils/responseProvider');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');



exports.completeProfile = async (req, res) => {
    try {
        const payload = req.body;
        if (!payload.name || !payload.businessCategory || !payload.businessName || !payload.userId) {
            return res.status(400).json(generateResponse(false, 'All fields are required'));
        }

        const updatedUser = await User.findOneAndUpdate(
            { userId: payload.userId },
            {
                $set: {
                    name: payload.name,
                    businessCategory: payload.businessCategory,
                    businessName: payload.businessName,
                    address: payload.address || {},
                    role: payload.businessCategory,
                    isProfileUpdated: true // Added as requested
                }
            },
            { new: true, runValidators: true }
        );
        if (!updatedUser) {
            return res.status(404).json(generateResponse(false, 'User not found'));
        }

        const tokenObj = {
            id: updatedUser._id,
            userId: updatedUser.userId,
            mobileNo: updatedUser.mobileNo,
            role: updatedUser.businessCategory // businessCategory is now the role
        };
        const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
        const token = jwt.sign(tokenObj, secret, { expiresIn: '7d' });

        logger.info(`User profile completed for user _id: ${updatedUser._id}`);

        return res.status(200).json(generateResponse(true, 'Profile completed successfully', {
            user: updatedUser,
            token
        }));

    } catch (error) {
        logger.error(`Error in completeProfile: ${error.message}`);
        return res.status(500).json(generateResponse(false, 'Server error during profile completion'));
    }
};

exports.getUser = async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken) {
            return res.status(401).json(generateResponse(false, 'Unauthorized'));
        }
        const user = await User.findById(decodedToken.id);

        if (!user) {
            return res.status(404).json(generateResponse(false, 'User not found'));
        }

        res.status(200).json({
            message: 'User profile fetched successfully', user
        })
    } catch (error) {
        logger.error(`Error in getUser: ${error.message}`);
        return res.status(500).json(generateResponse(false, 'Server error during fetching user profile'));
    }
};
