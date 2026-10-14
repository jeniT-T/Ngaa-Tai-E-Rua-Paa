const errorHandler = require('../middleware/errorHandler');

function mockRes() {
  const res = { headersSent: false };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler middleware (CR-09)', () => {
  let consoleError;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  test('an unexpected error becomes a 500 with a general message and is logged', () => {
    const res = mockRes();

    errorHandler(new Error('relation "users" does not exist'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Something went wrong on the server' });
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  test('an error with a 4xx status that is safe to show keeps its message', () => {
    const res = mockRes();
    const err = Object.assign(new Error('Origin http://evil.example is not allowed by CORS'), {
      status: 403,
      expose: true,
    });

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Origin http://evil.example is not allowed by CORS' });
  });

  test('a 4xx error that is not marked safe gets a general message', () => {
    const res = mockRes();

    errorHandler(Object.assign(new Error('internal detail'), { status: 400 }), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'The request could not be processed' });
  });

  test('passes the error on when the response has already started', () => {
    const res = mockRes();
    res.headersSent = true;
    const next = jest.fn();
    const err = new Error('too late');

    errorHandler(err, {}, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });
});
