const mockPoolQuery = jest.fn();
const mockClientQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn().mockResolvedValue({
  query: mockClientQuery,
  release: mockRelease,
});

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: mockPoolQuery,
    connect: mockConnect,
  })),
}));

const Checklist = require('../models/Checklist');

describe('Checklist.create', () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockClientQuery.mockReset();
    mockRelease.mockClear();
    mockConnect.mockClear();
  });

  test('inserts the checklist then each non-blank item, inside BEGIN/COMMIT, and releases the client', async () => {
    mockClientQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 42 }] }) // INSERT checklist
      .mockResolvedValueOnce() // INSERT item 1
      .mockResolvedValueOnce() // INSERT item 2
      .mockResolvedValueOnce(); // COMMIT

    const id = await Checklist.create({
      title: 'Opening',
      description: 'Morning routine',
      assignedRoles: ['member', 'caretaker'],
      createdBy: 7,
      items: ['Unlock gate', '   ', 'Turn on lights'], // blank item must be skipped
    });

    expect(id).toBe(42);
    expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(mockClientQuery.mock.calls[1][0]).toContain('assigned_roles');
    expect(mockClientQuery.mock.calls[1][1]).toEqual(['Opening', 'Morning routine', ['member', 'caretaker'], 7]);
    expect(mockClientQuery.mock.calls[mockClientQuery.mock.calls.length - 1][0]).toBe('COMMIT');

    const itemInserts = mockClientQuery.mock.calls.filter(
      ([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO checklist_items')
    );
    expect(itemInserts).toHaveLength(2); // the blank one was skipped
    expect(itemInserts[0][1]).toEqual([42, 'Unlock gate', 0]);
    expect(itemInserts[1][1]).toEqual([42, 'Turn on lights', 2]); // raw array index, blanks still consume a slot
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  test('rolls back and still releases the client if an insert fails partway through', async () => {
    mockClientQuery
      .mockResolvedValueOnce() // BEGIN
      .mockRejectedValueOnce(new Error('db exploded')); // INSERT checklist fails

    await expect(
      Checklist.create({ title: 'Closing', createdBy: 1, items: [] })
    ).rejects.toThrow('db exploded');

    expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });
});

describe('Checklist.findAll', () => {
  beforeEach(() => mockPoolQuery.mockReset());

  test('filters checklists by assigned user roles when provided', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [] });

    await Checklist.findAll(['member']);

    expect(mockPoolQuery.mock.calls[0][0]).toContain('c.assigned_roles && $1::text[]');
    expect(mockPoolQuery.mock.calls[0][1]).toEqual([['member'], null, null]);
  });

  test('returns all checklists when no role filter is provided', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [] });

    await Checklist.findAll();

    expect(mockPoolQuery.mock.calls[0][1]).toEqual([null, null, null]);
  });
});

describe('Checklist.addItem', () => {
  beforeEach(() => mockPoolQuery.mockReset());

  test('places a new item at the end of the list (MAX(position) + 1) and trims whitespace', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ next: 3 }] }) // position lookup
      .mockResolvedValueOnce({ rows: [{ id: 99, position: 3 }] }); // insert

    const item = await Checklist.addItem(5, '  Lock the wharekai  ');

    expect(item).toEqual({ id: 99, position: 3 });
    const insertCall = mockPoolQuery.mock.calls[1];
    expect(insertCall[1]).toEqual([5, 'Lock the wharekai', 3]);
  });

  test('starts a brand-new (empty) checklist at position 0', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ next: 0 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, position: 0 }] });

    await Checklist.addItem(1, 'First step');

    expect(mockPoolQuery.mock.calls[1][1][2]).toBe(0);
  });
});

describe('Checklist.deleteItem / Checklist.delete', () => {
  beforeEach(() => mockPoolQuery.mockReset());

  test('deleteItem returns true when a row was actually deleted', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [{ id: 1 }] });
    await expect(Checklist.deleteItem(1)).resolves.toBe(true);
  });

  test('deleteItem returns false when nothing matched that id (already gone / wrong id)', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [] });
    await expect(Checklist.deleteItem(999)).resolves.toBe(false);
  });

  test('delete (a whole checklist) returns false when the checklist does not exist', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [] });
    await expect(Checklist.delete(999)).resolves.toBe(false);
  });
});

describe('Checklist.itemBelongsToChecklist', () => {
  beforeEach(() => mockPoolQuery.mockReset());

  test('returns false when the item belongs to a different checklist (stops cross-checklist edits via a guessed item id)', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [] });
    await expect(Checklist.itemBelongsToChecklist(1, 2)).resolves.toBe(false);
  });

  test('returns true when the item really does belong to that checklist', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [{ id: 1 }] });
    await expect(Checklist.itemBelongsToChecklist(1, 2)).resolves.toBe(true);
  });
});
