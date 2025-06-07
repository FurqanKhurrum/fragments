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
    const ids = await listFragments(ownerId);
    
    if (!expand) {
      logger.debug({ ownerId, ids }, 'returning fragment ids');
      return ids;
  }

  const fragments = await Promise.all(ids.map((id) => Fragment.byId(ownerId, id)));
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
    //return deleteFragment(ownerId, id);
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
    //return readFragmentData(this.ownerId, this.id);
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
    return ['text/plain'];
  }

  static isSupportedType(value) {
    try {
      const { type } = contentType.parse(value);
      return type === 'text/plain';
    } catch (e) {
      return false;
    }
  }
}

module.exports.Fragment = Fragment;
