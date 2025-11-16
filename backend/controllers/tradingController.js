const Trade = require('../models/Trade');
const User = require('../models/User');

// 주문 생성
const placeOrder = async (req, res) => {
  try {
    const {
      symbol,
      type,
      side,
      quantity,
      leverage = 1,
      stopLoss,
      takeProfit,
      signalStrength,
      aiConfidence
    } = req.body;

    // 필수 필드 검증
    if (!symbol || !type || !side || !quantity) {
      return res.status(400).json({
        status: 'error',
        message: 'Symbol, type, side, and quantity are required'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user.tradingEnabled) {
      return res.status(400).json({
        status: 'error',
        message: 'Trading is not enabled for this account'
      });
    }

    // 바이낸스 인스턴스 가져오기
    const { getBinanceInstance, placeBinanceOrder } = require('../utils/binance');
    const exchange = await getBinanceInstance(req.user.id);
    if (!exchange) {
      return res.status(400).json({
        status: 'error',
        message: 'Binance API keys not configured or invalid'
      });
    }

    // 현재 가격 조회
    const ticker = await exchange.fetchTicker(symbol);
    const currentPrice = ticker.last;

    // 레버리지 설정 (선물 거래인 경우)
    if (leverage > 1) {
      await exchange.setLeverage(leverage, symbol);
    }

    // 바이낸스 주문 실행
    const binanceOrder = await placeBinanceOrder(exchange, {
      symbol,
      type: type.toUpperCase(),
      side: side.toUpperCase(),
      quantity,
      price: currentPrice,
      stopLoss,
      takeProfit
    });

    // 데이터베이스에 거래 기록 저장
    const trade = await Trade.create({
      user: req.user.id,
      symbol,
      type: type.toUpperCase(),
      side: side.toUpperCase(),
      quantity,
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      leverage,
      signalStrength,
      aiConfidence,
      status: 'OPEN'
    });

    console.log(`New trade placed: ${trade._id} for user ${req.user.id}`);

    res.status(201).json({
      status: 'success',
      message: 'Order placed successfully',
      data: {
        trade,
        binanceOrder
      }
    });

  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to place order'
    });
  }
};

// 주문 종료
const closeOrder = async (req, res) => {
  try {
    const { tradeId, exitPrice } = req.body;

    if (!tradeId) {
      return res.status(400).json({
        status: 'error',
        message: 'Trade ID is required'
      });
    }

    // 거래 기록 찾기
    const trade = await Trade.findOne({ _id: tradeId, user: req.user.id });
    if (!trade) {
      return res.status(404).json({
        status: 'error',
        message: 'Trade not found'
      });
    }

    if (trade.status !== 'OPEN') {
      return res.status(400).json({
        status: 'error',
        message: 'Trade is already closed'
      });
    }

    const user = await User.findById(req.user.id);
    const { getBinanceInstance, closeBinancePosition } = require('../utils/binance');
    const exchange = await getBinanceInstance(req.user.id);

    // 바이낸스에서 포지션 종료
    const closeResult = await closeBinancePosition(exchange, {
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity
    });

    // 현재 가격으로 PNL 계산
    const ticker = await exchange.fetchTicker(trade.symbol);
    const currentPrice = exitPrice || ticker.last;
    trade.calculatePNL(currentPrice);

    // 거래 기록 업데이트
    trade.exitPrice = currentPrice;
    trade.status = 'CLOSED';
    trade.closedAt = new Date();
    await trade.save();

    // 사용자 통계 업데이트
    await User.findByIdAndUpdate(req.user.id, {
      $inc: {
        totalTrades: 1,
        totalProfit: trade.pnl
      }
    });

    console.log(`Trade closed: ${tradeId} for user ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      message: 'Order closed successfully',
      data: {
        trade,
        closeResult
      }
    });

  } catch (error) {
    console.error('Close order error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to close order'
    });
  }
};

// 주문 취소
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const { getBinanceInstance } = require('../utils/binance');
    const exchange = await getBinanceInstance(req.user.id);
    const result = await exchange.cancelOrder(orderId);

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: result
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to cancel order'
    });
  }
};

// 오픈 주문 조회
const getOpenOrders = async (req, res) => {
  try {
    const trades = await Trade.find({
      user: req.user.id,
      status: 'OPEN'
    }).sort({ createdAt: -1 });

    // 현재 가격으로 PNL 업데이트
    const { getBinanceInstance } = require('../utils/binance');
    const exchange = await getBinanceInstance(req.user.id);
    const updatedTrades = await Promise.all(
      trades.map(async (trade) => {
        try {
          const ticker = await exchange.fetchTicker(trade.symbol);
          trade.calculatePNL(ticker.last);
          await trade.save();
          return trade;
        } catch (error) {
          return trade;
        }
      })
    );

    res.status(200).json({
      status: 'success',
      results: updatedTrades.length,
      data: {
        trades: updatedTrades
      }
    });

  } catch (error) {
    console.error('Get open orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch open orders'
    });
  }
};

// 주문 히스토리 조회
const getOrderHistory = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const trades = await Trade.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Trade.countDocuments({ user: req.user.id });

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
    console.error('Get order history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order history'
    });
  }
};

// 잔고 조회
const getBalance = async (req, res) => {
  try {
    const { getBinanceInstance } = require('../utils/binance');
    const exchange = await getBinanceInstance(req.user.id);
    const balance = await exchange.fetchBalance();

    // 주요 암호화폐만 필터링
    const relevantCurrencies = ['USDT', 'BTC', 'ETH', 'BNB', 'ADA', 'DOT', 'LINK'];
    const filteredBalance = {};

    relevantCurrencies.forEach(currency => {
      if (balance.total[currency] > 0) {
        filteredBalance[currency] = {
          total: balance.total[currency],
          free: balance.free[currency],
          used: balance.used[currency]
        };
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        balance: filteredBalance,
        totalUSDT: balance.total.USDT || 0
      }
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch balance'
    });
  }
};

// 포지션 조회
const getPositions = async (req, res) => {
  try {
    const { getBinanceInstance } = require('../utils/binance');
    const exchange = await getBinanceInstance(req.user.id);
    const positions = await exchange.fetchPositions();

    // 오픈 포지션만 필터링
    const openPositions = positions.filter(position => 
      position.entryPrice && position.entryPrice > 0
    );

    res.status(200).json({
      status: 'success',
      results: openPositions.length,
      data: {
        positions: openPositions
      }
    });

  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch positions'
    });
  }
};

// 레버리지 설정
const setLeverage = async (req, res) => {
  try {
    const { symbol, leverage } = req.body;

    if (!symbol || !leverage) {
      return res.status(400).json({
        status: 'error',
        message: 'Symbol and leverage are required'
      });
    }

    const { getBinanceInstance } = require('../utils/binance');
    const exchange = await getBinanceInstance(req.user.id);
    const result = await exchange.setLeverage(leverage, symbol);

    res.status(200).json({
      status: 'success',
      message: 'Leverage set successfully',
      data: result
    });

  } catch (error) {
    console.error('Set leverage error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to set leverage'
    });
  }
};

module.exports = {
  placeOrder,
  closeOrder,
  getOpenOrders,
  getOrderHistory,
  cancelOrder,
  setLeverage,
  getBalance,
  getPositions
};