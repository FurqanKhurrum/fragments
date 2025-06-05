// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');

module.exports = async (req, res) => {
  const fragments = await Fragment.byUser(req.user, false);
  res.status(200).json({
    status: 'ok',
    fragments,
  });
};
