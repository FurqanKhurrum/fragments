// src/routes/api/get-id.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const [id, ext] = req.params.id.split('.');
    logger.debug({ id, user: req.user, ext }, 'fetching fragment');
    
    const fragment = await Fragment.byId(req.user, id);
    
    let type = fragment.type;
    let data;

    if (ext) {
      // Map file extensions to MIME types
      const extensionToMimeType = {
        'txt': 'text/plain',
        'html': 'text/html',
        'md': 'text/markdown',
        'json': 'application/json'
      };
      
      const requested = extensionToMimeType[ext];
      logger.debug({ ext, requested }, 'format requested via extension');
      
      if (!requested || !fragment.formats.includes(requested)) {
        logger.warn({ ext, requested, availableFormats: fragment.formats }, 'unsupported conversion');
        return res.status(415).json({ status: 'error', message: 'Unsupported format' });
      }
      
      try {
        data = await fragment.getConvertedData(requested);
        type = requested;
      } catch (err) {
        logger.warn({ err }, 'conversion failed');
        return res.status(415).json({ status: 'error', message: 'Unsupported format' });
      }
    } else {
      data = await fragment.getData();
    }

    logger.info({ id: fragment.id }, 'fragment retrieved');
    logger.debug({ size: fragment.size, type: fragment.type }, 'fragment metadata');

    res.setHeader('Content-Type', type);
    res.status(200).send(data);
  } catch (err) {
    if (err.message === 'Fragment not found') {
      logger.warn({ id: req.params.id }, 'fragment not found');
      res.status(404).json({ status: 'error', message: 'Fragment not found' });
    } else {
      logger.error({ err }, 'error fetching fragment');
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  }
};
