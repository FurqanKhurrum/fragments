// src/index.js

const logger = require('./logger');

// read env variables from .env file (if present)
require('dotenv').config();

// log first, if we are going to crash due to uncaught exception
// https://nodejs.org/api/process.html#event-uncaughtexception
process.on('uncaughtException', (err, origin) => {
  logger.fatal({ err, origin }, 'uncaughtException');
  throw err;
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'unhandledRejection');
  throw reason;
});

// start our server
require('./server');
