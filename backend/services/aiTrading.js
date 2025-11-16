// routes/aiTrading.js
const express = require('express');
const TradingEngine = require('../services/tradingEngine');
const router = express.Router();

const tradingEngine = new TradingEngine();

// 자동매매 시작
router.post('/start', async (req, res) => {
  try {
    const { symbols, options } = req.body;

    await tradingEngine.startTrading(symbols || ['BTCUSDT'], options);

    res.json({
      success: true,
      message: 'AI 자동매매 시작됨',
      data: {
        symbols: symbols || ['BTCUSDT'],
        options: options || {}
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 자동매매 정지
router.post('/stop', async (req, res) => {
  try {
    tradingEngine.stopTrading();

    res.json({
      success: true,
      message: 'AI 자동매매 정지됨'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 현재 포지션 조회
router.get('/positions', async (req, res) => {
  try {
    const positions = Array.from(tradingEngine.positions.values());

    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI 신호 테스트
router.get('/signal/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const signal = await tradingEngine.aiSignal.getSignal(symbol);

    res.json({
      success: true,
      data: signal
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;