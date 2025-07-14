const { Fragment } = require('../../src/model/fragment');

// Wait for a certain number of ms (default 50).
const wait = async (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

const validTypes = ['text/plain', 'text/markdown', 'text/html', 'application/json'];

describe('Fragment class', () => {
  test('common formats are supported', () => {
    validTypes.forEach((format) => expect(Fragment.isSupportedType(format)).toBe(true));
  });

  describe('Fragment()', () => {
    test('ownerId and type are required', () => {
      expect(() => new Fragment({})).toThrow();
    });

    test('ownerId is required', () => {
      expect(() => new Fragment({ type: 'text/plain', size: 1 })).toThrow();
    });

    test('type is required', () => {
      expect(() => new Fragment({ ownerId: '1234', size: 1 })).toThrow();
    });

    test('type can be a simple media type', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      expect(fragment.type).toEqual('text/plain');
    });

    test('type can include a charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.type).toEqual('text/plain; charset=utf-8');
    });

    test('size gets set to 0 if missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      expect(fragment.size).toBe(0);
    });

    test('size must be a number', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: '1' })).toThrow();
    });

    test('size can be 0', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 })).not.toThrow();
    });

    test('size cannot be negative', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: -1 })).toThrow();
    });

    test('invalid types throw', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'application/msword', size: 1 })).toThrow();
    });

    test('valid types can be set', () => {
      validTypes.forEach((format) => {
        const fragment = new Fragment({ ownerId: '1234', type: format, size: 1 });
        expect(fragment.type).toEqual(format);
      });
    });

    test('fragments have an id', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 1 });
      expect(fragment.id).toMatch(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
      );
    });

    test('fragments use id passed in if present', () => {
      const fragment = new Fragment({
        id: 'id',
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(fragment.id).toEqual('id');
    });

    test('fragments get a created datetime string', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 1 });
      expect(Date.parse(fragment.created)).not.toBeNaN();
    });

    test('fragments get an updated datetime string', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 1 });
      expect(Date.parse(fragment.updated)).not.toBeNaN();
    });
  });

  describe('isSupportedType()', () => {
    test('common text types are supported, with and without charset', () => {
      expect(Fragment.isSupportedType('text/plain')).toBe(true);
      expect(Fragment.isSupportedType('text/plain; charset=utf-8')).toBe(true);
    });

    test('other types are not supported', () => {
      expect(Fragment.isSupportedType('application/octet-stream')).toBe(false);
      expect(Fragment.isSupportedType('application/msword')).toBe(false);
      expect(Fragment.isSupportedType('audio/webm')).toBe(false);
      expect(Fragment.isSupportedType('video/ogg')).toBe(false);
    });
  });

  describe('mimeType, isText', () => {
    test('mimeType returns the mime type without charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.mimeType).toEqual('text/plain');
    });

    test('mimeType returns the mime type if charset is missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      expect(fragment.mimeType).toEqual('text/plain');
    });

    test('isText returns true for text types', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.isText).toBe(true);
    });
  });

  describe('formats', () => {
    test('formats returns expected result for plain text', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.formats).toEqual(['text/plain']);
    });

    test('markdown fragments report html as supported format', () => {
      const fragment = new Fragment({ ownerId: 'a', type: 'text/markdown', size: 0 });
      expect(fragment.formats).toEqual(['text/markdown', 'text/html']);
    });
  });

  describe('save(), getData(), setData(), byId(), byUser(), delete()', () => {
    test('byUser() returns empty array if no fragments for user', async () => {
      expect(await Fragment.byUser('1234')).toEqual([]);
    });

    test('fragment can be created and save() stores it', async () => {
      const data = Buffer.from('hello');
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      const fragment2 = await Fragment.byId('1234', fragment.id);
      expect(fragment2).toEqual(fragment);
      expect(await fragment2.getData()).toEqual(data);
    });

    test('save() updates updated date/time', async () => {
      const ownerId = '7777';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      const modified1 = fragment.updated;
      await wait();
      await fragment.save();
      const fragment2 = await Fragment.byId(ownerId, fragment.id);
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1));
    });

    test('setData() updates updated date/time', async () => {
      const data = Buffer.from('hello');
      const ownerId = '7777';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      const modified1 = fragment.updated;
      await wait();
      await fragment.setData(data);
      const fragment2 = await Fragment.byId(ownerId, fragment.id);
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1));
    });

    test("a fragment is added to user's list", async () => {
      const data = Buffer.from('hello');
      const ownerId = '5555';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);
      expect(await Fragment.byUser(ownerId)).toEqual([fragment.id]);
    });

    test('full fragments returned when requested for user', async () => {
      const data = Buffer.from('hello');
      const ownerId = '6666';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);
      expect(await Fragment.byUser(ownerId, true)).toEqual([fragment]);
    });

    test('setData() throws if not given Buffer', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain', size: 0 });
      expect(() => fragment.setData()).rejects.toThrow();
    });

    test('setData() updates fragment size', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('a'));
      expect(fragment.size).toBe(1);

      await fragment.setData(Buffer.from('aa'));
      const { size } = await Fragment.byId('1234', fragment.id);
      expect(size).toBe(2);
    });

    test('fragment can be deleted', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('a'));
      await Fragment.delete('1234', fragment.id);
      await expect(Fragment.byId('1234', fragment.id)).rejects.toThrow();
    });
  });

  describe('getConvertedData()', () => {
    test('throws error for unsupported conversion', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('plain text'));
      await expect(fragment.getConvertedData('text/html')).rejects.toThrow('Unsupported conversion');
    });

    test('converts markdown to HTML correctly', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# Heading\n\n**bold**'));
      const convertedData = await fragment.getConvertedData('text/html');
      expect(convertedData.toString()).toContain('<h1>Heading</h1>');
      expect(convertedData.toString()).toContain('<strong>bold</strong>');
    });

    test('converts various types to text/plain', async () => {
      const htmlFragment = new Fragment({ ownerId: '1234', type: 'text/html', size: 0 });
      await htmlFragment.save();
      await htmlFragment.setData(Buffer.from('<h1>Title</h1>'));
      const plainData = await htmlFragment.getConvertedData('text/plain');
      expect(plainData.toString()).toBe('<h1>Title</h1>');

      const jsonFragment = new Fragment({ ownerId: '5678', type: 'application/json', size: 0 });
      await jsonFragment.save();
      await jsonFragment.setData(Buffer.from('{"key":"value"}'));
      const jsonToPlain = await jsonFragment.getConvertedData('text/plain');
      expect(jsonToPlain.toString()).toBe('{"key":"value"}');
    });

    test('returns original data when no conversion needed', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      const originalData = Buffer.from('test data');
      await fragment.setData(originalData);
      expect(await fragment.getConvertedData('text/plain')).toEqual(originalData);
    });

    test('handles complex markdown conversions', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('## Subtitle\n\n- Item'));
      const convertedData = await fragment.getConvertedData('text/html');
      expect(convertedData.toString()).toContain('<h2>Subtitle</h2>');
    });

    test('handles empty data conversion', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from(''));
      const convertedData = await fragment.getConvertedData('text/html');
      expect(convertedData).toBeInstanceOf(Buffer);
    });
  });

  describe('edge cases', () => {
    test('handles conversion with mimeType', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown; charset=utf-8', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# Test'));
      const converted = await fragment.getConvertedData('text/html');
      expect(converted.toString()).toContain('<h1>Test</h1>');
    });

    test('validates unsupported conversions', async () => {
      const jsonFragment = new Fragment({ ownerId: '1234', type: 'application/json', size: 0 });
      await jsonFragment.save();
      await jsonFragment.setData(Buffer.from('{"test":true}'));
      await expect(jsonFragment.getConvertedData('text/html')).rejects.toThrow();

      const htmlFragment = new Fragment({ ownerId: '5678', type: 'text/html', size: 0 });
      await htmlFragment.save();
      await htmlFragment.setData(Buffer.from('<p>test</p>'));
      await expect(htmlFragment.getConvertedData('text/markdown')).rejects.toThrow();
    });

    test('tests default case in formats getter', async () => {
      const supportedTypes = ['text/plain', 'text/markdown', 'text/html', 'application/json'];
      for (const type of supportedTypes) {
        const fragment = new Fragment({ ownerId: '1234', type, size: 0 });
        expect(Array.isArray(fragment.formats)).toBe(true);
      }
    });
  });
});
