const express = require('express');
const request = require('supertest');
jest.mock('../middleware/requireAuth', () => (req, res, next) => {
  req.user = req.headers['x-test-user'] ? JSON.parse(req.headers['x-test-user']) : null;
  if (!req.user) return res.status(401).send();
  next();
});
jest.mock('../models/User', () => ({ delete: jest.fn() }));
const User = require('../models/User');
const app = express();
app.use('/api/admin', require('../routes/admin'));
const manager = { 'x-test-user': JSON.stringify({ id: 5, role: 'manager' }) };

beforeEach(() => { User.delete.mockReset(); User.delete.mockResolvedValue({ id: 3 }); });
test('manager can delete another account', async () => {
  expect((await request(app).delete('/api/admin/users/3').set(manager)).status).toBe(204);
  expect(User.delete).toHaveBeenCalledWith('3');
});
test('manager cannot delete their own account', async () => {
  expect((await request(app).delete('/api/admin/users/5').set(manager)).status).toBe(403);
  expect(User.delete).not.toHaveBeenCalled();
});
test.each(['member', 'admin', 'caretaker'])('%s cannot delete users', async (role) => {
  expect((await request(app).delete('/api/admin/users/3').set({ 'x-test-user': JSON.stringify({ id: 1, role }) })).status).toBe(403);
  expect(User.delete).not.toHaveBeenCalled();
});
test('missing user returns 404', async () => {
  User.delete.mockResolvedValue(null);
  expect((await request(app).delete('/api/admin/users/3').set(manager)).status).toBe(404);
});
test('invalid ID is rejected', async () => {
  expect((await request(app).delete('/api/admin/users/invalid').set(manager)).status).toBe(400);
  expect(User.delete).not.toHaveBeenCalled();
});
test('anonymous caller cannot delete users', async () => {
  expect((await request(app).delete('/api/admin/users/3')).status).toBe(401);
});
