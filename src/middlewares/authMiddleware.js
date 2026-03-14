const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateResponse } = require('../utils/responseProvider');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;

        // Check if not token
        if (!token) {
            return res.status(401).json(generateResponse(false, 'No token, authorization denied'));
        }

        // Verify token
        const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
        const decodedToken = jwt.verify(token, secret);

        if (!decodedToken) {
            return res.status(401).json(generateResponse(false, 'Token verification failed'));
        }

        // Fetch user from DB to ensure they still exist and token matches
        const user = await User.findById(decodedToken.id);
        
        if (!user) {
            return res.status(401).json(generateResponse(false, 'User no longer exists, authorization denied'));
        }

        // Set user and decoded token to request object
        req.user = user;
        req.decodedToken = decodedToken;
        
        next();
    } catch (err) {
        return res.status(401).json(generateResponse(false, 'Token is not valid or expired'));
    }
};

module.exports = authMiddleware;
