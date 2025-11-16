import logger from '../utils/logger.js';

// 개발 환경 에러 처리
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// 프로덕션 환경 에러 처리
const sendErrorProd = (err, res) => {
  // 운영 에러: 신뢰할 수 있는 에러 - 클라이언트에게 메시지 전송
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } 
  // 프로그래밍 에러: 세부 정보 누출하지 않음
  else {
    // 에러 로깅
    logger.error('ERROR 💥', err);

    // 일반 메시지 전송
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

// MongoDB 오류 처리
const handleMongoError = (err) => {
  let error = { ...err };
  error.message = err.message;

  // 중복 필드 오류
  if (err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    error = {
      message,
      statusCode: 400,
      status: 'fail',
      isOperational: true
    };
  }

  // 유효성 오류
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    error = {
      message,
      statusCode: 400,
      status: 'fail',
      isOperational: true
    };
  }

  // Cast 오류 (잘못된 ID)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}.`;
    error = {
      message,
      statusCode: 400,
      status: 'fail',
      isOperational: true
    };
  }

  return error;
};

// JWT 오류 처리
const handleJWTError = () => ({
  message: 'Invalid token. Please log in again!',
  statusCode: 401,
  status: 'fail',
  isOperational: true
});

const handleJWTExpiredError = () => ({
  message: 'Your token has expired! Please log in again.',
  statusCode: 401,
  status: 'fail',
  isOperational: true
});

// 글로벌 에러 처리 미들웨어
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // 에러 로깅
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?._id
  });

  let error = { ...err };
  error.message = err.message;

  // MongoDB 관련 오류 처리
  if (error.name?.startsWith('Mongo')) {
    error = handleMongoError(error);
  }

  // JWT 관련 오류 처리
  if (error.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  if (error.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // 환경별 에러 응답
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

export default errorHandler;