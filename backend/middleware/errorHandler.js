// backend/middleware/errorHandler.js
// Last middleware in the app: turns any error that reaches Express into a JSON
// answer instead of the default HTML error page (code review CR-09).
//
// Errors with a 4xx status that mark themselves as safe to show (err.expose, as
// the body parser and the CORS check do) keep their message. Everything else is
// logged and the browser only sees a general message, so internal details such
// as SQL errors or file paths are not sent out.
// Express only treats a function as an error handler if it declares all four
// arguments, so `next` has to stay.
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = Number(err.status || err.statusCode) || 500;

  if (status >= 500 || status < 400) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong on the server' });
  }

  return res.status(status).json({
    error: err.expose ? err.message : 'The request could not be processed',
  });
}

module.exports = errorHandler;
