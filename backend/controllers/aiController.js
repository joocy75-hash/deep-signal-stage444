import AISignal from '../models/AISignal.js';
import User from '../models/User.js';
import aiSignalService from '../services/aiSignalService.js';
import logger from '../utils/logger.js';

// AI 설정 업데이트
export const updateAISettings = async (req, res) => {
  try {
    const { 
      autoTrading, 
      minConfidence, 
      watchlist, 
      timeframe,
      riskPerTrade,
      maxLeverage,
      aiApiKey 
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'aiSettings.autoTrading': autoTrading,
          'aiSettings.minConfidence': minConfidence,
          'aiSettings.watchlist': watchlist,
          'aiSettings.timeframe': timeframe,
          'aiSettings.aiApiKey': aiApiKey,
          'riskSettings.riskPerTrade': riskPerTrade,
          'riskSettings.maxLeverage': maxLeverage
        }
      },
      { new: true, runValidators: true }
    );

    logger.info(`AI settings updated for user: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'AI settings updated successfully',
      data: {
        aiSettings: user.aiSettings,
        riskSettings: user.riskSettings
      }
    });

  } catch (error) {
    logger.error('Update AI settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update AI settings'
    });
  }
};

// AI 신호 수동 실행
export const executeManualSignal = async (req, res) => {
  try {
    const signal = req.body;

    // 신호 유효성 검증
    if (!signal.symbol || !signal.action || !signal.confidence) {
      return res.status(400).json({
        status: 'error',
        message: 'Symbol, action, and confidence are required'
      });
    }

    const user = await User.findById(req.user.id);
    
    // AI 거래 실행
    const trade = await aiSignalService.executeAITrade(user, signal);

    res.status(201).json({
      status: 'success',
      message: 'AI trade executed successfully',
      data: {
        trade
      }
    });

  } catch (error) {
    logger.error('Execute manual AI signal error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to execute AI trade'
    });
  }
};

// AI 신호 히스토리 조회
export const getAISignalHistory = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const signals = await AISignal.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await AISignal.countDocuments({ user: req.user.id });

    res.status(200).json({
      status: 'success',
      results: signals.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: {
        signals
      }
    });

  } catch (error) {
    logger.error('Get AI signal history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch AI signal history'
    });
  }
};

// AI 트레이딩 상태 조회
export const getAITradingStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // 활성 AI 거래 조회
    const activeAITrades = await Trade.find({
      user: req.user.id,
      status: 'OPEN',
      aiSignalId: { $exists: true }
    });

    // AI 성능 통계
    const aiStats = await calculateAIStats(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        aiSettings: user.aiSettings,
        riskSettings: user.riskSettings,
        activeAITrades: activeAITrades.length,
        aiPerformance: aiStats
      }
    });

  } catch (error) {
    logger.error('Get AI trading status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch AI trading status'
    });
  }
};

// AI 자동매매 시작/중지
export const toggleAutoTrading = async (req, res) => {
  try {
    const { enabled } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 'aiSettings.autoTrading': enabled },
      { new: true }
    );

    logger.info(`Auto trading ${enabled ? 'enabled' : 'disabled'} for user: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: `Auto trading ${enabled ? 'enabled' : 'disabled'}`,
      data: {
        autoTrading: user.aiSettings.autoTrading
      }
    });

  } catch (error) {
    logger.error('Toggle auto trading error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle auto trading'
    });
  }
};

// 헬퍼 함수: AI 통계 계산
async function calculateAIStats(userId) {
  const aiTrades = await Trade.find({
    user: userId,
    aiSignalId: { $exists: true },
    status: 'CLOSED'
  });

  if (aiTrades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      totalProfit: 0,
      avgProfit: 0,
      bestTrade: 0,
      worstTrade: 0
    };
  }

  const profitableTrades = aiTrades.filter(trade => trade.pnl > 0);
  const totalProfit = aiTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const winRate = (profitableTrades.length / aiTrades.length) * 100;
  const bestTrade = Math.max(...aiTrades.map(trade => trade.pnl));
  const worstTrade = Math.min(...aiTrades.map(trade => trade.pnl));

  return {
    totalTrades: aiTrades.length,
    winRate: Math.round(winRate * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    avgProfit: Math.round((totalProfit / aiTrades.length) * 100) / 100,
    bestTrade: Math.round(bestTrade * 100) / 100,
    worstTrade: Math.round(worstTrade * 100) / 100
  };
}