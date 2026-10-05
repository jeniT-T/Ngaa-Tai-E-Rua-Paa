const mockQuery = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({ query: mockQuery })),
}));

const User = require('../models/User');

describe('User password-reset flow', () => {
  beforeEach(() => mockQuery.mockReset());

  test('setResetToken stores the token and its expiry against the given user', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1, email: 'a@b.com', name: 'A' }] });
    const expires = new Date('2026-12-01T00:00:00Z');

    await User.setResetToken(1, 'tok123', expires);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/SET reset_token = \$1, reset_token_expires = \$2/);
    expect(params).toEqual(['tok123', expires, 1]);
  });

  test("findByValidResetToken's query enforces the token hasn't expired, not just that it matches", async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await User.findByValidResetToken('tok123');

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/reset_token = \$1/);
    expect(sql).toMatch(/reset_token_expires > NOW\(\)/);
    expect(params).toEqual(['tok123']);
  });

  test('findByValidResetToken returns null for an unknown or expired token', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await expect(User.findByValidResetToken('bad-or-expired')).resolves.toBeNull();
  });

  test('findByValidResetToken returns the user when the token is valid and current', async () => {
    const user = { id: 1, email: 'a@b.com', role: 'member', name: 'A' };
    mockQuery.mockResolvedValue({ rows: [user] });
    await expect(User.findByValidResetToken('tok123')).resolves.toEqual(user);
  });

  test('updatePassword sets the new hash AND clears the reset token so it cannot be reused', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1, email: 'a@b.com' }] });

    await User.updatePassword(1, 'new-hash');

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/password_hash = \$1/);
    expect(sql).toMatch(/reset_token = NULL/);
    expect(sql).toMatch(/reset_token_expires = NULL/);
    expect(params).toEqual(['new-hash', 1]);
  });
});
