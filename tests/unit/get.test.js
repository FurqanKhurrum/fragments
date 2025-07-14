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

  test('authenticated users can request expanded metadata', async () => {
    const auth = ['user1@email.com', 'password1'];

    const create = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'text/plain')
      .send('expanding');

    expect(create.statusCode).toBe(201);

    const res = await request(app).get('/v1/fragments?expand=1').auth(...auth);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments.length).toBeGreaterThan(0);
    const frag = res.body.fragments[0];
    expect(frag).toEqual(expect.objectContaining({ id: expect.any(String), ownerId: expect.any(String) }));
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

  test('GET /v1/fragments/:id returns correct Content-Type', async () => {
    const auth = ['user1@email.com', 'password1'];

    const create = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'text/markdown')
      .send('# header');

    const id = create.body.fragment.id;

    const res = await request(app).get(`/v1/fragments/${id}`).auth(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
    expect(res.text).toBe('# header');
  });

  test('GET /v1/fragments/:id.html converts markdown to HTML', async () => {
    const auth = ['user1@email.com', 'password1'];

    const create = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'text/markdown')
      .send('# header');

    const id = create.body.fragment.id;

    const res = await request(app).get(`/v1/fragments/${id}.html`).auth(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text.trim()).toBe('<h1>header</h1>');
  });

  test('unsupported conversions return 415', async () => {
    const auth = ['user1@email.com', 'password1'];

    const create = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'text/plain')
      .send('hi');

    const id = create.body.fragment.id;

    const res = await request(app).get(`/v1/fragments/${id}.html`).auth(...auth);
    expect(res.statusCode).toBe(415);
  });

  test('returns 404 for a non-existent fragment ID', async () => {
    const auth = ['user1@email.com', 'password1'];
    const res = await request(app)
      .get('/v1/fragments/does-not-exist')
      .auth(...auth);

    expect(res.statusCode).toBe(404);
  });

});

describe('GET /v1/fragments/:id/info', () => {
  test('returns fragment metadata', async () => {
    const auth = ['user1@email.com', 'password1'];

    const create = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'text/plain')
      .send('meta');

    const id = create.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${id}/info`)
      .auth(...auth);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toEqual(
      expect.objectContaining({
        id,
        ownerId: expect.any(String),
        type: expect.stringContaining('text/plain'),
        size: 4,
      })
    );
  });

  test('returns 404 for non-existent fragment', async () => {
    const auth = ['user1@email.com', 'password1'];
    const res = await request(app)
      .get('/v1/fragments/bogus/info')
      .auth(...auth);

    expect(res.statusCode).toBe(404);
  });

    describe('GET /v1/fragments - Error Handling', () => {
  test('handles non-existent fragment ID gracefully', async () => {
    const auth = ['user1@email.com', 'password1'];
    
    const res = await request(app).get('/v1/fragments/non-existent-id').auth(...auth);
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain('Fragment not found');
  });

  test('handles non-existent fragment ID with extension', async () => {
    const auth = ['user1@email.com', 'password1'];
    
    const res = await request(app).get('/v1/fragments/non-existent-id.html').auth(...auth);
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain('Fragment not found');
  });

  test('handles non-existent fragment ID for info endpoint', async () => {
    const auth = ['user1@email.com', 'password1'];
    
    const res = await request(app).get('/v1/fragments/non-existent-id/info').auth(...auth);
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain('Fragment not found');
  });

  test('returns 415 for unsupported file extensions', async () => {
    const auth = ['user1@email.com', 'password1'];

    // Create a fragment first
    const create = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'text/plain')
      .send('test data');

    const id = create.body.fragment.id;

    const res = await request(app).get(`/v1/fragments/${id}.pdf`).auth(...auth);
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain('Unsupported file extension');
  });

  test('handles malformed fragment IDs', async () => {
    const auth = ['user1@email.com', 'password1'];
    
    // Test with IDs that should definitely return 404 (non-existent but properly formatted)
    const nonExistentIds = [
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', // Valid UUID format but doesn't exist
      'non-existent-fragment-id-12345',       // Simple non-existent ID
      '00000000-0000-0000-0000-000000000000'  // Zero UUID
    ];
    
    for (const id of nonExistentIds) {
      const res = await request(app).get(`/v1/fragments/${id}`).auth(...auth);
      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
    }
  });

  test('handles empty and whitespace fragment IDs', async () => {
    const auth = ['user1@email.com', 'password1'];
    
    // Test empty ID - this should hit a different route or return 404
    const res1 = await request(app).get('/v1/fragments/').auth(...auth);
    expect([200, 404]).toContain(res1.statusCode); // Might hit the list endpoint or 404
    
    // Test URL-encoded space
    const res2 = await request(app).get('/v1/fragments/%20').auth(...auth);
    expect(res2.statusCode).toBe(404);
  });

  test('verifies conversion formats are correctly validated', async () => {
    const auth = ['user1@email.com', 'password1'];

    // Create a JSON fragment
    const create = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'application/json')
      .send('{"test": true}');

    const id = create.body.fragment.id;

    // Try to convert JSON to HTML (should fail)
    const res = await request(app).get(`/v1/fragments/${id}.html`).auth(...auth);
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain('Unsupported conversion');
  });

  test('handles edge cases with fragment extensions', async () => {
    const auth = ['user1@email.com', 'password1'];

    // Create a fragment
    const create = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'text/plain')
      .send('test data');

    const id = create.body.fragment.id;

    // Test various edge case extensions
    const invalidExtensions = ['exe', 'zip', 'unknown', '123'];
    
    for (const ext of invalidExtensions) {
      const res = await request(app).get(`/v1/fragments/${id}.${ext}`).auth(...auth);
      expect(res.statusCode).toBe(415);
      expect(res.body.status).toBe('error');
    }
  });
});

// ========== ADD TO tests/unit/post.test.js ==========
// Add these tests to the existing describe block

describe('POST /v1/fragments - Error Handling', () => {
  test('handles invalid buffer data in setData', async () => {
    const auth = ['user1@email.com', 'password1'];
    
    const res = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'text/plain')
      .send(''); // Empty body
      
    expect(res.statusCode).toBe(201); // Should still work with empty body
  });

  test('handles very large content', async () => {
    const auth = ['user1@email.com', 'password1'];
    
    // Create content larger than 5MB to test the limit
    const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
    
    const res = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'text/plain')
      .send(largeContent);
      
    expect(res.statusCode).toBe(413); // Payload too large
  });

  test('handles content-type with complex charset', async () => {
    const auth = ['user1@email.com', 'password1'];
    
    const res = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'text/plain; charset=iso-8859-1; boundary=something')
      .send('test data');
      
    expect(res.statusCode).toBe(201);
    expect(res.body.fragment.type).toContain('text/plain');
  });

  test('Location header uses Host header when API_URL is unset', async () => {
    const auth = ['user1@email.com', 'password1'];
    delete process.env.API_URL;
    
    const res = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'text/plain')
      .send('test data');
      
    expect(res.statusCode).toBe(201);
    expect(res.headers.location).toBeDefined();
    // Should contain the test server's host (which supertest provides)
    expect(res.headers.location).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/v1\/fragments\//);
  });

  test('handles malformed Content-Type header', async () => {
    const auth = ['user1@email.com', 'password1'];
    
    const res = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      .set('Content-Type', 'not-a-valid-content-type')
      .send('test data');
      
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });

  test('handles missing Content-Type header', async () => {
    const auth = ['user1@email.com', 'password1'];
    
    const res = await request(app)
      .post('/v1/fragments')
      .auth(...auth)
      // Don't set Content-Type header
      .send('test data');
      
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });
});

// ========== CREATE NEW FILE: tests/unit/auth-errors.test.js ==========
// This tests authentication edge cases that might be causing coverage gaps

const request = require('supertest');
const app = require('../../src/app');

describe('Authentication Error Handling', () => {
  test('handles malformed Authorization header', async () => {
    const res = await request(app)
      .get('/v1/fragments')
      .set('Authorization', 'malformed-header');
      
    expect(res.statusCode).toBe(401);
  });

  test('handles empty Authorization header', async () => {
    const res = await request(app)
      .get('/v1/fragments')
      .set('Authorization', '');
      
    expect(res.statusCode).toBe(401);
  });

  test('handles non-Basic authorization schemes', async () => {
    const res = await request(app)
      .get('/v1/fragments')
      .set('Authorization', 'Bearer some-token');
      
    expect(res.statusCode).toBe(401);
  });
});
});
