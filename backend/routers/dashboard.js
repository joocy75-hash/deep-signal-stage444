const express = require('express');
const BinanceService = require('../services/binanceService');
const router = express.Router();

const binanceService = new BinanceService();

// 대시보드 데이터
router.get('/', async (req, res) => {
  try {
    // 계정 정보
    const accountInfo = await binanceService.getAccountInfo();
    
    // 현재 가격들
    const prices = await binanceService.getMultiplePrices(['BTCUSDT', 'ETHUSDT', 'ADAUSDT']);
    
    // Mock 포지션 데이터
    const openPositions = [
      {
        symbol: 'BTCUSDT',
        amount: 0.1,
        entryPrice: 34000,
        currentPrice: prices.find(p => p.symbol === 'BTCUSDT')?.price || 35000,
        pnl: 100,
        pnlPercent: 2.94,
        leverage: 1,
        type: 'spot'
      },
      {
        symbol: 'ETHUSDT',
        amount: 2,
        entryPrice: 1450,
        currentPrice: prices.find(p => p.symbol === 'ETHUSDT')?.price || 1500,
        pnl: 100,
        pnlPercent: 3.45,
        leverage: 1,
        type: 'spot'
      }
    ];

    // 가격 히스토리 (Mock)
    const priceHistory = [];
    let basePrice = 35000;
    for (let i = 0; i < 24; i++) {
      priceHistory.push({
        time: new Date(Date.now() - (24 - i) * 3600000),
        open: basePrice + Math.random() * 100,
        high: basePrice + Math.random() * 200,
        low: basePrice - Math.random() * 200,
        close: basePrice + (Math.random() - 0.5) * 300,
        volume: Math.random() * 1000
      });
    }

    res.json({
      success: true,
      data: {
        account: accountInfo,
        prices: prices,
        openPositions: openPositions,
        priceHistory: priceHistory,
        todayProfit: 250,
        totalProfit: 1250,
        tradingVolume: 50000,
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

// 실시간 가격 스트림 (WebSocket 대신 롱폴링)
router.get('/prices', async (req, res) => {
  try {
    const { symbols } = req.query;
    const symbolList = symbols ? symbols.split(',') : ['BTCUSDT', 'ETHUSDT'];
    
    const prices = await binanceService.getMultiplePrices(symbolList);
    
    res.json({
      success: true,
      data: prices,
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