const request = require('supertest');
const express = require('express');

jest.mock('../middleware/requireAuth', () => (req, res, next) => {
  const header = req.headers['x-test-user'];
  req.user = header ? JSON.parse(header) : null;
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
});

jest.mock('../models/Booking', () => ({
  create: jest.fn(),
  findConflicts: jest.fn(),
  findById: jest.fn(),
  delete: jest.fn(),
  updateStatus: jest.fn(),
}));
jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));
jest.mock('../models/BookingReview', () => ({}));
jest.mock('../models/SiteSettings', () => ({
  get: jest.fn().mockResolvedValue({
    booking_types: [{ value: 'standard', label: 'Standard' }],
    booking_areas: [{ value: 'general', label: 'General' }],
  }),
}));
jest.mock('../utils/mailer', () => ({ sendEmail: jest.fn().mockResolvedValue(undefined) }));

const Booking = require('../models/Booking');
const User = require('../models/User');
const bookingsRouter = require('../routes/bookings');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/bookings', bookingsRouter);
  return app;
}

function asUser(user) {
  return { 'x-test-user': JSON.stringify(user) };
}

const validBody = {
  startDate: '2026-11-01',
  endDate: '2026-11-03',
  purpose: 'Family reunion',
  whakapapa: false,
};

describe('POST /api/bookings -- manager-only overrides', () => {
  const app = buildApp();

  beforeEach(() => {
    Booking.create.mockReset();
    Booking.findConflicts.mockReset();
    Booking.findConflicts.mockResolvedValue([]);
    User.findById.mockReset();
    Booking.create.mockResolvedValue({
      id: 1,
      status: 'pending',
      user_id: 1,
      start_date: '2026-11-01',
      end_date: '2026-11-03',
      area: 'general',
      booking_type: 'standard',
      purpose: 'x',
    });
  });

  test('a member always gets status "pending" and books only for themselves, even if they send status/userId', async () => {
    await request(app)
      .post('/api/bookings')
      .set(asUser({ id: 10, role: 'member' }))
      .send({ ...validBody, status: 'approved', userId: 999 }); // a member trying to fake these

    expect(Booking.create).toHaveBeenCalledTimes(1);
    const createArgs = Booking.create.mock.calls[0][0];
    expect(createArgs.status).toBe('pending');
    expect(createArgs.userId).toBe(10); // their own id -- userId in the body is ignored
    // Note: User.findById still gets called once here -- notifyRequester() looks the
    // requester up to send the confirmation email, for every booking regardless of role.
  });

  test('a manager can book on behalf of a customer by passing userId', async () => {
    User.findById.mockResolvedValue({ id: 55, email: 'customer@example.com', name: 'Customer' });

    await request(app)
      .post('/api/bookings')
      .set(asUser({ id: 2, role: 'manager' }))
      .send({ ...validBody, userId: 55 });

    expect(User.findById).toHaveBeenCalledWith(55);
    const createArgs = Booking.create.mock.calls[0][0];
    expect(createArgs.userId).toBe(55);
  });

  test('a manager can mark a booking approved immediately (phone/in-person booking)', async () => {
    await request(app)
      .post('/api/bookings')
      .set(asUser({ id: 2, role: 'manager' }))
      .send({ ...validBody, status: 'approved' });

    const createArgs = Booking.create.mock.calls[0][0];
    expect(createArgs.status).toBe('approved');
  });

  test('a manager\'s booking still defaults to "pending" when status is not specified', async () => {
    await request(app)
      .post('/api/bookings')
      .set(asUser({ id: 2, role: 'manager' }))
      .send({ ...validBody });

    const createArgs = Booking.create.mock.calls[0][0];
    expect(createArgs.status).toBe('pending');
  });

  test('rejects an invalid status value even from a manager', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set(asUser({ id: 2, role: 'manager' }))
      .send({ ...validBody, status: 'denied-by-the-client' });

    expect(res.status).toBe(400);
    expect(Booking.create).not.toHaveBeenCalled();
  });

  test("responds 400 when a manager books for a customer id that doesn't exist", async () => {
    User.findById.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/bookings')
      .set(asUser({ id: 2, role: 'manager' }))
      .send({ ...validBody, userId: 999999 });

    expect(res.status).toBe(400);
    expect(Booking.create).not.toHaveBeenCalled();
  });
});


describe('DELETE /api/bookings/:id', () => {
  const app = buildApp();
  beforeEach(() => {
    Booking.findById.mockReset();
    Booking.delete.mockReset();
    Booking.findById.mockResolvedValue({ id: 1 });
    Booking.delete.mockResolvedValue({ id: 1 });
  });

  test.each(['pending', 'approved', 'denied', 'cancelled'])('manager permanently deletes a %s booking', async (status) => {
    Booking.findById.mockResolvedValue({ id: 1, status, end_date: '2099-01-01' });
    const res = await request(app).delete('/api/bookings/1').set(asUser({ id: 2, role: 'manager' }));
    expect(res.status).toBe(204);
    expect(Booking.delete).toHaveBeenCalledWith('1');
  });

  test.each(['member', 'caretaker', 'admin'])('%s cannot delete bookings', async (role) => {
    const res = await request(app).delete('/api/bookings/1').set(asUser({ id: 2, role }));
    expect(res.status).toBe(403);
    expect(Booking.delete).not.toHaveBeenCalled();
  });

  test('unauthenticated deletion is rejected', async () => {
    expect((await request(app).delete('/api/bookings/1')).status).toBe(401);
  });

  test('booking removed by another request returns 404', async () => {
    Booking.delete.mockResolvedValue(null);
    const res = await request(app).delete('/api/bookings/1').set(asUser({ id: 2, role: 'manager' }));
    expect(res.status).toBe(404);
  });

  test('missing booking returns 404', async () => {
    Booking.findById.mockResolvedValue(null);
    const res = await request(app).delete('/api/bookings/1').set(asUser({ id: 2, role: 'manager' }));
    expect(res.status).toBe(404);
    expect(Booking.delete).not.toHaveBeenCalled();
  });

  test('invalid ID is rejected', async () => {
    const res = await request(app).delete('/api/bookings/invalid').set(asUser({ id: 2, role: 'manager' }));
    expect(res.status).toBe(400);
    expect(Booking.delete).not.toHaveBeenCalled();
  });
});


describe('Reset booking status to pending', () => {
  const app = buildApp();
  beforeEach(() => Booking.updateStatus.mockReset());

  test('manager can return a booking to pending', async () => {
    Booking.updateStatus.mockResolvedValue({ id: 1, status: 'pending' });
    const res = await request(app).patch('/api/bookings/1/status')
      .set(asUser({ id: 2, role: 'manager' })).send({ status: 'pending' });
    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('pending');
    expect(Booking.updateStatus).toHaveBeenCalledWith('1', 'pending', undefined);
  });

  test('member cannot reset booking status', async () => {
    const res = await request(app).patch('/api/bookings/1/status')
      .set(asUser({ id: 2, role: 'member' })).send({ status: 'pending' });
    expect(res.status).toBe(403);
    expect(Booking.updateStatus).not.toHaveBeenCalled();
  });
});


describe('GET /api/bookings/conflicts', () => {
  const app = buildApp();
  beforeEach(() => { Booking.findConflicts.mockReset(); Booking.findConflicts.mockResolvedValue([{ id: 8 }]); });
  test('manager can check overlaps while excluding the booking being approved', async () => {
    const res = await request(app).get('/api/bookings/conflicts?startDate=2026-11-01&endDate=2026-11-03&area=general&excludeId=2').set(asUser({ id: 1, role: 'manager' }));
    expect(res.status).toBe(200);
    expect(res.body.conflicts).toEqual([{ id: 8 }]);
    expect(Booking.findConflicts).toHaveBeenCalledWith({ startDate: '2026-11-01', endDate: '2026-11-03', area: 'general', excludeId: '2' });
  });
  test('members cannot access customer conflict details', async () => {
    const res = await request(app).get('/api/bookings/conflicts').set(asUser({ id: 1, role: 'member' }));
    expect(res.status).toBe(403);
    expect(Booking.findConflicts).not.toHaveBeenCalled();
  });
  test('reversed dates are rejected', async () => {
    const res = await request(app).get('/api/bookings/conflicts?startDate=2026-11-03&endDate=2026-11-01&area=general').set(asUser({ id: 1, role: 'manager' }));
    expect(res.status).toBe(400);
  });
});

describe('Server-side overlap check when a booking is approved (CR-01)', () => {
  const app = buildApp();
  const manager = { id: 2, role: 'manager' };
  const clash = [{ id: 8, requester_name: 'Aroha', start_date: '2026-11-02', end_date: '2026-11-04', area: 'general' }];
  const stored = { id: 5, status: 'pending', start_date: '2026-11-01', end_date: '2026-11-03', area: 'general' };

  beforeEach(() => {
    Booking.findById.mockReset();
    Booking.findConflicts.mockReset();
    Booking.updateStatus.mockReset();
    Booking.create.mockReset();
    Booking.findById.mockResolvedValue(stored);
    Booking.updateStatus.mockResolvedValue({ ...stored, status: 'approved' });
    Booking.create.mockResolvedValue({ ...stored, status: 'approved', user_id: 1 });
  });

  test('approving a booking that overlaps an approved one is refused with 409 and the clashes', async () => {
    Booking.findConflicts.mockResolvedValue(clash);
    const res = await request(app).patch('/api/bookings/5/status').set(asUser(manager)).send({ status: 'approved' });
    expect(res.status).toBe(409);
    expect(res.body.conflicts).toEqual(clash);
    expect(Booking.updateStatus).not.toHaveBeenCalled();
  });

  test('the check uses the stored dates and area and excludes the booking itself', async () => {
    Booking.findConflicts.mockResolvedValue([]);
    await request(app).patch('/api/bookings/5/status').set(asUser(manager)).send({ status: 'approved' });
    expect(Booking.findConflicts).toHaveBeenCalledWith({ startDate: '2026-11-01', endDate: '2026-11-03', area: 'general', excludeId: 5 });
  });

  test('a Date object from the database is turned into a local YYYY-MM-DD string', async () => {
    Booking.findById.mockResolvedValue({ ...stored, start_date: new Date(2026, 10, 1), end_date: new Date(2026, 10, 3) });
    Booking.findConflicts.mockResolvedValue([]);
    await request(app).patch('/api/bookings/5/status').set(asUser(manager)).send({ status: 'approved' });
    const args = Booking.findConflicts.mock.calls[0][0];
    expect(args.startDate).toBe('2026-11-01');
    expect(args.endDate).toBe('2026-11-03');
  });

  test('approving with no overlap succeeds', async () => {
    Booking.findConflicts.mockResolvedValue([]);
    const res = await request(app).patch('/api/bookings/5/status').set(asUser(manager)).send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(Booking.updateStatus).toHaveBeenCalledWith('5', 'approved', undefined);
  });

  test('a manager can approve anyway with overrideConflicts: true, and no check is made', async () => {
    Booking.findConflicts.mockResolvedValue(clash);
    const res = await request(app).patch('/api/bookings/5/status').set(asUser(manager)).send({ status: 'approved', overrideConflicts: true });
    expect(res.status).toBe(200);
    expect(Booking.findConflicts).not.toHaveBeenCalled();
    expect(Booking.updateStatus).toHaveBeenCalled();
  });

  test('a truthy string does not count as an override', async () => {
    Booking.findConflicts.mockResolvedValue(clash);
    const res = await request(app).patch('/api/bookings/5/status').set(asUser(manager)).send({ status: 'approved', overrideConflicts: 'true' });
    expect(res.status).toBe(409);
  });

  test('denying or returning a booking to pending does not run the overlap check', async () => {
    Booking.findConflicts.mockResolvedValue(clash);
    await request(app).patch('/api/bookings/5/status').set(asUser(manager)).send({ status: 'denied' });
    await request(app).patch('/api/bookings/5/status').set(asUser(manager)).send({ status: 'pending' });
    expect(Booking.findConflicts).not.toHaveBeenCalled();
    expect(Booking.updateStatus).toHaveBeenCalledTimes(2);
  });

  test('approving a booking that does not exist returns 404', async () => {
    Booking.findById.mockResolvedValue(null);
    const res = await request(app).patch('/api/bookings/99/status').set(asUser(manager)).send({ status: 'approved' });
    expect(res.status).toBe(404);
    expect(Booking.updateStatus).not.toHaveBeenCalled();
  });

  test('a member still cannot approve, and no check runs', async () => {
    const res = await request(app).patch('/api/bookings/5/status').set(asUser({ id: 3, role: 'member' })).send({ status: 'approved' });
    expect(res.status).toBe(403);
    expect(Booking.findConflicts).not.toHaveBeenCalled();
  });

  test('a manager creating an already-approved booking that overlaps is refused with 409', async () => {
    Booking.findConflicts.mockResolvedValue(clash);
    const res = await request(app).post('/api/bookings').set(asUser(manager)).send({ ...validBody, status: 'approved' });
    expect(res.status).toBe(409);
    expect(res.body.conflicts).toEqual(clash);
    expect(Booking.create).not.toHaveBeenCalled();
  });

  test('a manager can create the overlapping approved booking with overrideConflicts: true', async () => {
    Booking.findConflicts.mockResolvedValue(clash);
    const res = await request(app).post('/api/bookings').set(asUser(manager)).send({ ...validBody, status: 'approved', overrideConflicts: true });
    expect(res.status).toBe(201);
    expect(Booking.create).toHaveBeenCalled();
  });

  test('a booking created as pending is never checked (the manager reviews it later)', async () => {
    Booking.findConflicts.mockResolvedValue(clash);
    const res = await request(app).post('/api/bookings').set(asUser(manager)).send({ ...validBody });
    expect(res.status).toBe(201);
    expect(Booking.findConflicts).not.toHaveBeenCalled();
  });

  test('a member cannot skip the check by sending status approved and the override flag', async () => {
    Booking.create.mockResolvedValue({ ...stored, status: 'pending', user_id: 3 });
    const res = await request(app).post('/api/bookings').set(asUser({ id: 3, role: 'member' })).send({ ...validBody, status: 'approved', overrideConflicts: true });
    expect(res.status).toBe(201);
    expect(Booking.create.mock.calls[0][0].status).toBe('pending');
  });
});
