// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

// Support sending various Content-Types on the body up to 5M in size
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      try {
        const { type } = contentType.parse(req);
        const supported = Fragment.isSupportedType(type);
        logger.debug({ type, supported }, 'rawBody parser type check');
        return supported;
      }catch (err) {
        logger.warn({ err }, 'rawBody parser could not parse content type');
        return false; 
      }
    },
});

// Create a router on which to mount our API endpoints
const router = express.Router();

// Define our first route, which will be: GET /v1/fragments
router.get('/fragments', require('./get'));
// Use a raw body parser for POST which will give a Buffer or {}
router.post('/fragments', rawBody(), require('./post'));
router.get('/fragments/:id', require('./get-id'));

module.exports = router;
