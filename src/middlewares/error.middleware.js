const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    message,
  });
};

module.exports = errorMiddleware;
