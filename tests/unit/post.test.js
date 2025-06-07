const request = require('supertest');
const app = require('../../src/app');
const hash = require('../../src/hash');

describe('POST /v1/fragments', () => {
  test('unauthenticated requests are denied', () =>
    request(app).post('/v1/fragments').expect(401));

  test('unsupported content type results in 415', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send('{}');
    expect(res.statusCode).toBe(415);
  });

  test('creates a fragment with valid content type', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('hello world');
    expect(postRes.statusCode).toBe(201);
    expect(postRes.headers.location).toBeDefined();

    const id = postRes.body.fragment.id;
    const getRes = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe('hello world');
  });

  test('content type with charset is parsed correctly', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send('with charset');
    expect(res.statusCode).toBe(201);
    expect(res.body.fragment.type).toContain('text/plain');
  });

  test('Location header uses request host if API_URL is unset', async () => {
    delete process.env.API_URL;
    const res = await request(app)
      .post('/v1/fragments')
      .set('Host', 'api.test:1234')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('host header');

    expect(res.statusCode).toBe(201);
    const expected = 'http://api.test:1234/v1/fragments/' + res.body.fragment.id;
    expect(res.headers.location).toBe(expected);
  });

  test('Location header uses API_URL when provided', async () => {
    process.env.API_URL = 'https://api.example.com';
    const res = await request(app)
      .post('/v1/fragments')
      .set('Host', 'ignored.com')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('env var');

    expect(res.statusCode).toBe(201);
    const expected = `https://api.example.com/v1/fragments/${res.body.fragment.id}`;
    expect(res.headers.location).toBe(expected);
    delete process.env.API_URL;
  });

  test('response includes expected fragment metadata', async () => {
    process.env.API_URL = 'http://localhost:8080';
    const data = 'meta test';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(data);

    expect(res.statusCode).toBe(201);
    const frag = res.body.fragment;
    expect(frag).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        ownerId: hash('user1@email.com'),
        type: 'text/plain',
        size: data.length,
      })
    );
    expect(new Date(frag.created).toISOString()).toBe(frag.created);
    expect(new Date(frag.updated).toISOString()).toBe(frag.updated);

    const expectedLocation = `http://localhost:8080/v1/fragments/${frag.id}`;
    expect(res.headers.location).toBe(expectedLocation);
  });
});
