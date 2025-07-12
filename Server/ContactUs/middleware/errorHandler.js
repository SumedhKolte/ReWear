const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const status = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500 
    ? 'Something went wrong' 
    : err.message;

  res.status(status).json({ error: message });
};

module.exports = errorHandler;

