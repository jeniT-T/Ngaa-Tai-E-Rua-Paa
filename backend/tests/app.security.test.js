const fs = require('fs');
const path = require('path');
const request = require('supertest');

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({ query: jest.fn() })),
}));

process.env.JWT_SECRET = 'test-secret';
delete process.env.FRONTEND_URL;

const app = require('../app');

describe('security headers (CR-09)', () => {
  test('responses carry the helmet headers and do not announce Express', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
    // Not "no-referrer", which would stop embedded YouTube videos from playing.
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('uploaded files are served with nosniff and may be loaded by the site on another port', async () => {
    const dir = path.join(__dirname, '..', 'uploads');
    const file = path.join(dir, 'security-test.png');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    try {
      const res = await request(app).get('/uploads/security-test.png');

      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    } finally {
      fs.unlinkSync(file);
    }
  });
});

describe('error answers are JSON (CR-09)', () => {
  test('a request from an origin that is not allowed gets a 403 JSON error, not an HTML page', async () => {
    const res = await request(app).get('/api/auth/me').set('Origin', 'http://evil.example');

    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.error).toMatch(/not allowed by CORS/);
  });

  test('the local development origin is still allowed', async () => {
    const res = await request(app).get('/api/auth/me').set('Origin', 'http://localhost:3000');

    expect(res.status).toBe(401);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  test('a request body that is not valid JSON gets a 400 JSON error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
