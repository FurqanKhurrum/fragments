// tests/unit/get.test.js

const request = require('supertest');
const app = require('../../src/app');
const hash = require('../../src/hash');
const fs = require('fs');
const path = require('path');
const { Fragment } = require('../../src/model/fragment');

const resetData = async (user) => {
  const fragmentsIds = await Fragment.byUser(hash(user));

  if (fragmentsIds.length > 0) {
    fragmentsIds.forEach(async (id) => {
      await Fragment.delete(hash(user), id);
    });
  }
};

describe('GET /v1/fragments', () => {
  // clean up after each test
  afterEach(async () => {
    await resetData('user1@email.com');
  });

  test('unauthenticated requests are denied', async () => {
    const res = await request(app).get('/v1/fragments');
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password');
    expect(res.statusCode).toBe(401);
  });

  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  test('all user fragments id should be retrieved in an array', async () => {
    const fragmentId1 = (
      await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('This is fragment1')
    ).body.fragment.id;

    const fragmentId2 = (
      await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('This is fragment2')
    ).body.fragment.id;

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    const resFragments = res.body.fragments;

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(resFragments[0]).toBe(fragmentId1);
    expect(resFragments[1]).toBe(fragmentId2);
  });

  test('returns an empty array if user has no fragments', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    const resFragment = res.body.fragments;

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(resFragment)).toBe(true);
    expect(resFragment.length).toBe(0);
  });
});

describe('GET /v1/fragments?expand=1', () => {
  // clean up after each test
  afterEach(async () => {
    await resetData('user1@email.com');
  });

  test('result should includes full representation of fragments metadata', async () => {
    const fragmentId1 = (
      await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('This is fragment1')
    ).body.fragment.id;

    const fragmentId2 = (
      await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('This is fragment2')
    ).body.fragment.id;

    const res = await request(app).get('/v1/fragments?expand=1').auth('user1@email.com', 'password1');
    const resFragments = res.body.fragments;

    expect(res.statusCode).toBe(200);
    expect(resFragments[0].id).toBe(fragmentId1);
    expect(resFragments[1].id).toBe(fragmentId2);
  });

  test('returns an empty array if user has no fragments', async () => {
    const res = await request(app).get('/v1/fragments?expand=1').auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments.length).toBe(0);
  });
});

describe('GET /v1/fragments/:id', () => {
  // clean up after each test
  afterEach(async () => {
    await resetData('user1@email.com');
  });

  test('unauthenticated requests are denied', async () => {
    const res = await request(app).get('/v1/fragments/id');
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app).get('/v1/fragments/id').auth('invalid@email.com', 'incorrect_password');
    expect(res.statusCode).toBe(401);
  });

  test('requesting a non-existent fragment should return an error', async () => {
    const res = await request(app).get('/v1/fragments/no-such-id').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
  });

  test('requesting an existent fragment should return its data', async () => {
    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/plain')
      .send('This is a fragment');

    const createdFragmentId = postResponse.body.fragment.id;

    const res = await request(app).get(`/v1/fragments/${createdFragmentId}`).auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.text).toBe('This is a fragment');
  });
});

describe('Converting fragments GET /v1/fragments/:id', () => {
  // clean up after each test
  afterEach(async () => {
    await resetData('user1@email.com');
  });

  test('incompatible fragment conversion should throw', async () => {
    const data = '# Markdown';

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/markdown')
      .send(data);

    const createdFragmentId = postResponse.body.fragment.id;

    const res = await request(app).get(`/v1/fragments/${createdFragmentId}.gif`).auth('user1@email.com', 'password1');

    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe(415);
    expect(res.body.error.message).toBeDefined;
  });

  test('converting: txt => txt', async () => {
    const data = 'This is a text';

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/plain')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.txt`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('text/plain');
    expect(res.text).toBe('This is a text');
  });

  test('converting: md => md', async () => {
    const data = '# Markdown';

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/markdown')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.md`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('text/markdown');
    expect(res.text).toBe('# Markdown');
  });

  test('converting: md => html', async () => {
    const data = '# Markdown';

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/markdown')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.html`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('text/html');
    expect(res.text).toBe('<h1>Markdown</h1>\n');
  });

  test('converting: md => txt', async () => {
    const data = '# Markdown';

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/markdown')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.txt`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('text/plain');
    expect(res.text).toBe('MARKDOWN');
  });

  test('converting: html => html', async () => {
    const data = '<h1>This is HTML</h1>';

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/html')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.html`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('text/html');
    expect(res.text).toBe('<h1>This is HTML</h1>');
  });

  test('converting: html => txt', async () => {
    const data = '<h1>This is HTML</h1>';

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/html')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.txt`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('text/plain');
    expect(res.text).toBe('THIS IS HTML');
  });

  test('converting: json => json', async () => {
    const data = {
      content: 'This is JSON',
    };

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'application/json')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.json`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('application/json');
    expect(res.body).toEqual({ content: 'This is JSON' });
  });

  test('converting: json => txt', async () => {
    const data = {
      content: 'This is JSON',
    };

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'application/json')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.txt`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('text/plain');
    expect(res.text).toBe('{"content":"This is JSON"}');
  });

  test('converting: png => png', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_PNG_500kB.png');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/png')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.png`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/png');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: png => jpeg', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_PNG_500kB.png');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/png')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.jpg`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/jpeg');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: png => webp', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_PNG_500kB.png');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/png')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.webp`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/webp');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: png => gif', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_PNG_500kB.png');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/png')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.gif`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/gif');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: jpg => jpg', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_JPG_500kB.jpg');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/jpeg')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.jpg`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/jpeg');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: jpg => png', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_JPG_500kB.jpg');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/jpeg')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.png`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/png');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: jpg => webp', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_JPG_500kB.jpg');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/jpeg')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.webp`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/webp');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: jpg => gif', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_JPG_500kB.jpg');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/jpeg')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.gif`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/gif');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: webp => webp', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_WEBP_500kB.webp');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/webp')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.webp`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/webp');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: webp => png', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_WEBP_500kB.webp');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/webp')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.png`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/png');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: webp => jpg', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_WEBP_500kB.webp');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/webp')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.jpg`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/jpeg');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: webp => gif', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_WEBP_500kB.webp');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/webp')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.gif`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/gif');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: gif => gif', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_GIF_500kB.gif');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/gif')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.gif`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/gif');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: gif => png', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_GIF_500kB.gif');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/gif')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.png`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/png');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: gif => jpg', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_GIF_500kB.gif');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/gif')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.jpg`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/jpeg');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('converting: gif => webp', async () => {
    const imgPath = path.join(__dirname, '../assets', 'file_example_GIF_500kB.gif');
    const data = fs.readFileSync(imgPath);

    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'image/gif')
      .send(data);

    const res = await request(app)
      .get(`/v1/fragments/${postResponse.body.fragment.id}.webp`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.get('Content-Type')).toContain('image/webp');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });
});

describe('GET /v1/fragments/:id/info', () => {
  // clean up after each test
  afterEach(async () => {
    await resetData('user1@email.com');
  });

  test('return an existing fragment data', async () => {
    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is fragment1');

    const postedFragmentId = postResponse.body.fragment.id;

    const res = await request(app).get(`/v1/fragments/${postedFragmentId}/info`).auth('user1@email.com', 'password1');

    const resFragment = res.body.fragment;

    expect(res.status).toBe(200);
    expect(resFragment.id).toEqual(postedFragmentId);
    expect(typeof resFragment).toBe('object');
  });

  test('requesting a non-existent fragment should throw', async () => {
    const res = await request(app).get(`/v1/fragments/non-existent/info`).auth('user1@email.com', 'password1');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toBeDefined;
  });
});
