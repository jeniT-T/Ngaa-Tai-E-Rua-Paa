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
