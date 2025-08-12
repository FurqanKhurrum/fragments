// src/routes/api/put.js

const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');

// Post /fragments
module.exports.deleteFragment = async (req, res) => {
  const fragmentId = req.params.id;
  const ownerId = req.user;

  logger.info({ fragmentId, ownerId }, `Calling DELETE ${req.originalUrl}`);

  // delete the fragment
  try {
    await Fragment.delete(ownerId, fragmentId);

    logger.info(`Fragment was deleted`);

    const successResponse = createSuccessResponse({});
    return res.status(200).json(successResponse);
  } catch (err) {
    const errorResponse = createErrorResponse(404, err.message);
    logger.error({ errorResponse }, 'Failed to delete the fragment');

    return res.status(404).json(errorResponse);
  }
};
