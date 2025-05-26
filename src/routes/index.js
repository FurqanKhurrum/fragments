// src/routes/index.js

const express = require('express');
const { author, version } = require('../../package.json');
const { authenticate } = require('../auth');

const router = express.Router();

// Protect all /v1 routes with authentication
router.use('/v1', authenticate(), require('./api'));

router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');

  res.status(200).json({
    status: 'ok',
    author,
    githubUrl: 'https://github.com/FurqanKhurrum/fragments',
    version,
  });
});


module.exports = router;

// src/routes/index.js

/**
 * Expose all of our API routes on /v1/* to include an API version.
 * Protect them all so you have to be authenticated in order to access.
 */
//router.use(`/v1`, authenticate(), require('./api'));
