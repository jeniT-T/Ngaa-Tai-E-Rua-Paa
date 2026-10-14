const jwt = require('jsonwebtoken');
const { signToken, verifyToken, assertJwtSecret } = require('../utils/jwt');

describe('login token helpers (CR-10)', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  test('signToken makes an HS256 token that verifyToken accepts', () => {
    const token = signToken({ userId: 7 });

    expect(jwt.decode(token, { complete: true }).header.alg).toBe('HS256');
    expect(verifyToken(token).userId).toBe(7);
  });

  test('a token lasts 7 days', () => {
    const { iat, exp } = jwt.decode(signToken({ userId: 1 }));

    expect(exp - iat).toBe(7 * 24 * 60 * 60);
  });

  test('verifyToken rejects a token signed with a different algorithm, even with the right secret', () => {
    const token = jwt.sign({ userId: 7 }, 'test-secret', { algorithm: 'HS512' });

    expect(() => verifyToken(token)).toThrow('invalid algorithm');
  });

  test('verifyToken rejects an unsigned token (alg "none")', () => {
    const token = jwt.sign({ userId: 7 }, '', { algorithm: 'none' });

    expect(() => verifyToken(token)).toThrow();
  });

  test('verifyToken rejects a token signed with another secret', () => {
    const token = jwt.sign({ userId: 7 }, 'some-other-secret', { algorithm: 'HS256' });

    expect(() => verifyToken(token)).toThrow('invalid signature');
  });

  test('signToken and assertJwtSecret fail when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;

    expect(() => assertJwtSecret()).toThrow('JWT_SECRET is not set');
    expect(() => signToken({ userId: 1 })).toThrow('JWT_SECRET is not set');
  });

  test('assertJwtSecret passes when JWT_SECRET is set', () => {
    expect(() => assertJwtSecret()).not.toThrow();
  });
});
