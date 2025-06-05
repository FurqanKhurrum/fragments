const { randomUUID } = require('crypto');
const contentType = require('content-type');

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
  }

  static async byUser(ownerId, expand = false) {
    const ids = await listFragments(ownerId);
    if (!expand) return ids;

    const fragments = await Promise.all(ids.map((id) => Fragment.byId(ownerId, id)));
    return fragments;
  }

  static async byId(ownerId, id) {
    const data = await readFragment(ownerId, id);
    if (!data) {
      throw new Error('Fragment not found');
    }

    return new Fragment(data);
  }

  static async delete(ownerId, id) {
    return deleteFragment(ownerId, id);
  }

  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  async getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('data must be a Buffer');
    }

    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragmentData(this.ownerId, this.id, data);
    await writeFragment(this);
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
