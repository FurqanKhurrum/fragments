// src/index.js

require('dotenv').config(); // ✅ Load environment variables

const logger = require('./logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err, origin) => {
  logger.fatal({ err, origin }, 'uncaughtException');
  throw err;
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'unhandledRejection');
  throw reason;
});

// Start your server
require('./server');
