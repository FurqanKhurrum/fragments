// jest.config.js

const path = require('path');

// get full path to our env.jest file
const envFile = path.join(__dirname, 'env.jest');

// read env variables for Jest from our env.jest file
require('dotenv').config({ path: envFile });

// log a message to remind developers how to see more details from log messages
console.log(`Using LOG_LEVEL=${process.env.LOG_LEVEL}. Use 'debug' in env.jest for more detail`);

// set our Jest options, see https://jestjs.io/docs/configuration
module.exports = {
  verbose: true,
  testTimeout: 11020,
};
