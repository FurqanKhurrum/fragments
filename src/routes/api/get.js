// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    logger.debug({ user: req.user }, 'listing fragments');
    const fragments = await Fragment.byUser(req.user, false);
    logger.info({ user: req.user, count: fragments.length }, 'fragments retrieved');
    res.status(200).json({
      status: 'ok',
      fragments,
    });
  } catch (err) {
    logger.error({ err }, 'error listing fragments');
    res.status(500).json({ status: 'error', message: 'Unable to fetch fragments' });
  }
};
