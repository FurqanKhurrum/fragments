// src/routes/api/get-id.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    logger.debug({ id: req.params.id, user: req.user }, 'fetching fragment');
    const fragment = await Fragment.byId(req.user, req.params.id);
    const data = await fragment.getData();

    logger.info({ id: fragment.id }, 'fragment retrieved');
    logger.debug({ size: fragment.size, type: fragment.type }, 'fragment metadata');

    res.setHeader('Content-Type', fragment.type);
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
