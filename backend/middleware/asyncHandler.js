// Wraps an async controller so we don't need try/catch in every function.
// Any thrown error is forwarded to the error handler.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
