const mockQuery = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({ query: mockQuery })),
}));

const ContentItem = require('../models/ContentItem');

describe('ContentItem.create', () => {
  beforeEach(() => mockQuery.mockReset());

  test('applies sensible defaults when optional fields are omitted', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1 }] });

    await ContentItem.create({ title: 'T', body: 'B', createdBy: 1 });

    // params: title, body, category, visible_to_roles, created_by, placement, block_type, video_url, image_url
    const params = mockQuery.mock.calls[0][1];
    expect(params[2]).toBe('general');
    expect(params[3]).toEqual(['member', 'caretaker', 'admin']);
    expect(params[5]).toBeNull(); // placement -> library-only item
    expect(params[6]).toBe('section');
    expect(params[7]).toBeNull();
    expect(params[8]).toBeNull();
  });

  test('uses the caller-supplied placement/blockType/videoUrl/imageUrl/visibleToRoles when given', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 2 }] });

    await ContentItem.create({
      title: 'T', body: 'B', createdBy: 1,
      placement: 'home', blockType: 'heading',
      videoUrl: 'https://youtu.be/abc', imageUrl: '/uploads/x.png',
      visibleToRoles: ['admin'],
    });

    const params = mockQuery.mock.calls[0][1];
    expect(params[3]).toEqual(['admin']);
    expect(params[5]).toBe('home');
    expect(params[6]).toBe('heading');
    expect(params[7]).toBe('https://youtu.be/abc');
    expect(params[8]).toBe('/uploads/x.png');
  });
});

describe('ContentItem.update', () => {
  beforeEach(() => mockQuery.mockReset());

  test('title/body/category/visibleToRoles/blockType fall back to the existing value (COALESCE) when omitted', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 5 }] });

    await ContentItem.update(5, {});

    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/title = COALESCE\(\$1, title\)/);
    expect(sql).toMatch(/body = COALESCE\(\$2, body\)/);
    expect(sql).toMatch(/category = COALESCE\(\$3, category\)/);
    expect(sql).toMatch(/visible_to_roles = COALESCE\(\$4, visible_to_roles\)/);
    expect(sql).toMatch(/block_type = COALESCE\(\$6, block_type\)/);
  });

  test('placement/videoUrl/imageUrl are written as-given, NOT coalesced -- so an admin can deliberately clear them', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 5, placement: null, video_url: null, image_url: null }] });

    await ContentItem.update(5, { placement: null, videoUrl: null, imageUrl: null });

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/placement = \$5(?!::)/); // written as-given
    expect(sql).not.toMatch(/placement = COALESCE/);
    expect(sql).toMatch(/video_url = \$7/);
    expect(sql).toMatch(/image_url = \$8/);
    // the nulls really do get sent through -- clearing isn't silently dropped
    expect(params[4]).toBeNull();
    expect(params[6]).toBeNull();
    expect(params[7]).toBeNull();
  });
});

describe('ContentItem.copy', () => {
  beforeEach(() => mockQuery.mockReset());

  test('returns null when the item to copy does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // the findById lookup inside copy()
    const result = await ContentItem.copy(999, {});
    expect(result).toBeNull();
  });

  test('duplicates the item with a "(Copy)" title suffix, keeping the original category by default', async () => {
    const original = {
      id: 1, title: 'Scrambled Eggs', body: 'B', category: 'general',
      visible_to_roles: ['member'], created_by: 1, placement: 'arrival',
      block_type: 'section', video_url: null, image_url: null,
    };
    mockQuery
      .mockResolvedValueOnce({ rows: [original] }) // findById
      .mockResolvedValueOnce({ rows: [{ id: 2, title: 'Scrambled Eggs (Copy)' }] }); // insert

    const result = await ContentItem.copy(1, {});

    const insertParams = mockQuery.mock.calls[1][1];
    expect(insertParams[0]).toBe('Scrambled Eggs (Copy)');
    expect(insertParams[2]).toBe('general'); // original category kept, no override given
    expect(result).toEqual({ id: 2, title: 'Scrambled Eggs (Copy)' });
  });

  test('duplicates into a different category when one is explicitly supplied', async () => {
    const original = {
      id: 1, title: 'X', body: 'B', category: 'general', visible_to_roles: ['member'],
      created_by: 1, placement: null, block_type: 'section', video_url: null, image_url: null,
    };
    mockQuery
      .mockResolvedValueOnce({ rows: [original] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] });

    await ContentItem.copy(1, { category: 'leaving' });

    const insertParams = mockQuery.mock.calls[1][1];
    expect(insertParams[2]).toBe('leaving');
  });
});

describe('ContentItem.findVisibleToRole', () => {
  beforeEach(() => mockQuery.mockReset());

  test("always filters by the user's role being in visible_to_roles", async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await ContentItem.findVisibleToRole('member', {});
    const [sql, values] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/\$1 = ANY\(visible_to_roles\)/);
    expect(values).toEqual(['member']);
  });

  test('adds a title/body search condition only when search text is given', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await ContentItem.findVisibleToRole('member', { search: 'recipe' });
    const [sql, values] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/ILIKE \$2/);
    expect(values).toEqual(['member', '%recipe%']);
  });

  test('adds a category condition only when a category is given', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await ContentItem.findVisibleToRole('member', { category: 'general' });
    const [sql, values] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/category = \$2/);
    expect(values).toEqual(['member', 'general']);
  });
});
