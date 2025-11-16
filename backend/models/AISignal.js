const mongoose = require('mongoose');

const aiSignalSchema = new mongoose.Schema({
  signalId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  action: {
    type: String,
    enum: ['BUY', 'SELL', 'HOLD'],
    required: true
  },
  positionType: {
    type: String,
    enum: ['LONG', 'SHORT'],
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  orderType: {
    type: String,
    enum: ['MARKET', 'LIMIT'],
    default: 'MARKET'
  },
  price: {
    type: Number,
    min: 0
  },
  stopLoss: {
    type: Number,
    min: 0
  },
  takeProfit: {
    type: Number,
    min: 0
  },
  leverage: {
    type: Number,
    default: 1,
    min: 1,
    max: 125
  },
  timeframe: {
    type: String,
    default: '5m'
  },
  strategy: {
    type: String,
    required: true
  },
  indicators: {
    rsi: Number,
    macd: Number,
    bollingerBands: Object,
    movingAverages: Object
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['PENDING', 'EXECUTED', 'REJECTED', 'EXPIRED'],
    default: 'PENDING'
  },
  executedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    index: { expires: 3600 }
  }
}, {
  timestamps: true
});

// 인덱스 설정
aiSignalSchema.index({ user: 1, createdAt: -1 });
aiSignalSchema.index({ symbol: 1, status: 1 });
aiSignalSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// 신호 유효성 검증 메서드
aiSignalSchema.methods.isValid = function() {
  return this.confidence >= 0.7 && this.expiresAt > new Date();
};

// 신호 실행 메서드
aiSignalSchema.methods.markAsExecuted = function() {
  this.status = 'EXECUTED';
  this.executedAt = new Date();
  return this.save();
};

const AISignal = mongoose.model('AISignal', aiSignalSchema);

module.exports = AISignal;