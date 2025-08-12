// run-integration-tests.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get all .hurl files in the integration tests directory
const testDir = path.join(__dirname, 'tests', 'integration');
const hurlFiles = fs.readdirSync(testDir)
  .filter(file => file.endsWith('.hurl'))
  .map(file => path.join('tests', 'integration', file));

if (hurlFiles.length === 0) {
  console.error('No .hurl files found in tests/integration/');
  process.exit(1);
}

console.log(`Found ${hurlFiles.length} test files:`);
hurlFiles.forEach(file => console.log(`  - ${file}`));

// Set environment variables directly for Node process
const env = {
  ...process.env,
  PORT: '3000',
  LOG_LEVEL: 'debug',
  HTPASSWD_FILE: 'tests/.htpasswd',
  API_URL: 'http://localhost:3000'
};

// Build the command - just use hurl directly
const command = `hurl --test ${hurlFiles.join(' ')}`;

console.log('\nRunning tests...\n');
console.log('Make sure your server is running on port 3000!\n');

try {
  execSync(command, { 
    stdio: 'inherit',
    env: env 
  });
  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('\n❌ Some tests failed');
  process.exit(1);
}
