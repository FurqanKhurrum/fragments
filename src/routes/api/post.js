const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.debug({ headers: req.headers }, 'handling POST /v1/fragments');
  let type;
  try {
    ({ type } = contentType.parse(req));
  } catch (err) {
    logger.warn({ err }, 'unable to parse Content-Type header');
    return res.status(415).json({ status: 'error', message: 'Unsupported content type' });
  }

  if (!Fragment.isSupportedType(type)) {
    logger.warn({ type }, 'unsupported fragment type');
    return res.status(415).json({ status: 'error', message: 'Unsupported content type' });
  }

  // Check if body is a Buffer - for application/json, it should be
  if (!Buffer.isBuffer(req.body)) {
    logger.warn({ bodyType: typeof req.body }, 'request body is not a Buffer');
    return res.status(415).json({ status: 'error', message: 'Unsupported content type' });
  }

  try {
    const fragment = new Fragment({
      ownerId: req.user,
      type: req.headers['content-type'],
      size: req.body.length,
    });

    await fragment.save();
    await fragment.setData(req.body);
    logger.info({ fragmentId: fragment.id }, 'fragment created');

    const baseUrl = process.env.API_URL || `http://${req.headers.host}`;
    const location = new URL(`/v1/fragments/${fragment.id}`, baseUrl).toString();
    logger.debug({ location }, 'Location header set');
    res.setHeader('Location', location);
    res.status(201).json({ status: 'ok', fragment });
  } catch (err) {
    logger.error({ err }, 'POST /v1/fragments failed');
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
