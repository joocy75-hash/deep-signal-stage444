// services/autoTradingEngine.js
const BinanceService = require('./binanceService');
const AIPredictionService = require('./aiPredictionService');

class AutoTradingEngine {
  constructor() {
    this.binance = new BinanceService();
    this.ai = new AIPredictionService();
    this.isRunning = false;
    this.positions = new Map();
    this.tradingLog = [];
  }

  // 트레이딩 봇 시작
  async startTrading(config) {
    this.config = {
      symbols: config.symbols || ['BTCUSDT', 'ETHUSDT'],
      investmentPerTrade: config.investmentPerTrade || 100, // USDT
      maxOpenTrades: config.maxOpenTrades || 3,
      riskRewardRatio: config.riskRewardRatio || 1.5,
      checkInterval: config.checkInterval || 300000, // 5분
      ...config
    };

    this.isRunning = true;
    console.log('🤖 AI 자동매매 봇 시작:', this.config);

    // 주기적으로 트레이딩 신호 확인
    this.tradingInterval = setInterval(() => {
      this.checkTradingSignals();
    }, this.config.checkInterval);

    // 포지션 모니터링 시작
    this.monitoringInterval = setInterval(() => {
      this.monitorPositions();
    }, 60000); // 1분마다 포지션 모니터링
  }

  // 트레이딩 봇 정지
  stopTrading() {
    this.isRunning = false;
    clearInterval(this.tradingInterval);
    clearInterval(this.monitoringInterval);
    console.log('🛑 AI 자동매매 봇 정지');
  }

  // 트레이딩 신호 확인
  async checkTradingSignals() {
    if (!this.isRunning) return;

    for (const symbol of this.config.symbols) {
      try {
        // 현재 가격 조회
        const currentPrice = await this.binance.getCurrentPrice(symbol);
        
        // AI 예측 신호 받기
        const prediction = await this.ai.getPrediction(symbol);
        
        // 트레이딩 결정
        await this.makeTradingDecision(symbol, currentPrice, prediction);
        
      } catch (error) {
        console.error(`❌ ${symbol} 트레이딩 신호 확인 실패:`, error);
      }
    }
  }

  // 트레이딩 결정
  async makeTradingDecision(symbol, currentPrice, prediction) {
    const existingPosition = this.positions.get(symbol);
    
    // 신호 신뢰도 체크
    if (prediction.confidence < 0.7) {
      console.log(`📊 ${symbol} 신호 신뢰도 부족: ${prediction.confidence}`);
      return;
    }

    if (prediction.signal === 'BUY' && !existingPosition) {
      await this.executeBuy(symbol, currentPrice, prediction);
    } else if (prediction.signal === 'SELL' && existingPosition) {
      await this.executeSell(symbol, currentPrice, prediction, existingPosition);
    }
  }

  // 매수 실행
  async executeBuy(symbol, currentPrice, prediction) {
    // 오픈 포지션 수 체크
    if (this.positions.size >= this.config.maxOpenTrades) {
      console.log(`⏸️ ${symbol} 최대 포지션 수 도달`);
      return;
    }

    console.log(`💰 ${symbol} 매수 신호 확인: ${currentPrice}`);

    try {
      // 주문 수량 계산
      const quantity = this.config.investmentPerTrade / currentPrice;
      
      // 매수 주문
      const order = await this.binance.placeOrder(
        symbol,
        'BUY',
        'MARKET',
        quantity
      );

      // 포지션 등록
      const position = {
        symbol,
        quantity: order.executedQty,
        entryPrice: currentPrice,
        entryTime: new Date(),
        stopLoss: prediction.price_targets.stop_loss,
        takeProfit: prediction.price_targets.short_term,
        prediction: prediction
      };

      this.positions.set(symbol, position);
      
      // 트레이딩 로그 기록
      this.logTrade({
        type: 'BUY',
        symbol,
        quantity: order.executedQty,
        price: currentPrice,
        prediction,
        timestamp: new Date()
      });

      console.log(`✅ ${symbol} 매수 완료: ${order.executedQty} @ ${currentPrice}`);

    } catch (error) {
      console.error(`❌ ${symbol} 매수 실패:`, error);
    }
  }

  // 매도 실행
  async executeSell(symbol, currentPrice, prediction, position) {
    console.log(`💸 ${symbol} 매도 신호 확인: ${currentPrice}`);

    try {
      // 매도 주문
      const order = await this.binance.placeOrder(
        symbol,
        'SELL',
        'MARKET',
        position.quantity
      );

      // 수익률 계산
      const pnl = (currentPrice - position.entryPrice) * position.quantity;
      const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

      // 포지션 제거
      this.positions.delete(symbol);

      // 트레이딩 로그 기록
      this.logTrade({
        type: 'SELL',
        symbol,
        quantity: position.quantity,
        entryPrice: position.entryPrice,
        exitPrice: currentPrice,
        pnl,
        pnlPercent,
        prediction,
        timestamp: new Date()
      });

      console.log(`✅ ${symbol} 매도 완료: 수익률 ${pnlPercent.toFixed(2)}%`);

    } catch (error) {
      console.error(`❌ ${symbol} 매도 실패:`, error);
    }
  }

  // 포지션 모니터링 (손절/익절)
  async monitorPositions() {
    for (const [symbol, position] of this.positions) {
      try {
        const currentPrice = await this.binance.getCurrentPrice(symbol);
        const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

        // 손절마 체크
        if (currentPrice <= position.stopLoss) {
          console.log(`🛑 ${symbol} 손절마 실행`);
          await this.executeSell(symbol, currentPrice, position.prediction, position);
        }
        // 익절마 체크
        else if (currentPrice >= position.takeProfit) {
          console.log(`🎯 ${symbol} 익절마 실행`);
          await this.executeSell(symbol, currentPrice, position.prediction, position);
        }
        // 강제 청산 체크 (급락 시)
        else if (pnlPercent < -10) { // -10% 이상 손실 시
          console.log(`⚠️ ${symbol} 강제 청산: ${pnlPercent.toFixed(2)}%`);
          await this.executeSell(symbol, currentPrice, position.prediction, position);
        }

      } catch (error) {
        console.error(`❌ ${symbol} 포지션 모니터링 실패:`, error);
      }
    }
  }

  // 트레이딩 로그 기록
  logTrade(tradeData) {
    this.tradingLog.push(tradeData);
    
    // 최대 1000개 로그 유지
    if (this.tradingLog.length > 1000) {
      this.tradingLog = this.tradingLog.slice(-1000);
    }
  }

  // 통계 조회
  getTradingStats() {
    const trades = this.tradingLog.filter(log => log.type === 'SELL');
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => trade.pnl > 0).length;
    const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    return {
      totalTrades,
      winningTrades,
      winRate: winRate.toFixed(2),
      totalPnl: totalPnl.toFixed(2),
      currentPositions: this.positions.size,
      tradingLog: this.tradingLog.slice(-10) // 최근 10개 거래
    };
  }
}

module.exports = AutoTradingEngine;