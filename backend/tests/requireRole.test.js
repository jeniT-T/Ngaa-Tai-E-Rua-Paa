const requireRole = require('../middleware/requireRole');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('requireRole middleware', () => {
  test('rejects with 401 when req.user is missing (no session at all)', () => {
    const middleware = requireRole('admin');
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects with 403 when the user is logged in but has the wrong role', () => {
    const middleware = requireRole('manager', 'admin');
    const req = { user: { id: 1, role: 'member' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: insufficient permissions' });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() exactly once when the user role is in the allowed list', () => {
    const middleware = requireRole('manager', 'admin');
    const req = { user: { id: 1, role: 'manager' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('supports a single allowed role, e.g. requireRole("admin")', () => {
    const middleware = requireRole('admin');
    const req = { user: { id: 7, role: 'caretaker' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('is role-exact, not a privilege hierarchy (admin is not auto-allowed on a manager-only route)', () => {
    const middleware = requireRole('manager');
    const req = { user: { id: 3, role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    // By design (see the project notes: admin was deliberately reduced to
    // content-only) admin does NOT automatically pass a manager-only gate
    // unless it's explicitly listed.
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
