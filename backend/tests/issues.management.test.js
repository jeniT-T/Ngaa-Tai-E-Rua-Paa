const express = require('express');
const request = require('supertest');
jest.mock('../middleware/requireAuth', () => (req, res, next) => {
  req.user = { id: 1, role: req.headers['x-role'] || 'member' }; next();
});
jest.mock('../models/Issue', () => ({ updateStatus: jest.fn(), delete: jest.fn() }));
const Issue = require('../models/Issue');
const app = express(); app.use(express.json()); app.use('/issues', require('../routes/issues'));
beforeEach(() => { jest.clearAllMocks(); Issue.updateStatus.mockResolvedValue({ id: 1, completion_notes: 'Fixed' }); Issue.delete.mockResolvedValue({ id: 1 }); });
test.each(['manager', 'caretaker', 'admin'])('%s can save completion notes without changing status', async (role) => {
  const res = await request(app).patch('/issues/1').set('x-role', role).send({ completionNotes: 'Fixed' });
  expect(res.status).toBe(200); expect(Issue.updateStatus).toHaveBeenCalledWith('1', undefined, 'Fixed');
});
test('invalid notes are rejected', async () => {
  expect((await request(app).patch('/issues/1').set('x-role', 'manager').send({ completionNotes: 2 })).status).toBe(400);
});
test.each(['manager', 'caretaker', 'admin'])('%s can delete issues', async (role) => {
  expect((await request(app).delete('/issues/1').set('x-role', role)).status).toBe(204);
});
test('member cannot delete issues', async () => {
  expect((await request(app).delete('/issues/1')).status).toBe(403); expect(Issue.delete).not.toHaveBeenCalled();
});
test('missing issue returns 404', async () => {
  Issue.delete.mockResolvedValue(null);
  expect((await request(app).delete('/issues/1').set('x-role', 'manager')).status).toBe(404);
});
