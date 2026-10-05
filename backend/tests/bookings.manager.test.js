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
