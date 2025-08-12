// test/unit/app.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('app.js', () => {
  test('requesting nonexistent page should return 404', async () => {
    const res = await request(app).get('/this-is-not-a-page').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('not found');
  });
});
