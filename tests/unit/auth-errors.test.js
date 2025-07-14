const request = require('supertest');
const app = require('../../src/app');

describe('Authentication Edge Cases', () => {
  test('malformed auth header', async () => {
    const res = await request(app)
      .get('/v1/fragments')
      .set('Authorization', 'not-basic-auth');
    expect(res.statusCode).toBe(401);
  });

  test('empty credentials', async () => {
    const res = await request(app).get('/v1/fragments').auth('', '');
    expect(res.statusCode).toBe(401);
  });
});
