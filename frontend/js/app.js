// 프론트엔드 메인 로직
const API_BASE = "http://localhost:8000";

class TradingApp {
    constructor() {
        this.isConnected = false;
        this.isTrading = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStatus();
        this.startPriceUpdates();
        setInterval(() => this.loadStatus(), 5000);
    }

    bindEvents() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connectApi());
        document.getElementById('startTradingBtn').addEventListener('click', () => this.startTrading());
        document.getElementById('stopTradingBtn').addEventListener('click', () => this.stopTrading());
    }

    async connectApi() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const apiSecret = document.getElementById('apiSecret').value.trim();

        if (!apiKey || !apiSecret) {
            this.showMessage('❌ API Key와 Secret을 모두 입력해주세요', 'error');
            return;
        }

        this.showMessage('🔗 바이낸스에 연결중...', 'info');

        try {
            const response = await fetch(`${API_BASE}/api/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    api_key: apiKey, 
                    api_secret: apiSecret 
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                this.isConnected = true;
                this.updateUI();
                this.showMessage('✅ 바이낸스 API 연결 성공!', 'success');
            } else {
                this.showMessage(`❌ 연결 실패: ${result.detail}`, 'error');
            }
        } catch (error) {
            this.showMessage('❌ 서버 연결 실패 - 백엔드가 실행중인지 확인해주세요', 'error');
        }
    }

    async startTrading() {
        const symbol = document.getElementById('symbol').value;
        const quantity = document.getElementById('quantity').value;

        if (!quantity || parseFloat(quantity) <= 0) {
            this.showMessage('❌ 유효한 거래 수량을 입력해주세요', 'error');
            return;
        }

        this.showMessage('🚀 자동매매 시작중...', 'info');

        try {
            const response = await fetch(`${API_BASE}/api/trading/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    symbol: symbol, 
                    quantity: parseFloat(quantity)
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                this.isTrading = true;
                this.updateUI();
                this.showMessage(`✅ ${symbol} 자동매매 시작! (시뮬레이션 모드)`, 'success');
            } else {
                this.showMessage(`❌ 시작 실패: ${result.detail}`, 'error');
            }
        } catch (error) {
            this.showMessage('❌ 서버 연결 실패', 'error');
        }
    }

    async stopTrading() {
        this.showMessage('🛑 자동매매 중지중...', 'info');

        try {
            const response = await fetch(`${API_BASE}/api/trading/stop`, {
                method: 'POST'
            });

            const result = await response.json();
            
            if (response.ok) {
                this.isTrading = false;
                this.updateUI();
                this.showMessage('✅ 자동매매 중지됨!', 'success');
            }
        } catch (error) {
            this.showMessage('❌ 서버 연결 실패', 'error');
        }
    }

    async loadStatus() {
        try {
            const response = await fetch(`${API_BASE}/api/status`);
            const result = await response.json();
            
            this.isConnected = result.is_connected;
            this.isTrading = result.is_trading;
            
            // 포지션 표시
            const positionsDiv = document.getElementById('positions');
            if (result.positions && result.positions.length > 0) {
                positionsDiv.innerHTML = result.positions.map(p => `
                    <div class="position-item ${parseFloat(p.positionAmt) > 0 ? 'buy' : ''}">
                        <strong>${p.symbol}</strong><br>
                        수량: ${p.positionAmt}<br>
                        진입가: ${p.entryPrice || 'N/A'}<br>
                        미실현损益: ${p.unRealizedProfit || '0.00'}
                    </div>
                `).join('');
            } else {
                positionsDiv.innerHTML = '<div class="no-position">보유 포지션이 없습니다</div>';
            }
            
            this.updateUI();
        } catch (error) {
            console.log('상태 로딩 실패:', error);
        }
    }

    async startPriceUpdates() {
        // 실시간 가격 업데이트
        setInterval(async () => {
            try {
                const symbol = document.getElementById('symbol').value;
                const response = await fetch(`${API_BASE}/api/price/${symbol}`);
                const result = await response.json();
                
                if (result.price && result.price !== '0') {
                    const price = parseFloat(result.price).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    document.getElementById('currentPrice').textContent = 
                        `${symbol}: $${price}`;
                }
            } catch (error) {
                console.log('가격 업데이트 실패:', error);
            }
        }, 3000);
    }

    updateUI() {
        // 연결 상태 업데이트
        const connectionStatus = document.getElementById('connectionStatus');
        connectionStatus.textContent = this.isConnected ? '🟢 연결됨' : '🔴 연결안됨';
        connectionStatus.className = `status-value ${this.isConnected ? 'connected' : 'disconnected'}`;
        
        // 매매 상태 업데이트
        const tradingStatus = document.getElementById('tradingStatus');
        tradingStatus.textContent = this.isTrading ? '🟢 매매중' : '🔴 대기중';
        tradingStatus.className = `status-value ${this.isTrading ? 'trading' : 'disconnected'}`;
        
        // 버튼 상태 업데이트
        document.getElementById('startTradingBtn').disabled = !this.isConnected || this.isTrading;
        document.getElementById('stopTradingBtn').disabled = !this.isTrading;
    }

    showMessage(message, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    new TradingApp();
});
// src/App.js
import React from 'react';
import ApiConfig from './components/ApiConfig';
import './App.css';

function App() {
  return (
    <div className="App">
      <ApiConfig />
    </div>
  );
}

export default App;