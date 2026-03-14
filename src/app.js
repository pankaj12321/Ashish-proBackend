const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const Routes = require('twilio/lib/rest/Routes');
const indexRoutes = require('./routes/indexRoutes');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Http Logger
app.use(morgan('combined', { stream: logger.stream }));

app.use('/api/v1', indexRoutes)
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'backend server is running' });
})

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is running smoothly' });
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Resource not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app;
