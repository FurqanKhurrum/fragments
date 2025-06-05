// src/routes/api/post.js

module.exports = async (req, res) => {
  const { Fragment } = require('../../model/fragment');
  const contentType = req.headers['content-type'];

  if (contentType !== 'text/plain') {
    return res.status(415).json({ status: 'error', message: 'Only text/plain is supported' });
  }

  const fragment = new Fragment({
    ownerId: req.user,
    type: contentType,
    size: Buffer.byteLength(req.body),
  });

  await fragment.save();
  await fragment.setData(req.body);

  res.status(201).json({ status: 'ok', fragment });
};
