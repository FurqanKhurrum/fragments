const { Fragment } = require('../../model/fragment');

module.exports = async (req, res) => {
  const contentType = req.headers['content-type'];

  if (!Fragment.isSupportedType(contentType)) {
    return res.status(415).json({ status: 'error', message: 'Unsupported content type' });
  }

  try {
    const fragment = new Fragment({
      ownerId: req.user,
      type: contentType,
      size: Buffer.byteLength(req.body),
    });

    await fragment.save();
    await fragment.setData(Buffer.from(req.body));

    res.setHeader('Location', `/v1/fragments/${fragment.id}`);
    res.status(201).json({ status: 'ok', fragment });
  } catch (err) {
    console.error('POST /v1/fragments failed:', err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
