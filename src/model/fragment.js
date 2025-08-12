// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
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
    if (ownerId == undefined) {
      throw new Error(`missing parameter: ownerId`);
    }
    if (type == undefined) {
      throw new Error(`missing parameter: type`);
    }
    if (!Fragment.isSupportedType(type)) {
      throw new Error(`unsupported fragment type: ${type}`);
    }
    if (size < 0) {
      throw new Error('invalid value: size cannot be negative');
    }
    if (typeof size != 'number') {
      throw new Error('invalid datatype: size must be a number');
    }

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.type = type;
    this.size = size;
    this.created = new Date().toISOString() || created;
    this.updated = new Date().toISOString() || updated;
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    try {
      const foundFragments = await listFragments(ownerId, expand);

      if (!foundFragments) {
        throw new Error(`no fragment with provided user was found in database`);
      }

      return Promise.resolve(foundFragments);
    } catch (err) {
      throw err.message;
    }
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    try {
      const fragment = await readFragment(ownerId, id);

      if (!fragment) {
        throw new Error(`no fragment with provided id was found in database`);
      }

      if (fragment instanceof Fragment) {
        return Promise.resolve(fragment);
      } else {
        return Promise.resolve(new Fragment(fragment));
      }
    } catch (err) {
      throw new Error(`error retrieving fragment: ${err.message}`);
    }
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static async delete(ownerId, id) {
    try {
      await deleteFragment(ownerId, id);
      return Promise.resolve();
    } catch (err) {
      throw new Error(`error deleting user fragment from database: ${err.message}`);
    }
  }

  /**
   * Saves the current fragment to the database
   * @returns Promise<void>
   */
  async save() {
    try {
      this.updated = new Date().toISOString();

      await writeFragment(this);

      return Promise.resolve();
    } catch (err) {
      throw new Error(`error saving fragment to database: ${err.message}`);
    }
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  async getData() {
    try {
      const fragmentData = await readFragmentData(this.ownerId, this.id);

      if (!fragmentData) {
        throw new Error(`no fragment data was found in database`);
      }

      return Promise.resolve(fragmentData);
    } catch (err) {
      throw new Error(`error retrieving fragment data: ${err.message}`);
    }
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    try {
      this.updated = new Date().toISOString();
      this.size = data.byteLength;

      await writeFragmentData(this.ownerId, this.id, data);

      return Promise.resolve();
    } catch (err) {
      throw new Error(`error setting fragment data in database: ${err.message}`);
    }
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    /**
        Type	            Valid Conversion Extensions
        text/plain        .txt
        text/markdown   	.md, .html, .txt
        text/html       	.html, .txt
        application/json	.json, .txt
        image/png         .png, .jpg, .webp, .gif
        image/jpeg      	.png, .jpg, .webp, .gif
        image/webp      	.png, .jpg, .webp, .gif
        image/gif       	.png, .jpg, .webp, .gif
     */

    switch (this.mimeType) {
      case 'text/plain':
        return ['text/plain'];

      case 'text/markdown':
        return ['text/markdown', 'text/html', 'text/plain'];

      case 'text/html':
        return ['text/html', 'text/plain'];

      case 'application/json':
        return ['application/json', 'text/plain'];

      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
      case 'image/gif':
        return ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

      default:
        return null;
    }
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    const validTypes = [
      'text/plain',
      'text/markdown',
      'text/html',
      'application/json',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
    ];

    const parsedType = contentType.parse(value);
    return validTypes.includes(parsedType.type);
  }
}

module.exports.Fragment = Fragment;
