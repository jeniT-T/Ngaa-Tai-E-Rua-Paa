const mockQuery = jest.fn();
const mockRelease = jest.fn();
jest.mock('pg', () => ({ Pool: jest.fn(() => ({ connect: async () => ({ query: mockQuery, release: mockRelease }) })) }));
const User = require('../models/User');
beforeEach(() => { mockQuery.mockReset(); mockRelease.mockReset(); });
test('deletion preserves shared records and commits', async () => {
  mockQuery.mockResolvedValue({ rows: [{ id: 3, table_name: 'exists' }] });
  expect(await User.delete(3)).toEqual({ id: 3, table_name: 'exists' });
  const statements = mockQuery.mock.calls.map(([sql]) => sql);
  expect(statements).toContain('UPDATE equipment_items SET created_by = NULL WHERE created_by = $1');
  expect(statements).toContain('UPDATE booking_reviews SET manager_reviewed_by = NULL WHERE manager_reviewed_by = $1');
  expect(statements).toContain('DELETE FROM users WHERE id = $1 RETURNING id');
  expect(statements.at(-1)).toBe('COMMIT');
  expect(mockRelease).toHaveBeenCalled();
});
test('missing account rolls back without deleting', async () => {
  mockQuery.mockResolvedValue({ rows: [] });
  expect(await User.delete(3)).toBeNull();
  expect(mockQuery).toHaveBeenLastCalledWith('ROLLBACK');
  expect(mockRelease).toHaveBeenCalled();
});
test('failed deletion rolls back and releases connection', async () => {
  mockQuery.mockResolvedValue({ rows: [{ id: 3 }] });
  mockQuery.mockRejectedValueOnce(new Error('failed'));
  await expect(User.delete(3)).rejects.toThrow('failed');
  expect(mockQuery).toHaveBeenLastCalledWith('ROLLBACK');
  expect(mockRelease).toHaveBeenCalled();
});

test('deletion works when optional feature tables have not been migrated', async () => {
  mockQuery.mockImplementation(async (sql) => sql.includes('to_regclass')
    ? { rows: [{ table_name: null }] }
    : { rows: [{ id: 3 }] });
  expect(await User.delete(3)).toEqual({ id: 3 });
  expect(mockQuery.mock.calls.some(([sql]) => sql.startsWith('UPDATE '))).toBe(false);
  expect(mockQuery).toHaveBeenLastCalledWith('COMMIT');
});
