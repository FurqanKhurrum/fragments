// src/routes/index.js

const express = require('express');
//const { author, version } = require('../../package.json');
const { authenticate } = require('../auth');

const router = express.Router();

router.use(`/v1`, authenticate(), require('./api'));

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
