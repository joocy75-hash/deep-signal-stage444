// services/aiSignalService.js
const axios = require('axios');

class AISignalService {
  constructor() {
    this.aiApiUrl = process.env.AI_API_URL || 'http://localhost:5000/api/predict';
  }

  // AI 신호 조회
  async getSignal(symbol, timeframe = '1h') {
    try {
      const response = await axios.post(this.aiApiUrl, {
        symbol,
        timeframe,
        features: ['price', 'volume', 'rsi', 'macd'] // 필요한 특징들
      });

      return {
        signal: response.data.signal, // 'BUY', 'SELL', 'HOLD'
        confidence: response.data.confidence,
        priceTarget: response.data.priceTarget,
        stopLoss: response.data.stopLoss,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('AI 신호 조회 실패:', error.message);
      return this.getMockSignal(symbol);
    }
  }

  // 개발용 Mock 신호
  getMockSignal(symbol) {
    const signals = ['BUY', 'SELL', 'HOLD'];
    const randomSignal = signals[Math.floor(Math.random() * signals.length)];
    return {
      signal: randomSignal,
      confidence: Math.random(),
      priceTarget: randomSignal === 'BUY' ? 35000 * (1 + Math.random() * 0.05) : 35000 * (1 - Math.random() * 0.05),
      stopLoss: 35000 * (1 - Math.random() * 0.03),
      timestamp: new Date()
    };
  }
}

module.exports = AISignalService;