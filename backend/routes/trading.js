const express = require('express');
const BinanceService = require('../services/binanceService');
const router = express.Router();

const binanceService = new BinanceService();

// 거래 내역 조회
router.get('/history', async (req, res) => {
  try {
    // Mock 거래 내역
    const mockHistory = [
      {
        id: 1,
        symbol: 'BTCUSDT',
        action: 'BUY',
        quantity: 0.1,
        price: 34000,
        total: 3400,
        timestamp: new Date(Date.now() - 3600000),
        pnl: 100,
        status: 'completed'
      },
      {
        id: 2,
        symbol: 'ETHUSDT',
        action: 'SELL',
        quantity: 2,
        price: 1500,
        total: 3000,
        timestamp: new Date(Date.now() - 7200000),
        pnl: 50,
        status: 'completed'
      }
    ];

    res.json({
      success: true,
      data: mockHistory,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 수동 매수
router.post('/buy', async (req, res) => {
  try {
    const { symbol, quantity, price } = req.body;

    // Mock 매수 실행
    const trade = {
      id: Date.now(),
      symbol,
      action: 'BUY',
      quantity: quantity || 0.1,
      price: price || 35000,
      total: (quantity || 0.1) * (price || 35000),
      timestamp: new Date(),
      status: 'completed'
    };

    res.json({
      success: true,
      message: '매수 주문이 체결되었습니다.',
      data: trade,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 수동 매도
router.post('/sell', async (req, res) => {
  try {
    const { symbol, quantity, price } = req.body;

    // Mock 매도 실행
    const trade = {
      id: Date.now(),
      symbol,
      action: 'SELL',
      quantity: quantity || 0.1,
      price: price || 35000,
      total: (quantity || 0.1) * (price || 35000),
      timestamp: new Date(),
      status: 'completed'
    };

    res.json({
      success: true,
      message: '매도 주문이 체결되었습니다.',
      data: trade,
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