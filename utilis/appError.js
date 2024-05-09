// OPERATIONAL ERROR
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // by this we sent the message property to incoming request
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
// stacks trace
module.exports = AppError;
