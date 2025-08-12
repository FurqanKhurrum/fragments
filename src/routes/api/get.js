// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');
const md = require('markdown-it')();
const { htmlToText } = require('html-to-text');
const sharp = require('sharp');

// Get a list of fragments for the current user
module.exports.listUserFragments = async (req, res, next) => {
  const ownerId = req.user;
  const expand = req.query.expand == 1 ? true : false;

  logger.info({ ownerId, expand }, `Calling GET ${req.originalUrl}`);

  try {
    const fragments = await Fragment.byUser(ownerId, expand);

    if (fragments.length == 0) {
      logger.debug({ fragments }, 'User has no fragments');
    } else {
      logger.debug({ fragments }, 'User fragments have been retrieved');
    }

    const successResponse = createSuccessResponse({ fragments: fragments });
    res.status(200).json(successResponse);
  } catch (err) {
    logger.warn({ err }, "Failed to retrieve user's fragments");
    next(err);
  }
};

// Get fragment data by Id
module.exports.getFragmentDataById = async (req, res) => {
  const ownerId = req.user;
  const [id, extension] = req.params.id.split('.');

  logger.info({ id, ownerId, extension }, `Calling GET ${req.originalUrl}`);

  try {
    const fragment = await Fragment.byId(ownerId, id);
    logger.debug({ fragment }, 'Fragment was found');

    const data = await fragment.getData();
    logger.debug('Fragment data has been retrieved');

    // if extension was included, attempt to convert data and then return it
    if (extension) {
      const extensionType = getExtensionContentType(extension);
      logger.info({ from: fragment.mimeType, to: extensionType }, 'Converting fragment');

      if (fragment.formats.includes(extensionType)) {
        const convertedData = await convertData(data, fragment.mimeType, extension);

        res.setHeader('Content-Type', extensionType);
        res.status(200).send(convertedData);
      } else {
        const message = `a ${fragment.mimeType} fragment cannot be return as a ${extension}`;
        const errorResponse = createErrorResponse(415, message);

        logger.error({ errorResponse }, 'Invalid operation');
        res.status(415).json(errorResponse);
      }
    }
    // otherwise return raw fragment data with its type
    else {
      res.setHeader('Content-Type', fragment.type);
      res.status(200).send(data);
    }
  } catch (err) {
    const errorResponse = createErrorResponse(404, err.message);
    logger.warn({ id, errorResponse }, 'Failed to retrieve fragment');
    res.status(404).json(err.message);
  }
};

module.exports.getFragmentInfoById = async (req, res) => {
  const id = req.params.id;
  const ownerId = req.user;

  logger.info({ id, ownerId }, `Calling GET ${req.originalUrl}`);

  try {
    const fragment = await Fragment.byId(ownerId, id);
    logger.info({ fragment }, 'Fragment was found');

    const successResponse = createSuccessResponse({ fragment: fragment });
    res.status(200).json(successResponse);
  } catch (err) {
    const errorResponse = createErrorResponse(404, err.message);

    logger.error({ errorResponse }, 'Failed to retrieve requested fragment');
    res.status(404).json(errorResponse);
  }
};

// get extension respective content-type
const getExtensionContentType = (extension) => {
  switch (extension) {
    case 'txt':
      return 'text/plain';
    case 'md':
      return 'text/markdown';
    case 'html':
      return 'text/html';
    case 'json':
      return 'application/json';
    case 'png':
      return 'image/png';
    case 'jpg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return null;
  }
};

// convert data
const convertData = async (data, from, to) => {
  let convertedData = data;

  switch (from) {
    case 'text/markdown':
      if (to == 'txt') {
        convertedData = md.render(data.toString());
        convertedData = htmlToText(convertedData.toString(), { wordwrap: 150 });
      }
      if (to == 'html') {
        convertedData = md.render(data.toString());
      }
      break;

    case 'text/html':
      if (to == 'txt') {
        convertedData = htmlToText(data.toString(), { wordwrap: 130 });
      }
      break;

    case 'application/json':
      if (to == 'txt') {
        convertedData = JSON.parse(data.toString());
      }
      break;

    case 'image/png':
      if (to == 'jpg') {
        convertedData = await sharp(data).jpeg().toBuffer();
      }
      if (to == 'webp') {
        convertedData = await sharp(data).webp().toBuffer();
      }
      if (to == 'gif') {
        convertedData = await sharp(data).gif().toBuffer();
      }
      break;

    case 'image/jpeg':
      if (to == 'png') {
        convertedData = await sharp(data).png().toBuffer();
      }
      if (to == 'webp') {
        convertedData = await sharp(data).webp().toBuffer();
      }
      if (to == 'gif') {
        convertedData = await sharp(data).gif().toBuffer();
      }
      break;

    case 'image/webp':
      if (to == 'png') {
        convertedData = await sharp(data).png().toBuffer();
      }
      if (to == 'jpg') {
        convertedData = await sharp(data).jpeg().toBuffer();
      }
      if (to == 'gif') {
        convertedData = await sharp(data).gif().toBuffer();
      }
      break;

    case 'image/gif':
      if (to == 'png') {
        convertedData = await sharp(data).png().toBuffer();
      }
      if (to == 'jpg') {
        convertedData = await sharp(data).jpeg().toBuffer();
      }
      if (to == 'webp') {
        convertedData = await sharp(data).webp().toBuffer();
      }
      break;
  }

  logger.debug(`Fragment data was successfully converted from ${from} to ${to}`);
  return Promise.resolve(convertedData);
};
