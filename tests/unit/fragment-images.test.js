// test-fragment-support.js
// Run this with: node test-fragment-support.js

const { Fragment } = require('./src/model/fragment');

console.log('Testing Fragment type support...\n');

// Test text types
const textTypes = [
  'text/plain',
  'text/markdown',
  'text/html',
  'application/json'
];

console.log('Text types:');
textTypes.forEach(type => {
  console.log(`  ${type}: ${Fragment.isSupportedType(type) ? '✓' : '✗'}`);
});

// Test image types
const imageTypes = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif'
];

console.log('\nImage types:');
imageTypes.forEach(type => {
  console.log(`  ${type}: ${Fragment.isSupportedType(type) ? '✓' : '✗'}`);
});

// Test unsupported types
const unsupportedTypes = [
  'image/bmp',
  'application/pdf',
  'video/mp4'
];

console.log('\nUnsupported types (should all be ✗):');
unsupportedTypes.forEach(type => {
  console.log(`  ${type}: ${Fragment.isSupportedType(type) ? '✓' : '✗'}`);
});

// Test creating fragments
console.log('\nTesting fragment creation:');
try {
  const pngFragment = new Fragment({
    ownerId: 'test-user',
    type: 'image/png',
    size: 100
  });
  console.log('  PNG fragment created: ✓');
  console.log('  isImage:', pngFragment.isImage);
  console.log('  formats:', pngFragment.formats);
} catch (err) {
  console.log('  PNG fragment creation failed: ✗');
  console.log('  Error:', err.message);
}

console.log('\nIf all image types show ✓, then Fragment class is properly updated.');
console.log('If they show ✗, the fragment.js file hasn\'t been updated correctly.');
