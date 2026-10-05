const request = require('supertest');
const express = require('express');

jest.mock('../middleware/requireAuth', () => (req, res, next) => {
  const header = req.headers['x-test-user'];
  req.user = header ? JSON.parse(header) : null;
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
});

jest.mock('../models/ContentItem', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
}));

const ContentItem = require('../models/ContentItem');
const contentRouter = require('../routes/content');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/content', contentRouter);
  return app;
}

function asUser(user) {
  return { 'x-test-user': JSON.stringify(user) };
}

describe('POST /api/content -- who can create content where', () => {
  const app = buildApp();

  beforeEach(() => {
    ContentItem.create.mockReset();
    ContentItem.create.mockResolvedValue({ id: 1 });
  });

  test('admin can create content on any placement', async () => {
    const res = await request(app)
      .post('/api/content')
      .set(asUser({ id: 1, role: 'admin' }))
      .send({ title: 'T', body: 'B', placement: 'home' });

    expect(res.status).toBe(201);
    expect(ContentItem.create).toHaveBeenCalledTimes(1);
  });

  test('caretaker can create content on their own tutorials placement', async () => {
    const res = await request(app)
      .post('/api/content')
      .set(asUser({ id: 2, role: 'caretaker' }))
      .send({ title: 'T', body: 'B', placement: 'caretaker-tutorials' });

    expect(res.status).toBe(201);
  });

  test('caretaker is forbidden from creating content on any other public page', async () => {
    const res = await request(app)
      .post('/api/content')
      .set(asUser({ id: 2, role: 'caretaker' }))
      .send({ title: 'T', body: 'B', placement: 'home' });

    expect(res.status).toBe(403);
    expect(ContentItem.create).not.toHaveBeenCalled();
  });

  test('caretaker is forbidden from creating a library-only item (no placement at all)', async () => {
    const res = await request(app)
      .post('/api/content')
      .set(asUser({ id: 2, role: 'caretaker' }))
      .send({ title: 'T', body: 'B' });

    expect(res.status).toBe(403);
  });

  test('a member cannot reach this route at all -- requireRole rejects before canWriteContent ever runs', async () => {
    const res = await request(app)
      .post('/api/content')
      .set(asUser({ id: 3, role: 'member' }))
      .send({ title: 'T', body: 'B', placement: 'caretaker-tutorials' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden: insufficient permissions');
    expect(ContentItem.create).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/content/:id -- a caretaker cannot move content off (or onto) their own page', () => {
  const app = buildApp();

  beforeEach(() => {
    ContentItem.update.mockReset();
  });

  test('caretaker cannot edit an existing item that lives on another placement', async () => {
    ContentItem.findById.mockResolvedValue({ id: 5, placement: 'home' });

    const res = await request(app)
      .patch('/api/content/5')
      .set(asUser({ id: 2, role: 'caretaker' }))
      .send({ title: 'T', body: 'B', placement: 'home' });

    expect(res.status).toBe(403);
    expect(ContentItem.update).not.toHaveBeenCalled();
  });

  test('caretaker cannot use an update to move their own tutorial item onto another page', async () => {
    ContentItem.findById.mockResolvedValue({ id: 6, placement: 'caretaker-tutorials' });

    const res = await request(app)
      .patch('/api/content/6')
      .set(asUser({ id: 2, role: 'caretaker' }))
      .send({ title: 'T', body: 'B', placement: 'home' });

    expect(res.status).toBe(403);
  });

  test('caretaker can edit their own tutorial item when it stays on the same placement', async () => {
    ContentItem.findById.mockResolvedValue({ id: 7, placement: 'caretaker-tutorials' });
    ContentItem.update.mockResolvedValue({ id: 7 });

    const res = await request(app)
      .patch('/api/content/7')
      .set(asUser({ id: 2, role: 'caretaker' }))
      .send({ title: 'T', body: 'B', placement: 'caretaker-tutorials' });

    expect(res.status).toBe(200);
    expect(ContentItem.update).toHaveBeenCalledTimes(1);
  });

  test('admin can edit any item regardless of placement', async () => {
    ContentItem.findById.mockResolvedValue({ id: 8, placement: 'home' });
    ContentItem.update.mockResolvedValue({ id: 8 });

    const res = await request(app)
      .patch('/api/content/8')
      .set(asUser({ id: 1, role: 'admin' }))
      .send({ title: 'T', body: 'B', placement: 'facilities' });

    expect(res.status).toBe(200);
  });
});
