// src/model/data/index.js

// Decide which data backend to use based on environment
// If we have AWS S3 configured, use AWS backend, otherwise use memory
if (process.env.AWS_S3_BUCKET_NAME) {
  // Use AWS backend (S3 for data, memory for metadata)
  module.exports = require('./aws');
} else {
  // Use memory backend for both data and metadata
  module.exports = require('./memory');
}
