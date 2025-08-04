// src/model/data/index.js

const logger = require('../../logger');

// Use AWS backend if S3 bucket name is configured
// (AWS credentials not required when using IAM roles in ECS)
if (process.env.AWS_S3_BUCKET_NAME) {
  logger.info(`Using AWS backend with S3 bucket: ${process.env.AWS_S3_BUCKET_NAME}`);
  module.exports = require('./aws');
} else {
  logger.info('Using memory backend');
  module.exports = require('./memory');
}
