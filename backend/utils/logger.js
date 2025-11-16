import winston from 'winston';
import 'winston-daily-rotate-file';

// 로그 포맷 설정
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 콘솔 포맷 (개발 환경용)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.simple()
);

// 로거 생성
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'deepsignal-backend' },
  transports: [
    // 콘솔 출력 (개발 환경)
    new winston.transports.Console({
      format: consoleFormat
    }),

    // 파일 출력 - 모든 로그
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),

    // 파일 출력 - 에러만
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    })
  ],

  // 예외 처리
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: 'logs/exceptions.log' 
    })
  ],

  // 프로미스 리젝션 처리
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: 'logs/rejections.log' 
    })
  ]
});

// 스트림 생성 (Morgan과 함께 사용)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

export default logger;