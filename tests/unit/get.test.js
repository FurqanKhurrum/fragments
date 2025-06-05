// tests/unit/get.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  test('authenticated users get their own fragment IDs after creating a fragment', async () => {
    const auth = ['user1@email.com', 'password1'];

    // Create a new fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'text/plain')
      .send('Hello Fragment!');

    expect(postRes.statusCode).toBe(201);

    // Get the list of fragments
    const getRes = await request(app).get('/v1/fragments').auth(...auth);
    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body.fragments)).toBe(true);
    expect(getRes.body.fragments.length).toBeGreaterThan(0);
  });

  test('can retrieve a fragment by its ID', async () => {
    const auth = ['user1@email.com', 'password1'];

    const create = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'text/plain')
      .send('Test data');

    const id = create.body.fragment.id;

    const res = await request(app).get(`/v1/fragments/${id}`).auth(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Test data');
  });


  test('returns 404 for a non-existent fragment ID', async () => {
    const auth = ['user1@email.com', 'password1'];
    const res = await request(app)
      .get('/v1/fragments/does-not-exist')
      .auth(...auth);

    expect(res.statusCode).toBe(404);
  });

});
