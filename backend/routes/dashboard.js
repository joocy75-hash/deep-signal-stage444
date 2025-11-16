// routes/dashboard.js
const express = require('express');
const BinanceService = require('../services/binanceService');
const router = express.Router();

const binance = new BinanceService();

// 실시간 가격 스트림 시작
//binance.startPriceStream();

// 대시보드 메인 데이터
router.get('/', async (req, res) => {
  try {
    const [accountInfo, positions, btcChart, ethChart] = await Promise.all([
      binance.getAccountInfo(),
      binance.getOpenPositions(),
      binance.getChartData('BTCUSDT', '1h', 24),
      binance.getChartData('ETHUSDT', '1h', 24)
    ]);

    const btcVolatility = binance.calculateVolatility(btcChart);
    const ethVolatility = binance.calculateVolatility(ethChart);

    res.json({
      success: true,
      data: {
        account: accountInfo,
        positions: positions,
        market: {
          btc: { chart: btcChart, volatility: btcVolatility },
          eth: { chart: ethChart, volatility: ethVolatility }
        },
        summary: {
          totalBalance: accountInfo.totalBalance,
          dailyPnl: this.calculateDailyPnl(positions),
          totalPnl: this.calculateTotalPnl(positions)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 실시간 가격 조회
router.get('/prices', (req, res) => {
  const prices = Array.from(binance.priceCache.values());
  res.json({ success: true, data: prices });
});

// 특정 심볼 차트 데이터
router.get('/chart/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 100 } = req.query;
    
    const chartData = await binance.getChartData(symbol, interval, parseInt(limit));
    const volatility = binance.calculateVolatility(chartData);
    
    res.json({
      success: true,
      data: {
        symbol,
        chart: chartData,
        volatility,
        currentPrice: chartData[chartData.length - 1]?.close
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 포트폴리오 변동성
router.get('/portfolio/volatility', async (req, res) => {
  try {
    const positions = await binance.getOpenPositions();
    const volatility = binance.calculatePortfolioVolatility(positions);
    
    res.json({ success: true, data: volatility });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;