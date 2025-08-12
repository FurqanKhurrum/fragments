// src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const logger = require('./logger');
const passport = require('passport');
const authenticate = require('./authorization');
const { createErrorResponse } = require('./response');

// use our default logger instance
const pino = require('pino-http')({ logger });

// create an express app instance to attach our middleware and HTTP routes
const app = express();

// attach logging middleware
app.use(pino);

// attach security middleware
app.use(helmet());

// attach CORS middleware to make requests across origins
app.use(cors());

// attach compression middleware
app.use(compression());

// setup passport authentication middleware
passport.use(authenticate.strategy());
app.use(passport.initialize());

// Define our routes
app.use('/', require('./routes'));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// error handling middleware to deal with anything else
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // We may already have an error response we can use, but if not, use a generic
  // 500 server error and message.
  const code = err.status || 500;
  const message = err.message || 'unable to process request';

  // If this is a server error, log something so we can see what's going on.
  if (code > 499) {
    logger.error({ err }, 'Error processing request');
  }

  const errorResponse = createErrorResponse(code, message);
  res.status(code).json(errorResponse);
});

// 404 middleware to handle requests for resources that can't be found
app.use((req, res) => {
  logger.error({ path: req.headers.host + req.url }, '404, page was not found');

  const errorResponse = createErrorResponse(404, 'not found');
  res.status(404).json(errorResponse);
});

// export our app for to be used by server.js
module.exports = app;
