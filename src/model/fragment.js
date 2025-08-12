// src/model/fragment.js
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
  }

  static async byUser(ownerId, expand = false) {
    const fragments = await listFragments(ownerId, expand);
    
    if (!expand || !fragments || fragments.length === 0) {
      return fragments;
    }
    
    return fragments.map((fragment) => new Fragment(fragment));
  }

  static async byId(ownerId, id) {
    const fragment = await readFragment(ownerId, id);
    
    if (!fragment) {
      throw new Error('Fragment not found');
    }
    
    return new Fragment(fragment);
  }

  static async delete(ownerId, id) {
    await deleteFragment(ownerId, id);
  }

  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  async getData() {
    const data = await readFragmentData(this.ownerId, this.id);
    logger.debug({ id: this.id, size: data ? data.length : 0 }, 'fragment data retrieved');
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
    return this.mimeType.startsWith('text/') || this.mimeType === 'application/json';
  }

  get isImage() {
    return this.mimeType.startsWith('image/');
  }

  get formats() {
    switch (this.mimeType) {
      // Text formats
      case 'text/plain':
        return ['text/plain'];
      case 'text/markdown':
        return ['text/markdown', 'text/html', 'text/plain'];
      case 'text/html':
        return ['text/html', 'text/plain'];
      case 'application/json':
        return ['application/json', 'text/plain'];
      
      // Image formats - all images can convert to all supported image types
      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
      case 'image/gif':
      case 'image/avif':
        return ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
      
      default:
        return [this.mimeType];
    }
  }

  static isSupportedType(value) {
    try {
      const { type } = contentType.parse(value);
      
      // Text formats
      const textFormats = [
        'text/plain',
        'text/markdown',
        'text/html',
        'application/json'
      ];
      
      // Image formats
      const imageFormats = [
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/gif',
        'image/avif'
      ];
      
      return textFormats.includes(type) || imageFormats.includes(type);
    } catch {
      return false;
    }
  }

  async getConvertedData(targetType) {
    const data = await this.getData();
    const currentType = this.mimeType;

    // If no conversion needed, return original data
    if (!targetType || targetType === this.type || targetType === currentType) {
      return data;
    }

    // Check if conversion is supported
    if (!this.formats.includes(targetType)) {
      throw new Error('Unsupported conversion');
    }

    // Handle text conversions
    if (this.isText) {
      return this.convertTextData(data, currentType, targetType);
    }

    // Handle image conversions
    if (this.isImage) {
      return this.convertImageData(data, currentType, targetType);
    }

    // Default: return original data
    return data;
  }

  async convertTextData(data, currentType, targetType) {
    const str = data.toString();

    // Convert Markdown to HTML
    if (currentType === 'text/markdown' && targetType === 'text/html') {
      const { marked } = require('marked');
      const html = marked.parse(str);
      return Buffer.from(html);
    }

    // Convert HTML to plain text (strip tags)
    if (currentType === 'text/html' && targetType === 'text/plain') {
      // Simple tag stripping - in production, you might want to use a library like html-to-text
      const plainText = str.replace(/<[^>]*>/g, '');
      return Buffer.from(plainText);
    }

    // Convert Markdown to plain text
    if (currentType === 'text/markdown' && targetType === 'text/plain') {
      // First convert to HTML, then strip tags
      const { marked } = require('marked');
      const html = marked.parse(str);
      const plainText = html.replace(/<[^>]*>/g, '');
      return Buffer.from(plainText);
    }

    // Converting JSON or any text to plain text
    if (targetType === 'text/plain') {
      return Buffer.from(str);
    }

    // For any other conversion, return original data
    return data;
  }

  async convertImageData(data, currentType, targetType) {
    const sharp = require('sharp');
    
    // Create sharp instance from input data
    let image = sharp(data);

    // Get image metadata to preserve quality settings
    //const metadata = await image.metadata();

    // Convert based on target type
    switch (targetType) {
      case 'image/png':
        return await image
          .png({ 
            compressionLevel: 9,
            adaptiveFiltering: true 
          })
          .toBuffer();
      
      case 'image/jpeg':
        return await image
          .jpeg({ 
            quality: 90,
            progressive: true 
          })
          .toBuffer();
      
      case 'image/webp':
        return await image
          .webp({ 
            quality: 90,
            lossless: false 
          })
          .toBuffer();
      
      case 'image/gif':
        // Note: Sharp has limited GIF support, mainly for output
        // For animated GIFs, this will only get the first frame
        return await image
          .gif({
            dither: 0
          })
          .toBuffer();
      
      case 'image/avif':
        return await image
          .avif({ 
            quality: 80,
            lossless: false 
          })
          .toBuffer();
      
      default:
        throw new Error(`Unsupported image conversion to ${targetType}`);
    }
  }
}

module.exports.Fragment = Fragment;
