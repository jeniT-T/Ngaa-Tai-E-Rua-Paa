const mockQuery = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({ query: mockQuery })),
}));

const SiteSettings = require('../models/SiteSettings');

describe('SiteSettings.get', () => {
  beforeEach(() => mockQuery.mockReset());

  test('returns null when the singleton row does not exist yet (migration not run)', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await expect(SiteSettings.get()).resolves.toBeNull();
  });

  test('returns the settings row when it exists', async () => {
    const row = { id: 1, site_name: 'Nga Tai e Rua Pa' };
    mockQuery.mockResolvedValue({ rows: [row] });
    await expect(SiteSettings.get()).resolves.toEqual(row);
  });
});

describe('SiteSettings.update', () => {
  beforeEach(() => mockQuery.mockReset());

  test('only updates the field(s) actually provided -- a partial update, not a full overwrite', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1, site_name: 'New Name' }] });

    await SiteSettings.update({ siteName: 'New Name' });

    const [sql, values] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/SET site_name = \$1/);
    expect(sql).not.toMatch(/logo_url/);
    expect(values).toEqual(['New Name']);
  });

  test('JSON columns (mapPins/bookingTypes/bookingAreas) are stringified and cast to ::jsonb', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1 }] });
    const pins = [{ type: 'Wharenui', x: 50, y: 40 }];

    await SiteSettings.update({ mapPins: pins });

    const [sql, values] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/map_pins = \$1::jsonb/);
    expect(values[0]).toBe(JSON.stringify(pins));
  });

  test('updating several fields at once builds one SET clause per field with matching param positions', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1 }] });

    await SiteSettings.update({ siteName: 'New Name', whakapapaQuestionEnabled: false });

    const [sql, values] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/site_name = \$1/);
    expect(sql).toMatch(/whakapapa_question_enabled = \$2/);
    expect(values).toEqual(['New Name', false]);
  });

  test('calling update with no recognized fields is a no-op that just re-fetches the current row (no UPDATE runs)', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1, site_name: 'Unchanged' }] });

    const result = await SiteSettings.update({});

    expect(result).toEqual({ id: 1, site_name: 'Unchanged' });
    expect(mockQuery.mock.calls[0][0]).toMatch(/^SELECT \* FROM site_settings/);
  });
});


test('persists the configurable secondary colour', async () => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [{ secondary_colour: '#8134ab' }] });
  await SiteSettings.update({ secondaryColour: '#8134ab' });
  expect(mockQuery.mock.calls[0][0]).toContain('secondary_colour = $1');
  expect(mockQuery.mock.calls[0][1]).toEqual(['#8134ab']);
});
