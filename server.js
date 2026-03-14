require('dotenv').config();
const app = require('./src/app');
const http = require('http');
const connectDB = require('./src/config/db');
const redisClient = require('./src/config/redis');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 6000;

const server = http.createServer(app);

const startServer = async () => {
    try {
        await connectDB();
        await redisClient.connect();
        server.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
        });
    } catch (error) {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
