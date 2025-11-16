import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// JWT 인증 미들웨어
export const protect = async (req, res, next) => {
  try {
    let token;

    // 헤더에서 토큰 추출
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // 쿠키에서 토큰 추출
    else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access.'
      });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 현재 사용자 정보 조회
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // 사용자 비활성화 확인
    if (!currentUser.active) {
      return res.status(401).json({
        status: 'error',
        message: 'User account has been deactivated.'
      });
    }

    // 요청 객체에 사용자 정보 추가
    req.user = currentUser;
    next();

  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Your token has expired. Please log in again.'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};

// 역할 기반 접근 제어
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// API 키 검증 미들웨어
export const requireTradingEnabled = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.tradingEnabled) {
      return res.status(400).json({
        status: 'error',
        message: 'Trading is not enabled for this account. Please configure API keys first.'
      });
    }

    next();
  } catch (error) {
    logger.error('Trading enabled check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error checking trading status'
    });
  }
};