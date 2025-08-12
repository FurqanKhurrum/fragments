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
console.log('Registered routes in API router:');
router.stack.forEach(layer => {
  if (layer.route) {
    console.log(`  ${Object.keys(layer.route.methods).join(', ').toUpperCase()}: ${layer.route.path}`);
  }
});

module.exports = router;
// GET /v1/fragments
router.get('/fragments', async (req, res) => {
  try {
    logger.debug({ user: req.user }, 'Getting fragments for user');

    const expand = req.query.expand === '1';
    const fragments = await Fragment.byUser(req.user, expand);

    logger.info({ user: req.user, count: fragments.length }, 'Found fragments');

    res.status(200).json({
      status: 'ok',
      fragments: fragments,
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
        size: fragment.size,
      },
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

// GET /v1/fragments/:id/info - MUST come before :id route
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
        size: fragment.size,
      },
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

// GET /v1/fragments/:id - This handles BOTH regular GET and conversions with extensions
router.get('/fragments/:id', async (req, res) => {
  try {
    const idWithExt = req.params.id;
    logger.debug({ user: req.user, idWithExt }, 'Getting fragment');

    // Check if there's an extension
    const lastDotIndex = idWithExt.lastIndexOf('.');
    let id, ext;

    if (lastDotIndex !== -1 && lastDotIndex < idWithExt.length - 1) {
      // There's an extension
      id = idWithExt.substring(0, lastDotIndex);
      ext = idWithExt.substring(lastDotIndex + 1);
      logger.debug({ id, ext }, 'Extension detected');
    } else {
      // No extension
      id = idWithExt;
      ext = null;
    }

    // Get the fragment
    const fragment = await Fragment.byId(req.user, id);

    if (ext) {
      // Map extensions to MIME types
      const extensionToMimeType = {
        // Text formats
        txt: 'text/plain',
        md: 'text/markdown',
        html: 'text/html',
        json: 'application/json',

        // Image formats
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        webp: 'image/webp',
        gif: 'image/gif',
        avif: 'image/avif',
      };

      const targetType = extensionToMimeType[ext.toLowerCase()];

      if (!targetType) {
        logger.warn({ ext }, 'Unsupported extension');
        return res.status(415).json({
          status: 'error',
          error: {
            message: `Unsupported file extension: .${ext}`,
            code: 415,
          },
        });
      }

      // Check if conversion is supported
      if (!fragment.formats.includes(targetType)) {
        logger.warn(
          {
            sourceType: fragment.type,
            targetType,
            supportedFormats: fragment.formats,
          },
          'Unsupported conversion'
        );

        return res.status(415).json({
          status: 'error',
          error: {
            message: `Cannot convert ${fragment.type} to ${targetType}`,
            code: 415,
          },
        });
      }

      // Get converted data
      const data = await fragment.getConvertedData(targetType);
      res.setHeader('Content-Type', targetType);
      res.status(200).send(data);

      logger.info(
        {
          id,
          sourceType: fragment.type,
          targetType,
        },
        'Fragment converted and retrieved'
      );
    } else {
      // No conversion, return original
      const data = await fragment.getData();
      res.setHeader('Content-Type', fragment.type);
      res.status(200).send(data);

      logger.info({ id }, 'Fragment retrieved');
    }
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
      status: 'ok',
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

// PUT /v1/fragments/:id - Update an existing fragment's data
router.put('/fragments/:id', async (req, res) => {
  console.log('PUT ROUTE HIT - NOT 501!');
  try {
    const { id } = req.params;
    const contentTypeHeader = req.get('Content-Type');

    logger.debug(
      {
        user: req.user,
        id,
        contentType: contentTypeHeader,
        bodyLength: req.body ? req.body.length : 0,
        hasBody: Buffer.isBuffer(req.body),
      },
      'PUT /fragments/:id'
    );

    // Check if body is a Buffer
    if (!Buffer.isBuffer(req.body)) {
      logger.warn({ bodyType: typeof req.body }, 'Request body is not a Buffer');
      return res.status(415).json({
        status: 'error',
        error: {
          message: 'Unsupported Content-Type',
          code: 415,
        },
      });
    }

    // Get the existing fragment
    const fragment = await Fragment.byId(req.user, id);

    logger.debug(
      {
        existingType: fragment.type,
        requestedType: contentTypeHeader,
      },
      'Checking type compatibility'
    );

    // Check if the Content-Type matches the existing fragment's type
    // We don't allow changing the type of a fragment
    if (fragment.type !== contentTypeHeader) {
      logger.warn(
        {
          existingType: fragment.type,
          requestedType: contentTypeHeader,
        },
        'Cannot change fragment type'
      );

      return res.status(400).json({
        status: 'error',
        error: {
          message: `Fragment type cannot be changed from ${fragment.type} to ${contentTypeHeader}`,
          code: 400,
        },
      });
    }

    // Update the fragment's data
    await fragment.setData(req.body);

    logger.info(
      {
        user: req.user,
        id,
        size: req.body.length,
      },
      'Fragment updated successfully'
    );

    res.status(200).json({
      status: 'ok',
      fragment: {
        id: fragment.id,
        ownerId: fragment.ownerId,
        created: fragment.created,
        updated: fragment.updated,
        type: fragment.type,
        size: fragment.size,
      },
    });
  } catch (err) {
    logger.error(
      {
        err: err.message,
        user: req.user,
        id: req.params.id,
      },
      'Error updating fragment'
    );

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
        message: 'Unable to update fragment',
        code: 500,
      },
    });
  }
});

module.exports = router;
