// src/routes/index.js

const express = require('express');
const { authenticate } = require('../authorization');
const { version, author } = require('../../package.json');
const { createSuccessResponse } = require('../response');
const logger = require('../logger');
const { hostname } = require('os');

const router = express.Router();

// Expose all of our API routes on /v1/* to include an API version.
router.use(`/v1`, authenticate(), require('./api'));

// Define a simple health check route. If the server is running
// we'll respond with a 200 OK.  If not, the server isn't healthy.
router.get('/', (req, res) => {
  logger.debug('Calling GET /');

  // Clients shouldn't cache this response (always request it fresh)
  // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#controlling_caching
  res.setHeader('Cache-Control', 'no-cache');

  // Send a 200 'OK' response with info about our repo
  res.status(200).json(
    createSuccessResponse({
      author: author,
      githubUrl: 'https://github.com/fkhurrum/fragments',
      version: version,

      // Include the hostname in the response
      hostname: hostname(),
    })
  );
});

// export our router
module.exports = router;
