// 프론트엔드 메인 로직 - 백엔드 API와 완전 연동
class TradingApp {
    constructor() {
        this.api = window.apiService;
        this.isConnected = false;
        this.isTrading = false;
        this.currentPrices = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkBackendStatus();
        this.startPriceUpdates();
        setInterval(() => this.checkBackendStatus(), 10000);
    }

    bindEvents() {
        // 로그인/회원가입 이벤트
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }
        
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.handleRegister());
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // 트레이딩 이벤트
        const startBtn = document.getElementById('startTradingBtn');
        const stopBtn = document.getElementById('stopTradingBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startTrading());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopTrading());
        }

        // API 키 등록 이벤트
        const apiKeyBtn = document.getElementById('registerApiKeyBtn');
        if (apiKeyBtn) {
            apiKeyBtn.addEventListener('click', () => this.registerApiKeys());
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showMessage('❌ 이메일과 비밀번호를 입력해주세요', 'error');
            return;
        }

        try {
            const result = await this.api.login({ email, password });
            if (result.success) {
                this.showMessage('✅ 로그인 성공!', 'success');
                this.updateUI();
            } else {
                this.showMessage(`❌ 로그인 실패: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage('❌ 서버 연결 실패', 'error');
        }
    }

    async handleRegister() {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const fullName = document.getElementById('registerName').value;

        if (!email || !password || !fullName) {
            this.showMessage('❌ 모든 필드를 입력해주세요', 'error');
            return;
        }

        try {
            const result = await this.api.register({
                email,
                password,
                full_name: fullName
            });

            if (result.success) {
                this.showMessage('✅ 회원가입 성공! 로그인해주세요.', 'success');
                // 회원가입 폼 초기화
                document.getElementById('registerEmail').value = '';
                document.getElementById('registerPassword').value = '';
                document.getElementById('registerName').value = '';
            } else {
                this.showMessage(`❌ 회원가입 실패: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage('❌ 서버 연결 실패', 'error');
        }
    }

    async handleLogout() {
        // 간단한 로그아웃 처리
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        this.showMessage('✅ 로그아웃 되었습니다.', 'success');
        this.updateUI();
    }

    async startTrading() {
        const symbol = document.getElementById('symbol').value || 'BTCUSDT';
        const quantity = document.getElementById('quantity').value || '0.001';

        if (!quantity || parseFloat(quantity) <= 0) {
            this.showMessage('❌ 유효한 거래 수량을 입력해주세요', 'error');
            return;
        }

        this.showMessage('🚀 AI 자동매매 시작중...', 'info');

        try {
            const result = await this.api.startAutoTrading({
                symbols: [symbol],
                investmentPerTrade: parseFloat(quantity),
                maxOpenTrades: 1,
                riskRewardRatio: 1.5,
                checkInterval: 60000
            });

            if (result.success) {
                this.isTrading = true;
                this.showMessage(`✅ ${symbol} AI 자동매매 시작!`, 'success');
                this.updateUI();
            } else {
                this.showMessage(`❌ 시작 실패: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage('❌ 서버 연결 실패', 'error');
        }
    }

    async stopTrading() {
        this.showMessage('🛑 AI 자동매매 중지중...', 'info');

        try {
            const result = await this.api.stopAutoTrading();
            if (result.success) {
                this.isTrading = false;
                this.showMessage('✅ AI 자동매매 중지됨!', 'success');
                this.updateUI();
            } else {
                this.showMessage(`❌ 중지 실패: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage('❌ 서버 연결 실패', 'error');
        }
    }

    async registerApiKeys() {
        const exchangeName = document.getElementById('exchangeName').value || 'binance';
        const apiKey = document.getElementById('apiKey').value;
        const secretKey = document.getElementById('apiSecret').value;

        if (!apiKey || !secretKey) {
            this.showMessage('❌ API Key와 Secret을 모두 입력해주세요', 'error');
            return;
        }

        this.showMessage('🔑 API 키 등록중...', 'info');

        try {
            const result = await this.api.registerApiKeys({
                exchange_name: exchangeName,
                api_key: apiKey,
                secret_key: secretKey
            });
            
            if (result.success) {
                this.showMessage('✅ API 키 등록 성공!', 'success');
                // 입력 필드 초기화
                document.getElementById('apiKey').value = '';
                document.getElementById('apiSecret').value = '';
            } else {
                this.showMessage(`❌ 등록 실패: ${result.detail || result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage('❌ 서버 연결 실패', 'error');
        }
    }

    async checkBackendStatus() {
        try {
            const result = await this.api.checkHealth();
            this.isConnected = result.status === 'OK';
            this.updateUI();
        } catch (error) {
            this.isConnected = false;
            this.updateUI();
        }
    }

    async startPriceUpdates() {
        // 실시간 가격 업데이트
        setInterval(async () => {
            if (!this.isConnected) return;

            try {
                const symbol = document.getElementById('symbol').value || 'BTCUSDT';
                const result = await this.api.getCurrentPrice(symbol);
                
                if (result && result.price) {
                    const price = parseFloat(result.price).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    
                    const priceElement = document.getElementById('currentPrice');
                    if (priceElement) {
                        priceElement.textContent = `${symbol}: $${price}`;
                    }
                    
                    this.currentPrices[symbol] = result.price;
                }
            } catch (error) {
                console.log('가격 업데이트 실패:', error);
            }
        }, 3000);
    }

    updateUI() {
        // 백엔드 연결 상태
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.textContent = this.isConnected ? '🟢 백엔드 연결됨' : '🔴 백엔드 연결안됨';
            connectionStatus.className = `status ${this.isConnected ? 'connected' : 'disconnected'}`;
        }
        
        // 트레이딩 버튼 상태
        const startBtn = document.getElementById('startTradingBtn');
        const stopBtn = document.getElementById('stopTradingBtn');
        
        if (startBtn) startBtn.disabled = !this.isConnected || this.isTrading;
        if (stopBtn) stopBtn.disabled = !this.isTrading;
    }

    showMessage(message, type) {
        const messageDiv = document.getElementById('message') || this.createMessageDiv();
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
    
    createMessageDiv() {
        const div = document.createElement('div');
        div.id = 'message';
        div.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            display: none;
        `;
        document.body.appendChild(div);
        return div;
    }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.tradingApp = new TradingApp();
    
    // CSS 동적 추가
    const style = document.createElement('style');
    style.textContent = `
        .message.success { background: #28a745; }
        .message.error { background: #dc3545; }
        .message.info { background: #17a2b8; }
        .status.connected { color: #28a745; }
        .status.disconnected { color: #dc3545; }
    `;
    document.head.appendChild(style);
});
