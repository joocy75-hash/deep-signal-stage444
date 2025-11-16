const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 DeepSignal AI Trading Platform Backend',
    status: 'Running',
    version: '1.0.0'
  });
});

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// 대시보드 데이터
app.get('/api/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      account: {
        totalBalance: 10000,
        availableBalance: 8000,
        balances: [
          { asset: 'BTC', free: 0.1, locked: 0, total: 0.1, usdValue: 3500 },
          { asset: 'USDT', free: 5000, locked: 0, total: 5000, usdValue: 5000 }
        ]
      },
      prices: [
        { symbol: 'BTCUSDT', price: 35000, timestamp: new Date() },
        { symbol: 'ETHUSDT', price: 1500, timestamp: new Date() }
      ],
      openPositions: [],
      todayProfit: 250,
      totalProfit: 1250
    }
  });
});

// AI 트레이딩 시작
app.post('/api/ai-trading/start', (req, res) => {
  res.json({
    success: true,
    message: 'AI 트레이딩 시작됨! 🚀',
    config: req.body,
    timestamp: new Date()
  });
});

// AI 트레이딩 중지
app.post('/api/ai-trading/stop', (req, res) => {
  res.json({
    success: true,
    message: 'AI 트레이딩 중지됨! 🛑',
    timestamp: new Date()
  });
});

// 트레이딩 계정 정보
app.get('/api/trading/account', (req, res) => {
  res.json({
    success: true,
    totalBalance: 10000,
    availableBalance: 8000,
    balances: [
      { asset: 'BTC', free: 0.1, locked: 0, total: 0.1, usdValue: 3500 },
      { asset: 'USDT', free: 5000, locked: 0, total: 5000, usdValue: 5000 }
    ]
  });
});

// 오픈 포지션 조회
app.get('/api/trading/positions', (req, res) => {
  res.json([
    {
      symbol: 'BTCUSDT',
      amount: 0.1,
      entryPrice: 34000,
      currentPrice: 35000,
      pnl: 1000,
      pnlPercent: 2.94
    }
  ]);
});

// 바이낸스 계정 정보
app.get('/api/binance/account', (req, res) => {
  res.json({
    success: true,
    data: {
      balance: 1250.75,
      positions: [
        {
          id: 1,
          symbol: 'BTCUSDT',
          side: 'BUY',
          quantity: 0.025,
          entryPrice: 43250.00,
          currentPrice: 43458.75,
          pnl: 5.22
        }
      ]
    }
  });
});

// AI 신호 조회
app.get('/api/ai/signal', (req, res) => {
  res.json({
    success: true,
    data: {
      signal: 'STRONG BUY',
      confidence: 0.85,
      symbol: 'BTCUSDT',
      timestamp: new Date()
    }
  });
});

// 인증 엔드포인트
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // 간단한 데모 인증
  if (email && password) {
    res.json({
      success: true,
      data: {
        token: 'demo-token-' + Date.now(),
        user: {
          id: 1,
          email: email,
          name: email.split('@')[0]
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  res.json({
    success: true,
    data: {
      token: 'demo-token-' + Date.now(),
      user: {
        id: Date.now(),
        email: email,
        name: name || email.split('@')[0]
      }
    }
  });
});

app.post('/api/auth/verify', (req, res) => {
  res.json({
    success: true,
    data: { valid: true }
  });
});

// AI 트레이딩 상태
app.get('/api/ai-trading/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'stopped',
      active: false
    }
  });
});

// AI 예측
app.get('/api/ai-trading/predict/:symbol', (req, res) => {
  const { symbol } = req.params;
  res.json({
    success: true,
    data: {
      symbol: symbol,
      prediction: 'BUY',
      confidence: 0.75,
      price: 35000
    }
  });
});

// 트레이딩 히스토리
app.get('/api/trading/history', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

// 매수
app.post('/api/trading/buy', (req, res) => {
  res.json({
    success: true,
    message: '매수 주문이 생성되었습니다',
    data: req.body
  });
});

// 매도
app.post('/api/trading/sell', (req, res) => {
  res.json({
    success: true,
    message: '매도 주문이 생성되었습니다',
    data: req.body
  });
});

// 바이낸스 연결 테스트
app.get('/api/test/binance-connection', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'connected',
      message: '바이낸스 연결 성공 (데모 모드)'
    }
  });
});

// 계정 정보
app.get('/api/test/account-info', (req, res) => {
  res.json({
    success: true,
    data: {
      balance: 10000,
      availableBalance: 8000
    }
  });
});

// 관리자 API
app.get('/api/admin/users/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 10,
      activeUsers: 5
    }
  });
});

app.get('/api/admin/trading/monitor', (req, res) => {
  res.json({
    success: true,
    data: {
      activeTrades: 0,
      totalVolume: 0
    }
  });
});

app.get('/api/admin/system/logs', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`
✨ ========================================
🚀 DeepSignal AI Trading Platform Backend
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 API: http://localhost:${PORT}
✨ ========================================
  `);
});
