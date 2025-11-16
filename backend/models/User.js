const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'trader'],
    default: 'user'
  },
  binanceApiKey: {
    type: String,
    select: false
  },
  binanceSecretKey: {
    type: String,
    select: false
  },
  tradingEnabled: {
    type: Boolean,
    default: false
  },
  // AI 트레이딩 설정
  aiSettings: {
    autoTrading: { type: Boolean, default: false },
    minConfidence: { type: Number, default: 0.7, min: 0, max: 1 },
    watchlist: { type: [String], default: ['BTC/USDT', 'ETH/USDT'] },
    timeframe: { type: String, default: '5m' },
    aiApiKey: { type: String, select: false }
  },
  // 위험 관리 설정
  riskSettings: {
    riskPerTrade: { type: Number, default: 2 },
    maxLeverage: { type: Number, default: 10 },
    dailyLossLimit: { type: Number, default: 100 },
    maxPositionSize: { type: Number, default: 1000 }
  },
  totalProfit: {
    type: Number,
    default: 0
  },
  totalTrades: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// 비밀번호 암호화 미들웨어
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 비밀번호 비교 메서드
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;