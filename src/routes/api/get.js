// src/routes/api/get.js

/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  // For now, return an empty array
  res.status(200).json({
    status: 'ok',
    fragments: [],
  });
};
