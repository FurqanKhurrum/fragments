// src/routes/api/get-id.js

const { Fragment } = require('../../model/fragment');

module.exports = async (req, res) => {
  try {
    const fragment = await Fragment.byId(req.user, req.params.id);
    const data = await fragment.getData();

    res.setHeader('Content-Type', fragment.type);
    res.status(200).send(data);
  } catch (err) {
    console.error(err); // or use logger.error(err)
    res.status(404).json({ status: 'error', message: 'Fragment not found' });
  }
};
