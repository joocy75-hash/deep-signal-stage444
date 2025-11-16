const express = require('express');
const BinanceService = require('../services/binanceService');
const router = express.Router();

const binanceService = new BinanceService();

// 바이낸스 연결 테스트
router.get('/binance-connection', async (req, res) => {
  try {
    console.log('🧪 바이낸스 연결 테스트 요청 받음');
    const result = await binanceService.testConnection();
    
    res.json({
      ...result,
      timestamp: new Date(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date()
    });
  }
});

// 계정 정보 테스트
router.get('/account-info', async (req, res) => {
  try {
    const accountInfo = await binanceService.getAccountInfo();
    
    res.json({ 
      success: true, 
      data: accountInfo,
      timestamp: new Date(),
      isMock: accountInfo.isMock || false
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 가격 조회 테스트
router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = await binanceService.getCurrentPrice(symbol);
    
    res.json({ 
      success: true, 
      data: price,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 서버 상태 확인
router.get('/server-status', async (req, res) => {
  try {
    const binanceStatus = await binanceService.testConnection();
    
    res.json({
      success: true,
      data: {
        server: 'Running',
        binance: binanceStatus.success ? 'Connected' : 'Disconnected',
        timestamp: new Date(),
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;