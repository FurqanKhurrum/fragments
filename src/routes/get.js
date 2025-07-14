// src/routes/get.js

const { Fragment } = require('../models/fragment');
const logger = require('../logger');

// GET /v1/fragments
module.exports.getFragments = async (req, res) => {
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
};

// GET /v1/fragments/:id
module.exports.getFragmentById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug({ user: req.user, id }, 'Getting fragment by ID');

    // Check if there's a file extension in the ID
    let fragmentId = id;
    let targetType = null;
    
    // Handle conversions (e.g., id.html, id.txt)
    const extensionMatch = id.match(/^(.+)\.([a-zA-Z0-9]+)$/);
    if (extensionMatch) {
      fragmentId = extensionMatch[1];
      const extension = extensionMatch[2];
      
      // Map extensions to MIME types
      const extensionToMimeType = {
        'html': 'text/html',
        'txt': 'text/plain',
        'md': 'text/markdown',
        'json': 'application/json'
      };
      
      targetType = extensionToMimeType[extension];
    }

    const fragment = await Fragment.byId(req.user, fragmentId);
    
    if (targetType) {
      // Check if conversion is supported
      if (!fragment.formats.includes(targetType)) {
        logger.warn({ user: req.user, id: fragmentId, targetType }, 'Unsupported conversion');
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
    } else {
      // Return original fragment data
      const data = await fragment.getData();
      res.setHeader('Content-Type', fragment.type);
      res.status(200).send(data);
    }
    
    logger.info({ user: req.user, id: fragmentId }, 'Fragment retrieved successfully');
    
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
};

// GET /v1/fragments/:id/info
module.exports.getFragmentInfo = async (req, res) => {
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
};
