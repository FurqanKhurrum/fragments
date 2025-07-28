// src/model/data/index.js

// Use AWS backend only if all required AWS environment variables are properly set
const hasAWSConfig = process.env.AWS_S3_BUCKET_NAME && 
process.env.AWS_ACCESS_KEY_ID && 
process.env.AWS_SECRET_ACCESS_KEY && 
process.env.AWS_REGION;

if (hasAWSConfig) {
  console.log(`Using AWS backend with S3 bucket: ${process.env.AWS_S3_BUCKET_NAME}`);
  module.exports = require('./aws');
} else {
  console.log('Using memory backend');
  module.exports = require('./memory');
}
