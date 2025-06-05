// src/index.js

require('dotenv').config();

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

// Import and start the Express server
const app = require('./server');

// Mount the health check route at /
app.get('/', require('./routes/get'));
app.post('/v1/fragments', require('./routes/api/post'));
app.get('/v1/fragments/:id', require('./routes/api/get-id'));
