import Trade from '../models/Trade.js';
import { getBinanceInstance } from '../utils/binance.js';
import logger from '../utils/logger.js';

class PositionMonitorService {
  constructor() {
    this.monitoringInterval = 15000; // 15초마다 모니터링
    this.isRunning = false;
  }

  // 오픈 포지션 모니터링 시작
  async startMonitoring() {
    if (this.isRunning) {
      logger.warn('Position monitor is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🔍 Position Monitor Started');

    this.monitorInterval = setInterval(() => {
      this.monitorOpenPositions();
    }, this.monitoringInterval);

    // 즉시 한 번 실행
    this.monitorOpenPositions();
  }

  // 오픈 포지션 모니터링
  async monitorOpenPositions() {
    try {
      const openTrades = await Trade.find({ status: 'OPEN' }).populate('user');
      
      for (const trade of openTrades) {
        try {
          await this.monitorPosition(trade);
        } catch (tradeError) {
          logger.error(`Error monitoring trade ${trade._id}:`, tradeError);
        }
      }
    } catch (error) {
      logger.error('Error in position monitoring:', error);
    }
  }

  // 개별 포지션 모니터링
  async monitorPosition(trade) {
    try {
      const exchange = await getBinanceInstance(trade.user._id);
      if (!exchange) return;

      // 현재 가격 조회
      const ticker = await exchange.fetchTicker(trade.symbol);
      const currentPrice = ticker.last;

      // PNL 업데이트
      trade.calculatePNL(currentPrice);
      await trade.save();

      // 스탑로스/테이크프로핏 체크
      await this.checkExitConditions(trade, currentPrice, exchange);

    } catch (error) {
      logger.error(`Error monitoring position ${trade._id}:`, error);
    }
  }

  // 종료 조건 체크
  async checkExitConditions(trade, currentPrice, exchange) {
    // 스탑로스 체크
    if (trade.stopLoss) {
      if ((trade.side === 'LONG' && currentPrice <= trade.stopLoss) ||
          (trade.side === 'SHORT' && currentPrice >= trade.stopLoss)) {
        await this.closePosition(trade, exchange, 'STOP_LOSS', currentPrice);
        return;
      }
    }

    // 테이크프로핏 체크
    if (trade.takeProfit) {
      if ((trade.side === 'LONG' && currentPrice >= trade.takeProfit) ||
          (trade.side === 'SHORT' && currentPrice <= trade.takeProfit)) {
        await this.closePosition(trade, exchange, 'TAKE_PROFIT', currentPrice);
        return;
      }
    }

    // 트레일링 스탑 체크 (구현 가능)
    if (trade.trailingStop) {
      await this.checkTrailingStop(trade, currentPrice, exchange);
    }
  }

  // 포지션 종료
  async closePosition(trade, exchange, reason, currentPrice) {
    try {
      // 반대 방향 주문 실행
      const closeSide = trade.side === 'LONG' ? 'SELL' : 'BUY';
      
      await exchange.createOrder(
        trade.symbol,
        'MARKET',
        closeSide,
        trade.quantity,
        undefined,
        { reduceOnly: true }
      );

      // 거래 기록 업데이트
      trade.exitPrice = currentPrice;
      trade.status = 'CLOSED';
      trade.closedAt = new Date();
      trade.notes = `${trade.notes || ''} | Auto-closed: ${reason}`;
      await trade.save();

      logger.info(`✅ Position closed: ${trade._id} - ${reason}`);

    } catch (error) {
      logger.error(`Error closing position ${trade._id}:`, error);
      throw error;
    }
  }

  // 트레일링 스탑 체크
  async checkTrailingStop(trade, currentPrice, exchange) {
    // 트레일링 스탑 로직 구현
    // 최고점 대비 % 하락 시 종료
  }

  // 모니터링 중지
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      this.isRunning = false;
      logger.info('🛑 Position Monitor Stopped');
    }
  }
}

export default new PositionMonitorService();