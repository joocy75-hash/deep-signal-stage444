// services/tradingEngine.js
const BinanceService = require('./binanceService');
const AISignalService = require('./aiSignalService');

class TradingEngine {
  constructor() {
    this.binance = new BinanceService();
    this.aiSignal = new AISignalService();
    this.isRunning = false;
    this.positions = new Map();
  }

  // 트레이딩 봇 시작
  async startTrading(symbols = ['BTCUSDT', 'ETHUSDT'], options = {}) {
    this.isRunning = true;
    console.log('🚀 AI 자동매매 봇 시작');

    // 주기적으로 신호 확인 및 거래 실행
    this.tradingInterval = setInterval(async () => {
      if (!this.isRunning) return;

      for (const symbol of symbols) {
        await this.checkAndExecuteTrade(symbol, options);
      }
    }, options.interval || 60000); // 기본 1분마다 체크
  }

  // 트레이딩 봇 정지
  stopTrading() {
    this.isRunning = false;
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
    }
    console.log('🛑 AI 자동매매 봇 정지');
  }

  // 신호 확인 및 거래 실행
  async checkAndExecuteTrade(symbol, options) {
    try {
      // AI 신호 받아오기
      const signal = await this.aiSignal.getSignal(symbol);

      // 신호 신뢰도 체크 (신뢰도가 threshold 이상일 때만 실행)
      if (signal.confidence < (options.minConfidence || 0.7)) {
        console.log(`📊 ${symbol} 신호 신뢰도 부족: ${signal.confidence}`);
        return;
      }

      // 현재 포지션 확인
      const currentPosition = this.positions.get(symbol);

      // 거래 전략 실행
      if (signal.signal === 'BUY' && !currentPosition) {
        await this.executeBuy(symbol, signal, options);
      } else if (signal.signal === 'SELL' && currentPosition) {
        await this.executeSell(symbol, signal, currentPosition);
      } else if (signal.signal === 'HOLD') {
        console.log(`⏸️ ${symbol} 홀드 신호`);
      }

    } catch (error) {
      console.error(`❌ ${symbol} 거래 실행 중 오류:`, error);
    }
  }

  // 매수 주문 실행
  async executeBuy(symbol, signal, options) {
    console.log(`💰 ${symbol} 매수 신호 확인`);

    // 주문 수량 계산 (계좌 잔고의 10% 또는 options에서 지정)
    const balance = await this.binance.getAccountInfo();
    const usdtBalance = balance.balances.find(b => b.asset === 'USDT');
    const investment = usdtBalance.free * (options.investmentRatio || 0.1);

    // 현재 가격 조회
    const currentPrice = await this.binance.getCurrentPrice(symbol);
    const quantity = investment / currentPrice;

    // 매수 주문
    const order = await this.binance.placeOrder(
      symbol,
      'BUY',
      'MARKET',
      quantity
    );

    // 포지션 저장
    this.positions.set(symbol, {
      orderId: order.orderId,
      symbol,
      quantity: order.executedQty,
      entryPrice: order.fills ? order.fills[0].price : currentPrice,
      stopLoss: signal.stopLoss,
      takeProfit: signal.priceTarget,
      timestamp: new Date()
    });

    console.log(`✅ ${symbol} 매수 주문 완료: ${quantity} ${symbol}`);
  }

  // 매도 주문 실행
  async executeSell(symbol, signal, position) {
    console.log(`💸 ${symbol} 매도 신호 확인`);

    // 매도 주문
    const order = await this.binance.placeOrder(
      symbol,
      'SELL',
      'MARKET',
      position.quantity
    );

    // 수익률 계산
    const pnl = (order.fills[0].price - position.entryPrice) * position.quantity;
    const pnlPercent = (order.fills[0].price - position.entryPrice) / position.entryPrice * 100;

    // 포지션 제거
    this.positions.delete(symbol);

    console.log(`✅ ${symbol} 매도 주문 완료: 수익률 ${pnlPercent.toFixed(2)}%`);

    // 거래 기록 저장
    await this.saveTradeRecord({
      symbol,
      action: 'SELL',
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      exitPrice: order.fills[0].price,
      pnl,
      pnlPercent,
      signal: signal
    });
  }

  // 거래 기록 저장
  async saveTradeRecord(tradeData) {
    // 데이터베이스에 거래 기록 저장
    // 여기에서는 간단히 콘솔 로그만 남깁니다.
    console.log('📝 거래 기록:', tradeData);
  }
}

module.exports = TradingEngine;