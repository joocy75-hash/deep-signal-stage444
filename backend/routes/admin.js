const express = require('express');
const router = express.Router();

// 간단한 관리자 인증 미들웨어
const adminAuth = (req, res, next) => {
  const token = req.headers['admin-token'];
  
  if (token === process.env.ADMIN_TOKEN) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      error: '관리자 접근 권한이 없습니다.' 
    });
  }
};

// 사용자 통계
router.get('/users/stats', adminAuth, async (req, res) => {
  try {
    // 실제 데이터베이스 연동시 실제 데이터 사용
    res.json({
      success: true,
      data: {
        totalUsers: 150,
        activeTraders: 45,
        totalProfit: 12500,
        todayTrades: 23,
        systemUptime: '99.8%',
        activeBots: 8,
        totalVolume: 125000
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 트레이딩 모니터링
router.get('/trading/monitor', adminAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        activeSessions: 12,
        totalOpenPositions: 5,
        successRate: 76.5,
        averageProfit: 234.56,
        systemHealth: 'optimal',
        lastTradeTime: new Date(),
        performance: {
          hourly: 1250,
          daily: 8900,
          weekly: 45200
        }
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 시스템 로그
router.get('/system/logs', adminAuth, async (req, res) => {
  try {
    const mockLogs = [
      { time: new Date(), level: 'INFO', message: '시스템 정상 시작됨' },
      { time: new Date(Date.now() - 300000), level: 'INFO', message: 'BTCUSDT 매수 체결' },
      { time: new Date(Date.now() - 600000), level: 'WARN', message: '네트워크 지연 감지' },
      { time: new Date(Date.now() - 900000), level: 'INFO', message: 'ETHUSDT 매도 체결' }
    ];

    res.json({
      success: true,
      data: mockLogs,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 관리자용 사용자 목록 (Mock)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const mockUsers = [
      { id: 1, email: 'user1@example.com', status: 'active', joinDate: '2024-01-15', totalProfit: 1250 },
      { id: 2, email: 'user2@example.com', status: 'active', joinDate: '2024-01-20', totalProfit: 890 },
      { id: 3, email: 'user3@example.com', status: 'inactive', joinDate: '2024-01-25', totalProfit: -150 }
    ];

    res.json({
      success: true,
      data: mockUsers,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;