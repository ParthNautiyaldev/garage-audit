export function notFound(_req, _res, next) {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
}

export function errorHandler(err, _req, res, _next) {
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That value is already in use' });
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((item) => item.message).join(' ');
    return res.status(400).json({ message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 ? 'Something went wrong' : err.message,
  });
}
