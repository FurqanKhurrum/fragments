// tests/unit/put.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('PUT /v1/fragments/:id', () => {
  test('unauthenticated requests are denied', async () => {
    const res = await request(app).put('/v1/fragments/id');
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app).put('/v1/fragments/id').auth('invalid@email.com', 'incorrect_password');
    expect(res.statusCode).toBe(401);
  });

  test('A fragment can be updated with the same type of content', async () => {
    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/plain')
      .send('This is a fragment');

    const createdFragmentId = postResponse.body.fragment.id;

    const res = await request(app)
      .put(`/v1/fragments/${createdFragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/plain')
      .send('This is a much much longer fragment');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.size).toBe(35);
    expect(res.body.fragment.created).not.toEqual(res.body.fragment.updated);
  });

  test('A fragment cannot be updated when requested content type is different', async () => {
    const postResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/plain')
      .send('This is a fragment');

    const createdFragmentId = postResponse.body.fragment.id;

    const res = await request(app)
      .put(`/v1/fragments/${createdFragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/md')
      .send('This is a much much longer fragment');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  test('A non-existent fragment cannot be updated', async () => {
    const res = await request(app)
      .put(`/v1/fragments/non-existent`)
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/plain')
      .send('This is a much much longer fragment');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
