// src/routes/api/post.js

const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');

// Post /v1/fragments
module.exports.postFragment = async (req, res) => {
  const ownerId = req.user;
  const type = req.get('Content-Type');
  const body = req.body;

  logger.info({ ownerId, type }, `Calling POST ${req.originalUrl}`);

  try {
    const fragment = new Fragment({ ownerId: ownerId, type: type });
    await fragment.setData(body);
    await fragment.save();

    const baseUrl = process.env.API_URL || `${req.protocol || 'http'}://${req.get('host')}`;
    res.set('Location', `${baseUrl}/v1/fragments/${fragment.id}`);
    res.set('Access-Control-Expose-Headers', 'Location');

    const successResponse = createSuccessResponse({ fragment: fragment });
    logger.debug({ successResponse }, 'A new fragment has been created');

    res.status(201).json(successResponse);
  } catch (err) {
    const errorResponse = createErrorResponse(415, 'Unsupported content type');
    logger.warn({ errorResponse, error: err.message}, 'Failed to create a new fragment');
    res.status(415).json(errorResponse);
  }
};
