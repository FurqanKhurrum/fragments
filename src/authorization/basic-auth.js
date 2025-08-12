// src/authorization/basic-auth.js

// Configure HTTP Basic Auth strategy for Passport, see:
// https://github.com/http-auth/http-auth-passport

const auth = require('http-auth');
const authPassport = require('http-auth-passport');
const logger = require('../logger');
const authorize = require('./authorize-middleware');

// We expect HTPASSWD_FILE to be defined.
if (!process.env.HTPASSWD_FILE) {
  const errorMessage = 'missing expected env var: HTPASSWD_FILE';

  logger.error(errorMessage);
  throw new Error(errorMessage);
}

module.exports.strategy = () => {
  logger.info('Using Basic-Auth strategy');

  // For our Passport authentication strategy, we'll look for a
  // username/password pair in the Authorization header.
  return authPassport(
    auth.basic({
      file: process.env.HTPASSWD_FILE,
    })
  );
};

module.exports.authenticate = () => authorize('http');
