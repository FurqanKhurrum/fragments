// jest.config.js

// Get the full path to our env.jest file
const path = require('path');
const envFile = path.join(__dirname, 'env.jest');
//process.env.AWS_S3_BUCKET_NAME = undefined;
// // Read the environment variables we use for Jest from our env.jest file
// require('dotenv').config({ path: envFile });

// Read the environment variables we use for Jest from our env.jest file.
// The `override: true` option ensures that any variables already set in the
// environment (e.g. by the container) are replaced by the values from our file
// so the tests run with the expected configuration.
require('dotenv').config({ path: envFile, override: true });

// Log a message to remind developers how to see more detail from log messages
console.log(`Using LOG_LEVEL=${process.env.LOG_LEVEL}. Use 'debug' in env.jest for more detail`);

// Set our Jest options, see https://jestjs.io/docs/configuration
module.exports = {
  verbose: true,
  testTimeout: 5000,
};
