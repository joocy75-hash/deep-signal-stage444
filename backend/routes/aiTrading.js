const express = require('express');
const AutoTradingEngine = require('../services/autoTradingEngine');
const router = express.Router();

const tradingEngine = new AutoTradingEngine();

// AI 자동매매 시작
router.post('/start', async (req, res) => {
  try {
    const config = req.body;
    
    // 필수 필드 검증
    if (!config.symbols || !Array.isArray(config.symbols)) {
      return res.status(400).json({ 
        success: false, 
        error: 'symbols 배열이 필요합니다.' 
      });
    }

    const result = await tradingEngine.startTrading(config);

    res.json({
      success: true,
      message: 'AI 자동매매 시작됨',
      config: result.config,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// AI 자동매매 정지
router.post('/stop', async (req, res) => {
  try {
    const result = tradingEngine.stopTrading();

    res.json({
      success: result.success,
      message: result.message,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 트레이딩 상태 조회
router.get('/status', async (req, res) => {
  try {
    const stats = tradingEngine.getTradingStats();
    const positions = tradingEngine.getCurrentPositions();

    res.json({
      success: true,
      data: {
        isRunning: tradingEngine.isRunning,
        stats: stats,
        positions: positions,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// AI 예측 테스트
router.get('/predict/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const prediction = await tradingEngine.getAIPrediction(symbol);

    res.json({
      success: true,
      data: prediction,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 여러 심볼 예측
router.post('/predict-multiple', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ 
        success: false, 
        error: 'symbols 배열이 필요합니다.' 
      });
    }

    const predictions = [];
    for (const symbol of symbols) {
      const prediction = await tradingEngine.getAIPrediction(symbol);
      predictions.push(prediction);
    }

    res.json({
      success: true,
      data: predictions,
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