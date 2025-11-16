import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './TradingControl.css';

const TradingControl = () => {
  const [tradingStatus, setTradingStatus] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [config, setConfig] = useState({
    symbols: ['BTCUSDT', 'ETHUSDT'],
    investmentPerTrade: 10,
    maxOpenTrades: 2,
    riskRewardRatio: 1.5,
    checkInterval: 60000
  });

  useEffect(() => {
    loadTradingStatus();
    loadPredictions();
    
    const interval = setInterval(() => {
      loadTradingStatus();
      loadPredictions();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadTradingStatus = async () => {
    try {
      const response = await api.getTradingStatus();
      if (response.success) {
        setTradingStatus(response.data);
      }
    } catch (error) {
      console.error('Trading status load failed:', error);
    }
  };

  const loadPredictions = async () => {
    try {
      const response = await api.getPrediction('BTCUSDT');
      if (response.success) {
        setPredictions(prev => {
          const newPreds = [response.data, ...prev.slice(0, 4)];
          return newPreds;
        });
      }
    } catch (error) {
      console.error('Prediction load failed:', error);
    }
  };

  const startTrading = async () => {
    setIsStarting(true);
    try {
      const response = await api.startTrading(config);
      if (response.success) {
        alert('✅ AI 트레이딩이 시작되었습니다!');
        loadTradingStatus();
      } else {
        alert('❌ 시작 실패: ' + response.error);
      }
    } catch (error) {
      alert('❌ 요청 실패: ' + error.message);
    } finally {
      setIsStarting(false);
    }
  };

  const stopTrading = async () => {
    try {
      const response = await api.stopTrading();
      if (response.success) {
        alert('🛑 AI 트레이딩이 정지되었습니다!');
        loadTradingStatus();
      } else {
        alert('❌ 정지 실패: ' + response.error);
      }
    } catch (error) {
      alert('❌ 요청 실패: ' + error.message);
    }
  };

  const getSignalColor = (signal) => {
    switch (signal) {
      case 'BUY': return 'var(--profit-color)';
      case 'SELL': return 'var(--loss-color)';
      case 'HOLD': return '#ffaa00';
      default: return 'var(--text-color)';
    }
  };

  return (
    <div className="trading-control">
      <div className="card">
        <h2>⚡ AI 자동매매 제어</h2>

        <div className="trading-status card">
          <h3>🤖 현재 트레이딩 상태</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>상태</h3>
              <p style={{ color: tradingStatus?.isRunning ? 'var(--profit-color)' : 'var(--loss-color)' }}>
                {tradingStatus?.isRunning ? '🚀 실행 중' : '🛑 정지'}
              </p>
            </div>
            <div className="stat-card">
              <h3>총 거래</h3>
              <p>{tradingStatus?.stats?.totalTrades || 0}</p>
            </div>
            <div className="stat-card">
              <h3>성공률</h3>
              <p>{tradingStatus?.stats?.successRate?.toFixed(1) || 0}%</p>
            </div>
            <div className="stat-card">
              <h3>총 수익</h3>
              <p className={tradingStatus?.stats?.totalProfit >= 0 ? 'profit' : 'loss'}>
                ${tradingStatus?.stats?.totalProfit?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="trading-config card">
          <h3>⚙️ 트레이딩 설정</h3>
          <div className="form-grid">
            <div>
              <label>
                거래 심볼 (쉼표로 구분)
                <input 
                  type="text" 
                  value={config.symbols.join(',')}
                  onChange={(e) => setConfig({
                    ...config, 
                    symbols: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  })}
                  placeholder="BTCUSDT,ETHUSDT,ADAUSDT"
                />
              </label>
            </div>
            <div>
              <label>
                거래당 투자 금액 (USDT)
                <input 
                  type="number" 
                  value={config.investmentPerTrade}
                  onChange={(e) => setConfig({
                    ...config, 
                    investmentPerTrade: parseFloat(e.target.value) || 10
                  })}
                  min="1"
                  max="1000"
                />
              </label>
            </div>
            <div>
              <label>
                최대 오픈 거래 수
                <input 
                  type="number" 
                  value={config.maxOpenTrades}
                  onChange={(e) => setConfig({
                    ...config, 
                    maxOpenTrades: parseInt(e.target.value) || 1
                  })}
                  min="1"
                  max="10"
                />
              </label>
            </div>
            <div>
              <label>
                위험/보상 비율
                <input 
                  type="number" 
                  step="0.1"
                  value={config.riskRewardRatio}
                  onChange={(e) => setConfig({
                    ...config, 
                    riskRewardRatio: parseFloat(e.target.value) || 1.5
                  })}
                  min="1.0"
                  max="5.0"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="trading-actions card">
          <h3>🎮 제어 액션</h3>
          <div className="actions-grid">
            <button 
              onClick={startTrading} 
              disabled={isStarting || tradingStatus?.isRunning}
              className="start-btn"
            >
              {isStarting ? '⏳ 시작 중...' : '🚀 트레이딩 시작'}
            </button>
            <button 
              onClick={stopTrading} 
              disabled={!tradingStatus?.isRunning}
              className="stop-btn"
            >
              🛑 트레이딩 정지
            </button>
            <button onClick={loadTradingStatus} className="refresh-btn">
              🔄 상태 새로고침
            </button>
            <button onClick={loadPredictions} className="refresh-btn">
              🔮 예측 새로고침
            </button>
          </div>
        </div>

        <div className="predictions-section card">
          <h3>🔮 AI 예측 신호</h3>
          <div className="stats-grid">
            {predictions.map((prediction, index) => (
              <div key={index} className="stat-card" style={{ borderLeftColor: getSignalColor(prediction.signal) }}>
                <h3>{prediction.symbol}</h3>
                <p style={{ color: getSignalColor(prediction.signal), fontSize: '1.2rem' }}>
                  {prediction.signal} ({(prediction.confidence * 100).toFixed(1)}%)
                </p>
                <small>${prediction.price?.toLocaleString()}</small>
                <br />
                <small style={{ opacity: 0.7 }}>{prediction.reason}</small>
              </div>
            ))}
          </div>
        </div>

        {tradingStatus?.positions && tradingStatus.positions.length > 0 && (
          <div className="current-positions card">
            <h3>📋 현재 오픈 포지션</h3>
            <table>
              <thead>
                <tr>
                  <th>심볼</th>
                  <th>액션</th>
                  <th>수량</th>
                  <th>진입 가격</th>
                  <th>현재 가격</th>
                  <th>스탑로스</th>
                  <th>테이크프로핏</th>
                </tr>
              </thead>
              <tbody>
                {tradingStatus.positions.map((position, index) => (
                  <tr key={index}>
                    <td>{position.symbol}</td>
                    <td>{position.action}</td>
                    <td>{position.quantity?.toFixed(6)}</td>
                    <td>${position.entryPrice?.toLocaleString()}</td>
                    <td>${position.aiPrediction?.price?.toLocaleString()}</td>
                    <td>${position.stopLoss?.toLocaleString()}</td>
                    <td>${position.takeProfit?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingControl;