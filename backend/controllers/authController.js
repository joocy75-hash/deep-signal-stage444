const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT 토큰 생성
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// 회원가입
const register = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;

    // 기본 검증
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email, and password'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        status: 'error',
        message: 'Passwords do not match'
      });
    }

    // 사용자 생성
    const newUser = await User.create({
      name,
      email,
      password,
    });

    // 비밀번호 제거 후 응답
    newUser.password = undefined;

    // 토큰 생성
    const token = signToken(newUser._id);

    console.log(`New user registered: ${email}`);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already exists'
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during registration'
    });
  }
};

// 로그인
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 이메일과 비밀번호 확인
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // 사용자 찾기 및 비밀번호 포함
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    // 마지막 로그인 시간 업데이트
    user.lastLogin = new Date();
    await user.save();

    // 비밀번호 제거
    user.password = undefined;

    // 토큰 생성
    const token = signToken(user._id);

    console.log(`User logged in: ${email}`);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during login'
    });
  }
};

// 현재 사용자 정보
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user data'
    });
  }
};

// 프로필 업데이트
const updateProfile = async (req, res) => {
  try {
    const { name, riskLevel, dailyLossLimit } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, riskLevel, dailyLossLimit },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile'
    });
  }
};

// API 키 업데이트
const updateApiKeys = async (req, res) => {
  try {
    const { binanceApiKey, binanceSecretKey } = req.body;

    if (!binanceApiKey || !binanceSecretKey) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide both API key and Secret key'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        binanceApiKey, 
        binanceSecretKey,
        tradingEnabled: true 
      },
      { new: true }
    );

    console.log(`API keys updated for user: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'API keys updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          tradingEnabled: user.tradingEnabled
        }
      }
    });
  } catch (error) {
    console.error('Update API keys error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating API keys'
    });
  }
};

// API 키 검증
const validateApiKeys = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+binanceApiKey +binanceSecretKey');
    
    if (!user.binanceApiKey || !user.binanceSecretKey) {
      return res.status(400).json({
        status: 'error',
        message: 'API keys not found'
      });
    }

    // 바이낸스 연결 테스트
    const { connectBinance } = require('../utils/binance');
    const isValid = await connectBinance(user.binanceApiKey, user.binanceSecretKey);
    
    if (isValid) {
      res.status(200).json({
        status: 'success',
        message: 'API keys are valid'
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Invalid API keys'
      });
    }
  } catch (error) {
    console.error('Validate API keys error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error validating API keys'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updateApiKeys,
  validateApiKeys
};