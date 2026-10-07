const request = require('supertest');
const express = require('express');
jest.mock('../middleware/requireAuth', () => (req, res, next) => { req.user = { id: 1, name: 'Member', role: req.headers['x-role'] || 'member' }; next(); });
jest.mock('../models/Checklist', () => ({ completionBookings: jest.fn(), getWithItems: jest.fn(), complete: jest.fn(), completions: jest.fn(), defaultTemplate: jest.fn(), saveDefaultTemplate: jest.fn(), findAll: jest.fn() }));
jest.mock('../models/ContentItem', () => ({ findById: jest.fn(), update: jest.fn() }));
const ContentItem = require('../models/ContentItem');
jest.mock('../models/Booking', () => ({}));
const Checklist = require('../models/Checklist');
const app = express(); app.use(express.json()); app.use('/checklists', require('../routes/checklists'));
beforeEach(() => {
  jest.clearAllMocks();
  Checklist.completionBookings.mockResolvedValue([{ id: 2 }]);
  Checklist.getWithItems.mockResolvedValue({ id: 3, booking_id: 2, title: 'Clean', assigned_roles: ['member'], items: [{ id: 4, text: 'Sweep' }] });
  Checklist.complete.mockResolvedValue({ id: 5 });
});
test('saves verified completion for an accessible booking', async () => {
  const res = await request(app).post('/checklists/3/complete').send({ bookingId: 2, checkedItemIds: [4] });
  expect(res.status).toBe(201);
  expect(Checklist.complete.mock.calls[0][0].user.name).toBe('Member');
});
test('cannot complete another booking', async () => {
  expect((await request(app).post('/checklists/3/complete').send({ bookingId: 9, checkedItemIds: [4] })).status).toBe(403);
  expect(Checklist.complete).not.toHaveBeenCalled();
});
test('incomplete checklist is rejected', async () => {
  expect((await request(app).post('/checklists/3/complete').send({ bookingId: 2, checkedItemIds: [] })).status).toBe(400);
});
test('unassigned role is rejected', async () => {
  expect((await request(app).post('/checklists/3/complete').set('x-role', 'manager').send({ bookingId: 2, checkedItemIds: [4] })).status).toBe(403);
});
test('duplicate completion is rejected', async () => {
  Checklist.complete.mockResolvedValue(null);
  expect((await request(app).post('/checklists/3/complete').send({ bookingId: 2, checkedItemIds: [4] })).status).toBe(409);
});

test('manager can edit the default cleaning steps', async () => {
  ContentItem.findById.mockResolvedValue({ id: 10, placement: 'arrival', category: 'cleaning', block_type: 'section', video_url: null, image_url: null });
  ContentItem.update.mockResolvedValue({ id: 10, body: 'Sweep' });
  const res = await request(app).patch('/checklists/default-template/10').set('x-role', 'manager').send({ body: 'Sweep' });
  expect(res.status).toBe(200);
  expect(ContentItem.update).toHaveBeenCalledWith(10, { body: 'Sweep', placement: 'arrival', videoUrl: null, imageUrl: null });
});
test('member cannot edit the default steps', async () => {
  expect((await request(app).patch('/checklists/default-template/10').send({ body: 'Sweep' })).status).toBe(403);
});
test('manager cannot edit unrelated guide content through the default editor', async () => {
  ContentItem.findById.mockResolvedValue({ id: 10, placement: 'arrival', category: 'kitchen', block_type: 'section' });
  expect((await request(app).patch('/checklists/default-template/10').set('x-role', 'manager').send({ body: 'Sweep' })).status).toBe(404);
});


test.each(['manager', 'caretaker', 'admin'])('%s can save the single-box default checklist', async (role) => {
  Checklist.saveDefaultTemplate.mockResolvedValue({ body: 'Sweep\nMop' });
  const res = await request(app).put('/checklists/default-template').set('x-role', role).send({ body: 'Sweep\nMop' });
  expect(res.status).toBe(200);
  expect(Checklist.saveDefaultTemplate).toHaveBeenCalledWith('Sweep\nMop');
});
test('member cannot change the single-box default checklist', async () => {
  expect((await request(app).put('/checklists/default-template').send({ body: 'Sweep' })).status).toBe(403);
});
test('empty default checklist cannot be saved', async () => {
  expect((await request(app).put('/checklists/default-template').set('x-role', 'manager').send({ body: '  ' })).status).toBe(400);
});
test('manager editing list includes checklists assigned to other roles', async () => {
  Checklist.findAll.mockResolvedValue([{ id: 1, assigned_roles: ['member'] }]);
  const res = await request(app).get('/checklists/manage').set('x-role', 'manager');
  expect(res.status).toBe(200);
  expect(Checklist.findAll).toHaveBeenCalledWith();
});
test('completion cannot be saved against a different booking', async () => {
  Checklist.getWithItems.mockResolvedValue({ id: 3, booking_id: 9, assigned_roles: ['member'], items: [{ id: 4 }] });
  expect((await request(app).post('/checklists/3/complete').send({ bookingId: 2, checkedItemIds: [4] })).status).toBe(400);
});
