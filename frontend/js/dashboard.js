// js/dashboard.js - 업데이트된 버전
class Dashboard {
    constructor() {
        this.api = window.apiService;
        this.updateInterval = null;
        this.isAutoRefresh = true;
        this.init();
    }

    async init() {
        console.log('📊 대시보드 초기화 중...');
        
        // 서버 상태 확인
        await this.checkServerStatus();
        
        // 초기 데이터 로드
        await this.loadDashboardData();
        
        // 실시간 업데이트 시작
        this.startAutoRefresh();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
    }

    async checkServerStatus() {
        try {
            const health = await this.api.checkHealth();
            this.updateServerStatus('connected', '서버 연결됨');
        } catch (error) {
            this.updateServerStatus('error', '서버 연결 실패');
        }
    }

    async loadDashboardData() {
        try {
            // 여러 API를 병렬로 호출
            const [dashboardData, accountInfo, positions] = await Promise.all([
                this.api.getDashboardData(),
                this.api.getAccountInfo(),
                this.api.getOpenPositions()
            ]);

            this.updateAccountInfo(accountInfo);
            this.updatePositions(positions);
            this.updateMarketData(dashboardData);
            
        } catch (error) {
            console.error('대시보드 데이터 로드 실패:', error);
            this.showError('데이터를 불러오는데 실패했습니다.');
        }
    }

    updateAccountInfo(accountData) {
        const accountElement = document.getElementById('accountInfo');
        if (accountElement) {
            accountElement.innerHTML = `
                <div class="account-summary">
                    <h3>계좌 정보</h3>
                    <p>총 자산: $${accountData.totalBalance?.toLocaleString() || '0'}</p>
                    <p>사용 가능: $${accountData.availableBalance?.toLocaleString() || '0'}</p>
                </div>
            `;
        }

        // 잔고 목록 업데이트
        this.updateBalances(accountData.balances || []);
    }

    updateBalances(balances) {
        const balancesElement = document.getElementById('balancesList');
        if (balancesElement) {
            balancesElement.innerHTML = balances
                .filter(balance => parseFloat(balance.usdValue) > 1)
                .map(balance => `
                    <div class="balance-item">
                        <span class="asset">${balance.asset}</span>
                        <span class="amount">${parseFloat(balance.free).toFixed(4)}</span>
                        <span class="usd-value">$${parseFloat(balance.usdValue).toLocaleString()}</span>
                    </div>
                `).join('');
        }
    }

    updatePositions(positions) {
        const positionsElement = document.getElementById('positionsList');
        if (positionsElement) {
            if (positions && positions.length > 0) {
                positionsElement.innerHTML = positions.map(position => `
                    <div class="position-item ${position.pnl >= 0 ? 'profit' : 'loss'}">
                        <div class="symbol">${position.symbol}</div>
                        <div class="amount">${position.amount}</div>
                        <div class="entry-price">$${position.entryPrice}</div>
                        <div class="current-price">$${position.currentPrice}</div>
                        <div class="pnl">${position.pnl >= 0 ? '+' : ''}${position.pnl}</div>
                        <div class="pnl-percent">${position.pnlPercent}%</div>
                    </div>
                `).join('');
            } else {
                positionsElement.innerHTML = '<div class="no-positions">오픈 포지션이 없습니다.</div>';
            }
        }
    }

    updateMarketData(marketData) {
        // 시장 데이터 업데이트
        const marketElement = document.getElementById('marketData');
        if (marketElement && marketData.prices) {
            // 가격 정보 업데이트
            Object.entries(marketData.prices).forEach(([symbol, price]) => {
                const priceElement = document.getElementById(`price-${symbol}`);
                if (priceElement) {
                    priceElement.textContent = `$${parseFloat(price).toLocaleString()}`;
                }
            });
        }
    }

    updateServerStatus(status, message) {
        const statusElement = document.getElementById('serverStatus');
        if (statusElement) {
            statusElement.className = `status ${status}`;
            statusElement.textContent = message;
        }
    }

    startAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(async () => {
            if (this.isAutoRefresh) {
                await this.loadDashboardData();
            }
        }, 5000); // 5초마다 업데이트
    }

    setupEventListeners() {
        // 새로고침 버튼
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }

        // 자동 새로고침 토글
        const autoRefreshToggle = document.getElementById('autoRefreshToggle');
        if (autoRefreshToggle) {
            autoRefreshToggle.addEventListener('change', (e) => {
                this.isAutoRefresh = e.target.checked;
            });
        }
    }

    showError(message) {
        // 에러 메시지 표시 (기존 알림 시스템 활용)
        console.error('대시보드 오류:', message);
        alert(message); // 임시로 alert 사용, 실제로는 토스트 메시지로 변경
    }
}

// 대시보드 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});