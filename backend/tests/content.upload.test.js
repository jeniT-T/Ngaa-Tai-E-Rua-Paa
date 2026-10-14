const fs = require('fs');
const path = require('path');
const request = require('supertest');
const express = require('express');

jest.mock('../middleware/requireAuth', () => (req, res, next) => {
  const header = req.headers['x-test-user'];
  req.user = header ? JSON.parse(header) : null;
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
});

jest.mock('../models/ContentItem', () => ({
  findByPlacement: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
}));

const contentRouter = require('../routes/content');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from('rest of the file'),
]);
const admin = { 'x-test-user': JSON.stringify({ id: 1, role: 'admin' }) };

function buildApp() {
  const app = express();
  app.use('/api/content', contentRouter);
  return app;
}

describe('POST /api/content/upload -- file names and types (CR-11)', () => {
  const app = buildApp();
  let before;

  beforeAll(() => {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  });

  beforeEach(() => {
    before = new Set(fs.readdirSync(UPLOAD_DIR));
  });

  function newFiles() {
    return fs.readdirSync(UPLOAD_DIR).filter((name) => !before.has(name));
  }

  afterEach(() => {
    newFiles().forEach((name) => fs.unlinkSync(path.join(UPLOAD_DIR, name)));
  });

  test('a real PNG is saved with a .png name', async () => {
    const res = await request(app)
      .post('/api/content/upload')
      .set(admin)
      .attach('image', PNG, { filename: 'photo.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/uploads\/\d+-[0-9a-f]{16}\.png$/);
    expect(newFiles()).toHaveLength(1);
  });

  test('the extension comes from the MIME type, not from the name the browser sent', async () => {
    const res = await request(app)
      .post('/api/content/upload')
      .set(admin)
      .attach('image', PNG, { filename: 'evil.html', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/\.png$/);
    expect(res.body.url).not.toMatch(/html/);
  });

  test('a file that says it is a PNG but contains HTML is refused and deleted', async () => {
    const res = await request(app)
      .post('/api/content/upload')
      .set(admin)
      .attach('image', Buffer.from('<html><script>alert(1)</script></html>'), {
        filename: 'photo.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not a valid/);
    expect(newFiles()).toHaveLength(0);
  });

  test('a JPEG file sent as a PNG is refused (bytes do not match the stated type)', async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const res = await request(app)
      .post('/api/content/upload')
      .set(admin)
      .attach('image', jpeg, { filename: 'photo.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(newFiles()).toHaveLength(0);
  });

  test('a MIME type that is not an allowed image is refused', async () => {
    const res = await request(app)
      .post('/api/content/upload')
      .set(admin)
      .attach('image', Buffer.from('<html></html>'), { filename: 'page.html', contentType: 'text/html' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Only JPEG, PNG, WEBP or GIF/);
    expect(newFiles()).toHaveLength(0);
  });

  test('a member cannot upload', async () => {
    const res = await request(app)
      .post('/api/content/upload')
      .set({ 'x-test-user': JSON.stringify({ id: 5, role: 'member' }) })
      .attach('image', PNG, { filename: 'photo.png', contentType: 'image/png' });

    expect(res.status).toBe(403);
    expect(newFiles()).toHaveLength(0);
  });
});
