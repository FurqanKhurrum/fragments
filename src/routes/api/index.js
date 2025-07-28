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
        const { type } = contentType.parse(req.get('Content-Type'));
        const supported = Fragment.isSupportedType(type);
        logger.debug({ type, supported }, 'rawBody parser type check');
        return supported;
      } catch (err) {
        logger.warn({ err }, 'rawBody parser could not parse content type');
        return false; 
      }
    },
});

// Create a router on which to mount our API endpoints
const router = express.Router();

// GET /v1/fragments
router.get('/fragments', async (req, res) => {
  try {
    logger.debug({ user: req.user }, 'Getting fragments for user');
    
    const expand = req.query.expand === '1';
    const fragments = await Fragment.byUser(req.user, expand);
    
    logger.info({ user: req.user, count: fragments.length }, 'Found fragments');
    
    res.status(200).json({
      status: 'ok',
      fragments: fragments
    });
  } catch (err) {
    logger.error({ err, user: req.user }, 'Error getting fragments');
    res.status(500).json({
      status: 'error',
      error: {
        message: 'Unable to get fragments',
        code: 500,
      },
    });
  }
});

// POST /v1/fragments
router.post('/fragments', rawBody(), async (req, res) => {
  try {
    const contentTypeHeader = req.get('Content-Type');
    
    if (!Fragment.isSupportedType(contentTypeHeader)) {
      return res.status(415).json({
        status: 'error',
        error: {
          message: 'Unsupported Content-Type',
          code: 415,
        },
      });
    }

    const fragment = new Fragment({
      ownerId: req.user,
      type: contentTypeHeader,
    });

    await fragment.setData(req.body);
    
    // Build the Location header URL
    let baseUrl;
    if (process.env.API_URL) {
      baseUrl = process.env.API_URL;
    } else {
      // Use the request's Host header
      const host = req.get('Host');
      baseUrl = `http://${host}`;
    }
    
    const location = `${baseUrl}/v1/fragments/${fragment.id}`;
    res.setHeader('Location', location);
    
    logger.info({ user: req.user, id: fragment.id }, 'Fragment created successfully');
    
    res.status(201).json({
      status: 'ok',
      fragment: {
        id: fragment.id,
        ownerId: fragment.ownerId,
        created: fragment.created,
        updated: fragment.updated,
        type: fragment.type,
        size: fragment.size
      }
    });
    
  } catch (err) {
    logger.error({ err, user: req.user }, 'Error creating fragment');
    res.status(500).json({
      status: 'error',
      error: {
        message: 'Unable to create fragment',
        code: 500,
      },
    });
  }
});

// GET /v1/fragments/:id/info
router.get('/fragments/:id/info', async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug({ user: req.user, id }, 'Getting fragment info');

    const fragment = await Fragment.byId(req.user, id);
    
    logger.info({ user: req.user, id }, 'Fragment info retrieved successfully');
    
    res.status(200).json({
      status: 'ok',
      fragment: {
        id: fragment.id,
        ownerId: fragment.ownerId,
        created: fragment.created,
        updated: fragment.updated,
        type: fragment.type,
        size: fragment.size
      }
    });
    
  } catch (err) {
    logger.error({ err, user: req.user, id: req.params.id }, 'Error getting fragment info');
    
    if (err.message === 'Fragment not found') {
      return res.status(404).json({
        status: 'error',
        error: {
          message: 'Fragment not found',
          code: 404,
        },
      });
    }
    
    res.status(500).json({
      status: 'error',
      error: {
        message: 'Unable to get fragment info',
        code: 500,
      },
    });
  }
});

// GET /v1/fragments/:id.:ext (with extension for conversion)
router.get('/fragments/:id.:ext', async (req, res) => {
  try {
    const { id, ext } = req.params;
    logger.debug({ user: req.user, id, ext }, 'Getting fragment by ID with extension');

    // Map extensions to MIME types
    const extensionToMimeType = {
      'html': 'text/html',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json'
    };
    
    const targetType = extensionToMimeType[ext];
    
    if (!targetType) {
      return res.status(415).json({
        status: 'error',
        error: {
          message: 'Unsupported file extension',
          code: 415,
        },
      });
    }

    const fragment = await Fragment.byId(req.user, id);
    
    // Check if conversion is supported
    if (!fragment.formats.includes(targetType)) {
      logger.warn({ user: req.user, id, targetType }, 'Unsupported conversion');
      return res.status(415).json({
        status: 'error',
        error: {
          message: 'Unsupported conversion',
          code: 415,
        },
      });
    }
    
    // Get converted data
    const data = await fragment.getConvertedData(targetType);
    res.setHeader('Content-Type', targetType);
    res.status(200).send(data);
    
    logger.info({ user: req.user, id }, 'Fragment retrieved and converted successfully');
    
  } catch (err) {
    logger.error({ err, user: req.user, id: req.params.id }, 'Error getting fragment with conversion');
    
    if (err.message === 'Fragment not found') {
      return res.status(404).json({
        status: 'error',
        error: {
          message: 'Fragment not found',
          code: 404,
        },
      });
    }
    
    res.status(500).json({
      status: 'error',
      error: {
        message: 'Unable to get fragment',
        code: 500,
      },
    });
  }
});

// GET /v1/fragments/:id (without extension)
router.get('/fragments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug({ user: req.user, id }, 'Getting fragment by ID');

    const fragment = await Fragment.byId(req.user, id);
    
    // Return original fragment data
    const data = await fragment.getData();
    res.setHeader('Content-Type', fragment.type);
    res.status(200).send(data);
    
    logger.info({ user: req.user, id }, 'Fragment retrieved successfully');
    
  } catch (err) {
    logger.error({ err, user: req.user, id: req.params.id }, 'Error getting fragment');
    
    if (err.message === 'Fragment not found') {
      return res.status(404).json({
        status: 'error',
        error: {
          message: 'Fragment not found',
          code: 404,
        },
      });
    }
    
    res.status(500).json({
      status: 'error',
      error: {
        message: 'Unable to get fragment',
        code: 500,
      },
    });
  }
});

// DELETE /v1/fragments/:id
router.delete('/fragments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug({ user: req.user, id }, 'Deleting fragment');

    // Verify the fragment exists and belongs to the user before deleting
    await Fragment.byId(req.user, id);
    
    // Delete the fragment using the static method
    await Fragment.delete(req.user, id);
    
    logger.info({ user: req.user, id }, 'Fragment deleted successfully');
    
    // Return 200 status as expected by the test
    res.status(200).json({
      status: 'ok'
    });
    
  } catch (err) {
    logger.error({ err, user: req.user, id: req.params.id }, 'Error deleting fragment');
    
    if (err.message === 'Fragment not found') {
      return res.status(404).json({
        status: 'error',
        error: {
          message: 'Fragment not found',
          code: 404,
        },
      });
    }
    
    res.status(500).json({
      status: 'error',
      error: {
        message: 'Unable to delete fragment',
        code: 500,
      },
    });
  }
});

module.exports = router;
