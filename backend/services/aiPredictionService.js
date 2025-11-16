// services/aiPredictionService.js
const axios = require('axios');

class AIPredictionService {
  constructor() {
    this.aiApiUrl = process.env.AI_API_URL || 'http://localhost:5000/api/predict';
  }

  // AI 신호 예측 요청
  async getPrediction(symbol, features) {
    try {
      const response = await axios.post(this.aiApiUrl, {
        symbol,
        features: features || this.getDefaultFeatures(),
        timeframe: '1h',
        lookback: 100
      });

      return {
        signal: response.data.prediction, // 'BUY', 'SELL', 'HOLD'
        confidence: response.data.confidence,
        price_targets: response.data.targets,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('AI 예측 실패:', error.message);
      return this.getMockPrediction(symbol);
    }
  }

  // 기술적 지표 계산
  calculateTechnicalIndicators(priceData) {
    return {
      rsi: this.calculateRSI(priceData),
      macd: this.calculateMACD(priceData),
      bollinger_bands: this.calculateBollingerBands(priceData),
      volume_profile: this.calculateVolumeProfile(priceData),
      support_resistance: this.findSupportResistance(priceData)
    };
  }

  // 개발용 Mock 예측
  getMockPrediction(symbol) {
    const signals = ['BUY', 'SELL', 'HOLD'];
    const randomSignal = signals[Math.floor(Math.random() * signals.length)];
    
    return {
      signal: randomSignal,
      confidence: Math.random() * 0.3 + 0.7, // 0.7 ~ 1.0
      price_targets: {
        short_term: this.generateMockTarget(symbol, 0.02),
        medium_term: this.generateMockTarget(symbol, 0.05),
        stop_loss: this.generateMockTarget(symbol, -0.03)
      },
      indicators: {
        rsi: Math.random() * 100,
        macd: (Math.random() - 0.5) * 2,
        trend: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH'
      },
      timestamp: new Date()
    };
  }
}

module.exports = AIPredictionService;