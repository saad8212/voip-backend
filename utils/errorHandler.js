class CustomError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (res, error) => {
  console.error('Error:', error);

  if (error instanceof CustomError) {
    return res.status(error.statusCode).json({
      success: false,
      status: error.status,
      message: error.message
    });
  }

  // Handle Twilio specific errors
  if (error.code) {
    return res.status(400).json({
      success: false,
      status: 'fail',
      code: error.code,
      message: error.message
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: 'Validation Error',
      errors
    });
  }

  // Handle duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: `Duplicate value for ${field}`
    });
  }

  // Handle other errors
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Internal Server Error'
  });
};

module.exports = {
  CustomError,
  errorHandler
};
