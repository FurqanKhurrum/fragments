// src/routes/index.js

const express = require('express');
const { version, author } = require('../../package.json');
const { authenticate } = require('../auth');

// Create a router that we can use to mount our API
const router = express.Router();

// Define a simple health check route
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json({
    status: 'ok',
    author,
    githubUrl: 'https://github.com/fkhurrum/fragments',
    version,
  });
});

// Other API routes will go here later...
router.use('/v1', authenticate(), require('./api'));

module.exports = router;
