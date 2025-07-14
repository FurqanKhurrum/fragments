const { randomUUID } = require('crypto');
const contentType = require('content-type');
const logger = require('../logger');

const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId) {
      throw new Error('ownerId is required');
    }

    if (!type || !Fragment.isSupportedType(type)) {
      throw new Error(`unsupported fragment type: ${type}`);
    }

    if (typeof size !== 'number' || size < 0) {
      throw new Error('size must be a non-negative number');
    }

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size;

    logger.debug({ id: this.id, ownerId, type, size: this.size }, 'Fragment instance created');
  }

  static async byUser(ownerId, expand = false) {
    logger.debug({ ownerId, expand }, 'Fragment.byUser()');
    const results = await listFragments(ownerId, expand);

    if (!expand) {
      logger.debug({ ownerId, ids: results }, 'returning fragment ids');
      return results;
    }

    const fragments = results.map((data) => new Fragment(data));
    logger.debug({ ownerId, count: fragments.length }, 'returning expanded fragments');
    return fragments;
  }

  static async byId(ownerId, id) {
    logger.debug({ ownerId, id }, 'Fragment.byId()');
    const data = await readFragment(ownerId, id);
    if (!data) {
      throw new Error('Fragment not found');
    }

    return new Fragment(data);
  }

  static async delete(ownerId, id) {
    logger.debug({ ownerId, id }, 'Fragment.delete()');
    await deleteFragment(ownerId, id);
    logger.info({ id, ownerId }, 'fragment deleted');
  }

  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
    logger.info({ id: this.id }, 'fragment metadata saved');
    logger.debug({ id: this.id }, 'fragment saved');
  }

  async getData() {
    logger.debug({ id: this.id }, 'get fragment data');
    const data = await readFragmentData(this.ownerId, this.id);
    logger.info({ id: this.id, size: data ? data.length : 0 }, 'fragment data retrieved');
    return data;
  }

  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('data must be a Buffer');
    }

    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragmentData(this.ownerId, this.id, data);
    await writeFragment(this);
    logger.info({ id: this.id }, 'fragment data saved');
    logger.debug({ id: this.id, size: this.size }, 'fragment data updated');
  }

  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  get isText() {
    return this.mimeType.startsWith('text/');
  }

  get formats() {
    switch (this.mimeType) {
      case 'text/plain':
        return ['text/plain'];
      case 'text/markdown':
        return ['text/markdown', 'text/html']; // Fixed: removed text/plain
      case 'text/html':
        return ['text/html', 'text/plain'];
      case 'application/json':
        return ['application/json', 'text/plain'];
      default:
        return [this.mimeType];
    }
  }

  static isSupportedType(value) {
    try {
      const { type } = contentType.parse(value);
      return (
        type === 'text/plain' ||
        type === 'text/markdown' ||
        type === 'text/html' ||
        type === 'application/json' // Added support for application/json
      );
    } catch {
      return false;
    }
  }

  async getConvertedData(targetType) {
    const data = await this.getData();
    const currentType = this.mimeType;

    if (!targetType || targetType === this.type || targetType === currentType) {
      return data;
    }

    if (!this.formats.includes(targetType)) {
      throw new Error('Unsupported conversion');
    }

    const str = data.toString();

    // Convert Markdown to HTML
    if (currentType === 'text/markdown' && targetType === 'text/html') {
      const { marked } = require('marked');
      const html = marked.parse(str);
      return Buffer.from(html);
    }

    // Converting to text/plain just returns the string representation
    if (targetType === 'text/plain') {
      return Buffer.from(str);
    }

    // For other conversions, return original data
    return data;
  }
}

module.exports.Fragment = Fragment;
