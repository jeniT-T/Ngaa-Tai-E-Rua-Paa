jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');
const { signToken } = require('../utils/jwt');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('requireAuth middleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    User.findById.mockReset();
  });

  test('rejects with 401 when there is no token cookie', async () => {
    const res = mockRes();
    const next = jest.fn();

    await requireAuth({ cookies: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  test('accepts a valid token and loads the user from the database', async () => {
    User.findById.mockResolvedValue({ id: 3, role: 'manager' });
    const req = { cookies: { token: signToken({ userId: 3 }) } };
    const res = mockRes();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(User.findById).toHaveBeenCalledWith(3);
    expect(req.user).toEqual({ id: 3, role: 'manager' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('rejects a token signed with an algorithm other than HS256 (CR-10)', async () => {
    const token = jwt.sign({ userId: 3 }, 'test-secret', { algorithm: 'HS512' });
    const res = mockRes();
    const next = jest.fn();

    await requireAuth({ cookies: { token } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(User.findById).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects with 401 when the user no longer exists', async () => {
    User.findById.mockResolvedValue(null);
    const res = mockRes();
    const next = jest.fn();

    await requireAuth({ cookies: { token: signToken({ userId: 99 }) } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'User no longer exists' });
    expect(next).not.toHaveBeenCalled();
  });
});
