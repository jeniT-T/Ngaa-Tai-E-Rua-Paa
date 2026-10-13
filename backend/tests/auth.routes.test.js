const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

jest.mock('../models/User', () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
  findByValidResetToken: jest.fn(),
  updatePassword: jest.fn(),
}));
jest.mock('../utils/mailer', () => ({ sendEmail: jest.fn().mockResolvedValue(undefined) }));

process.env.JWT_SECRET = 'test-secret';

const User = require('../models/User');
const authRouter = require('../routes/auth');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRouter);
  return app;
}

describe('POST /api/auth/register -- password rule', () => {
  const app = buildApp();
  beforeEach(() => {
    User.findByEmail.mockReset();
    User.create.mockReset();
    User.findByEmail.mockResolvedValue(null);
    User.create.mockResolvedValue({ id: 1, email: 'a@b.co', role: 'member', name: 'A' });
  });

  test('a password shorter than 8 characters is rejected with 400 and no account is created', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'a@b.co', password: 'short12' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 8/);
    expect(User.create).not.toHaveBeenCalled();
  });

  test('a password of exactly 8 characters is accepted', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'a@b.co', password: '12345678' });
    expect(res.status).toBe(201);
    expect(User.create).toHaveBeenCalled();
  });

  test('a duplicate email still returns 409', async () => {
    User.findByEmail.mockResolvedValue({ id: 9 });
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'a@b.co', password: '12345678' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/reset-password -- password rule', () => {
  const app = buildApp();
  beforeEach(() => {
    User.findByValidResetToken.mockReset();
    User.updatePassword.mockReset();
    User.findByValidResetToken.mockResolvedValue({ id: 1 });
  });

  test('a short new password is rejected with 400 and the password is not changed', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 't', password: 'short' });
    expect(res.status).toBe(400);
    expect(User.updatePassword).not.toHaveBeenCalled();
  });

  test('an expired or unknown token returns 400', async () => {
    User.findByValidResetToken.mockResolvedValue(null);
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'bad', password: '1234567890' });
    expect(res.status).toBe(400);
    expect(User.updatePassword).not.toHaveBeenCalled();
  });

  test('a valid token and a long enough password updates the password', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 't', password: '1234567890' });
    expect(res.status).toBe(200);
    expect(User.updatePassword).toHaveBeenCalledWith(1, expect.any(String));
  });
});
