// src/auth/index.js

// Determine which auth strategy to use
const usingCognito = process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID;
const usingBasicAuth = process.env.HTPASSWD_FILE;

let strategyModule;

if (usingCognito && usingBasicAuth) {
  throw new Error('❌ Config error: both Cognito and Basic Auth are set. Only one allowed.');
}

if (usingCognito) {
  console.log('✅ Using AWS Cognito for authentication');
  strategyModule = require('./cognito');
} else if (usingBasicAuth) {
  console.log('✅ Using HTTP Basic Auth for authentication');
  strategyModule = require('./basic-auth');
} else {
  throw new Error('❌ Missing required authentication configuration');
}

// ✅ Export BOTH strategy and authenticate
module.exports = {
  strategy: strategyModule.strategy,
  authenticate: strategyModule.authenticate,
};
