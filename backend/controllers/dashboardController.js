import Trade from '../models/Trade.js';
import User from '../models/User.js';
import { getMarketData, getMultipleTickers } from '../utils/binance.js';
import logger from '../utils/logger.js';

// 대시보드 메인 데이터
export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // 여러 데이터를 병렬로 조회
    const [
      user,
      openTrades,
      recentTrades,
      marketData,
      balance
    ] = await Promise.all([
      User.findById(userId),
      Trade.find({ user: userId, status: 'OPEN' }).sort({ createdAt: -1 }),
      Trade.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
      getMarketData(),
      getBalanceData(userId)
    ]);

    // 통계 계산
    const stats = await calculateDashboardStats(userId);

    // AI 신호 데이터 (모의 데이터)
    const aiSignals = generateMockAISignals();

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          name: user.name,
          email: user.email,
          riskLevel: user.riskLevel,
          tradingEnabled: user.tradingEnabled,
          totalProfit: user.totalProfit,
          totalTrades: user.totalTrades
        },
        portfolio: {
          totalBalance: balance.totalUSDT,
          dailyChange: stats.dailyChange,
          totalProfit: user.totalProfit,
          openPositions: openTrades.length
        },
        openTrades,
        recentTrades,
        marketData,
        aiSignals,
        performance: stats
      }
    });

  } catch (error) {
    logger.error('Get dashboard data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data'
    });
  }
};

// 포트폴리오 데이터
export const getPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [balance, openTrades, performance] = await Promise.all([
      getBalanceData(userId),
      Trade.find({ user: userId, status: 'OPEN' }),
      calculatePortfolioPerformance(userId)
    ]);

    // 자산 배분 계산
    const allocation = calculateAssetAllocation(openTrades, balance);

    res.status(200).json({
      status: 'success',
      data: {
        balance,
        openTrades,
        allocation,
        performance
      }
    });

  } catch (error) {
    logger.error('Get portfolio error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch portfolio data'
    });
  }
};

// 마켓 데이터
export const getMarketData = async (req, res) => {
  try {
    const data = await getMarketData();
    
    res.status(200).json({
      status: 'success',
      data
    });

  } catch (error) {
    logger.error('Get market data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch market data'
    });
  }
};

// 거래 히스토리
export const getTradeHistory = async (req, res) => {
  try {
    const { limit = 50, page = 1, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.user.id };
    if (status) filter.status = status;

    const trades = await Trade.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Trade.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: trades.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: {
        trades
      }
    });

  } catch (error) {
    logger.error('Get trade history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch trade history'
    });
  }
};

// 퍼포먼스 데이터
export const getPerformance = async (req, res) => {
  try {
    const stats = await calculatePerformanceStats(req.user.id);

    res.status(200).json({
      status: 'success',
      data: stats
    });

  } catch (error) {
    logger.error('Get performance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch performance data'
    });
  }
};

// 헬퍼 함수들
async function getBalanceData(userId) {
  try {
    const { getBinanceInstance } = await import('../utils/binance.js');
    const exchange = await getBinanceInstance(userId);
    
    if (!exchange) {
      return { totalUSDT: 0, currencies: {} };
    }

    const balance = await exchange.fetchBalance();
    return {
      totalUSDT: balance.total.USDT || 0,
      currencies: {
        USDT: balance.total.USDT || 0,
        BTC: balance.total.BTC || 0,
        ETH: balance.total.ETH || 0
      }
    };
  } catch (error) {
    return { totalUSDT: 0, currencies: {} };
  }
}

async function calculateDashboardStats(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [dailyTrades, weeklyTrades, totalTrades] = await Promise.all([
    Trade.countDocuments({
      user: userId,
      createdAt: { $gte: today }
    }),
    Trade.countDocuments({
      user: userId,
      createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
    }),
    Trade.countDocuments({ user: userId })
  ]);

  const profitableTrades = await Trade.countDocuments({
    user: userId,
    status: 'CLOSED',
    pnl: { $gt: 0 }
  });

  const totalClosedTrades = await Trade.countDocuments({
    user: userId,
    status: 'CLOSED'
  });

  const winRate = totalClosedTrades > 0 ? (profitableTrades / totalClosedTrades) * 100 : 0;

  return {
    dailyTrades,
    weeklyTrades,
    totalTrades,
    winRate: Math.round(winRate * 100) / 100,
    profitableTrades
  };
}

async function calculatePortfolioPerformance(userId) {
  const trades = await Trade.find({ user: userId, status: 'CLOSED' });
  
  const totalPNL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const totalInvestment = trades.reduce((sum, trade) => sum + (trade.entryPrice * trade.quantity), 0);
  
  const roi = totalInvestment > 0 ? (totalPNL / totalInvestment) * 100 : 0;

  return {
    totalPNL,
    totalInvestment,
    roi: Math.round(roi * 100) / 100,
    totalTrades: trades.length
  };
}

function calculateAssetAllocation(openTrades, balance) {
  const allocation = {};
  let totalValue = balance.totalUSDT;

  // 오픈 트레이드 가치 추가
  openTrades.forEach(trade => {
    const value = trade.entryPrice * trade.quantity;
    totalValue += value;
    
    const baseCurrency = trade.symbol.split('/')[0];
    allocation[baseCurrency] = (allocation[baseCurrency] || 0) + value;
  });

  // 현금 비중 추가
  allocation.USDT = (allocation.USDT || 0) + balance.currencies.USDT;

  // 백분율로 변환
  Object.keys(allocation).forEach(currency => {
    allocation[currency] = {
      value: allocation[currency],
      percentage: Math.round((allocation[currency] / totalValue) * 100)
    };
  });

  return allocation;
}

async function calculatePerformanceStats(userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const recentTrades = await Trade.find({
    user: userId,
    status: 'CLOSED',
    closedAt: { $gte: thirtyDaysAgo }
  });

  const dailyPerformance = [];
  let currentDate = new Date(thirtyDaysAgo);
  
  while (currentDate <= new Date()) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const dayTrades = recentTrades.filter(trade => 
      trade.closedAt >= dayStart && trade.closedAt <= dayEnd
    );

    const dayPNL = dayTrades.reduce((sum, trade) => sum + trade.pnl, 0);

    dailyPerformance.push({
      date: dayStart.toISOString().split('T')[0],
      pnl: dayPNL,
      trades: dayTrades.length
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    dailyPerformance,
    recentTrades: recentTrades.slice(0, 20)
  };
}

function generateMockAISignals() {
  const symbols = ['BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'DOT/USDT', 'LINK/USDT'];
  const signals = [];

  symbols.forEach(symbol => {
    const confidence = Math.random() * 0.5 + 0.5; // 0.5 ~ 1.0
    const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
    
    signals.push({
      symbol,
      type,
      confidence: Math.round(confidence * 100) / 100,
      strength: confidence > 0.7 ? 'STRONG' : confidence > 0.6 ? 'MEDIUM' : 'WEAK',
      timestamp: new Date()
    });
  });

  return signals;
}