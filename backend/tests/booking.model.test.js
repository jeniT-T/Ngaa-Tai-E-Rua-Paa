const mockQuery = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: mockQuery,
  })),
}));

const Booking = require('../models/Booking');

describe('Booking.create', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  test('defaults status to "pending" when not provided (normal self-serve request)', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1, status: 'pending' }] });

    await Booking.create({
      userId: 5,
      startDate: '2026-11-01',
      endDate: '2026-11-03',
      purpose: 'Family reunion',
    });

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO bookings/i);
    expect(params[0]).toBe(5);
    expect(params[8]).toBe('pending');
  });

  test('uses the manager-supplied status ("approved") when explicitly passed', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 2, status: 'approved' }] });

    await Booking.create({
      userId: 9,
      startDate: '2026-12-01',
      endDate: '2026-12-02',
      purpose: 'Phone booking taken by manager',
      status: 'approved',
    });

    const params = mockQuery.mock.calls[0][1];
    expect(params[8]).toBe('approved');
  });

  test('generates a unique, unguessable guest_access_token on every call', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 3 }] });

    await Booking.create({ userId: 1, startDate: '2026-11-01', endDate: '2026-11-02', purpose: 'A' });
    await Booking.create({ userId: 1, startDate: '2026-11-03', endDate: '2026-11-04', purpose: 'B' });

    const token1 = mockQuery.mock.calls[0][1][7];
    const token2 = mockQuery.mock.calls[1][1][7];
    expect(token1).toHaveLength(48); // crypto.randomBytes(24).toString('hex')
    expect(token1).not.toEqual(token2);
  });

  test('defaults bookingType/area/whakapapa when the caller omits them', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 4 }] });

    await Booking.create({ userId: 1, startDate: '2026-11-01', endDate: '2026-11-02', purpose: 'A' });

    const params = mockQuery.mock.calls[0][1];
    expect(params[4]).toBe('standard'); // booking_type
    expect(params[5]).toBe(false); // whakapapa
    expect(params[6]).toBe('general'); // area
  });

  test('returns the row Postgres hands back (RETURNING *)', async () => {
    const fakeRow = { id: 10, status: 'pending' };
    mockQuery.mockResolvedValue({ rows: [fakeRow] });

    const result = await Booking.create({ userId: 1, startDate: '2026-11-01', endDate: '2026-11-02', purpose: 'A' });

    expect(result).toEqual(fakeRow);
  });
});

describe('Booking.findCurrentlyOnSite (backs the generic guest-signage QR code)', () => {
  beforeEach(() => mockQuery.mockReset());

  test('returns null when no approved booking covers today', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const result = await Booking.findCurrentlyOnSite();
    expect(result).toBeNull();
  });

  test('returns the booking when one is currently on-site, using a stricter date check than the other "active" helpers', async () => {
    const fakeRow = { id: 1, start_date: '2026-10-01', end_date: '2026-10-10' };
    mockQuery.mockResolvedValue({ rows: [fakeRow] });
    const result = await Booking.findCurrentlyOnSite();
    expect(result).toEqual(fakeRow);
    expect(mockQuery.mock.calls[0][0]).toMatch(/start_date <= CURRENT_DATE/);
    expect(mockQuery.mock.calls[0][0]).toMatch(/end_date >= CURRENT_DATE/);
  });
});


describe('Booking.delete', () => {
  beforeEach(() => mockQuery.mockReset());
  test('permanently deletes the selected booking regardless of its dates', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 7 }] });
    expect(await Booking.delete(7)).toEqual({ id: 7 });
    const [sql, values] = mockQuery.mock.calls[0];
    expect(sql).toContain('DELETE FROM bookings');
    expect(sql).toContain("WHERE id = $1");
    expect(sql).not.toContain("end_date <");
    expect(values).toEqual([7]);
  });
  test('returns null if the booking is missing', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    expect(await Booking.delete(7)).toBeNull();
  });
});


test('conflict checks use inclusive dates, approved status, area and whole-Paa overlap', async () => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [] });
  await Booking.findConflicts({ startDate: '2026-11-01', endDate: '2026-11-03', area: 'general', excludeId: 2 });
  const [sql, values] = mockQuery.mock.calls[0];
  expect(sql).toContain("b.status = 'approved'");
  expect(sql).toContain('b.start_date <= $2::date AND b.end_date >= $1::date');
  expect(sql).toContain("b.area = $3 OR b.area = 'paa' OR $3 = 'paa'");
  expect(sql).toContain('b.id <> $4');
  expect(values).toEqual(['2026-11-01', '2026-11-03', 'general', 2]);
});
