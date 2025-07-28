// src/model/data/aws/index.js

// Still using memory-db for metadata until we implement DynamoDB
const MemoryDB = require('../memory/memory-db');

// S3 client and commands
const s3Client = require('./s3Client');
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

// Add logger import
const logger = require('../../../logger');

// Create two in-memory databases: one for fragment metadata and the other for raw data
const data = new MemoryDB();
const metadata = new MemoryDB();

// Helper function to convert a stream to a buffer
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

// Write a fragment's metadata to memory db. Returns a Promise<void>
function writeFragment(fragment) {
  // Simulate db/network serialization of the value, storing only JSON representation.
  // This is important because it's how things will work later with AWS data stores.
  const serialized = JSON.stringify(fragment);
  return metadata.put(fragment.ownerId, fragment.id, serialized);
}

// Read a fragment's metadata from memory db. Returns a Promise<Object>
async function readFragment(ownerId, id) {
  // NOTE: this data will be raw JSON, we need to turn it back into an Object.
  // You'll need to take care of converting this back into a Fragment instance
  // higher up in the callstack.
  const serialized = await metadata.get(ownerId, id);
  return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
}

// Write a fragment's data to S3. Returns a Promise
async function writeFragmentData(ownerId, id, data) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
    Body: data,
  };

  const command = new PutObjectCommand(params);

  try {
    await s3Client.send(command);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }
}

// Read a fragment's data from S3. Returns a Promise<Buffer>
async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  const command = new GetObjectCommand(params);

  try {
    const data = await s3Client.send(command);
    return streamToBuffer(data.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error reading fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

// Get a list of fragment ids/objects for the given user from memory db. Returns a Promise
async function listFragments(ownerId, expand = false) {
  const fragments = await metadata.query(ownerId);
  
  // If we don't get anything back, return empty array
  if (!fragments || fragments.length === 0) {
    return [];
  }

  const parsedFragments = fragments.map((fragment) => JSON.parse(fragment));

  // If we are supposed to give expanded fragments, return full objects
  if (expand) {
    return parsedFragments;
  }

  // Otherwise, map to only send back the ids
  return parsedFragments.map((fragment) => fragment.id);
}

// Delete a fragment's metadata and data. Returns a Promise
async function deleteFragment(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  const command = new DeleteObjectCommand(params);

  return Promise.all([
    // Delete metadata from memory db
    metadata.del(ownerId, id),
    // Delete data from S3
    s3Client.send(command).catch((err) => {
      const { Bucket, Key } = params;
      logger.error({ err, Bucket, Key }, 'Error deleting fragment data from S3');
      throw new Error('unable to delete fragment data');
    })
  ]);
}

// Export all functions
module.exports = {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
};
