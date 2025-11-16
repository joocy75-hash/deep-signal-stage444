const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  side: {
    type: String,
    enum: ['LONG', 'SHORT'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  entryPrice: {
    type: Number,
    required: true,
    min: 0
  },
  exitPrice: {
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
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED', 'CANCELLED', 'STOPPED'],
    default: 'OPEN'
  },
  pnl: {
    type: Number,
    default: 0
  },
  pnlPercentage: {
    type: Number,
    default: 0
  },
  fee: {
    type: Number,
    default: 0
  },
  signalStrength: {
    type: Number,
    min: 0,
    max: 1
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  aiSignalId: {
    type: String
  },
  notes: {
    type: String,
    maxlength: 500
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// 인덱스 설정
tradeSchema.index({ user: 1, createdAt: -1 });
tradeSchema.index({ symbol: 1, status: 1 });
tradeSchema.index({ createdAt: -1 });

// 가상 필드: 포지션 크기
tradeSchema.virtual('positionSize').get(function() {
  return this.quantity * this.entryPrice;
});

// 메서드: PNL 계산
tradeSchema.methods.calculatePNL = function(currentPrice) {
  if (this.status !== 'OPEN') return this.pnl;
  
  let pnl;
  if (this.side === 'LONG') {
    pnl = (currentPrice - this.entryPrice) * this.quantity;
  } else {
    pnl = (this.entryPrice - currentPrice) * this.quantity;
  }
  
  this.pnl = pnl;
  this.pnlPercentage = (pnl / (this.entryPrice * this.quantity)) * 100;
  
  return pnl;
};

const Trade = mongoose.model('Trade', tradeSchema);

module.exports = Trade;