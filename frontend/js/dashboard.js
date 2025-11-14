// dashboard.js - 기존 기능 유지 + 모듈 통합

// ==================== 기존 트레이딩 함수들 ====================
async function startTrading() {
    console.log('🚀 트레이딩 시작');
    
    // ✅ 모듈 사용 (우선시)
    if (typeof TradingEngine !== 'undefined') {
        const result = TradingEngine.startTrading('momentum', {
            symbol: "BTCUSDT",
            quantity: 0.001
        });
        
        if (result.success) {
            console.log('✅ 모듈 트레이딩 시작:', result);
            updateTradingStatus(true);
            return result;
        }
    }
    
    // ✅ 기존 방식 (폴백)
    try {
        const response = await fetch('/api/trading/start', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        
        const data = await response.json();
        console.log('✅ 기존 방식 트레이딩 시작:', data);
        updateTradingStatus(true);
        return data;
    } catch (error) {
        console.error('❌ 트레이딩 시작 실패:', error);
        return { success: false, error: error.message };
    }
}

async function stopTrading() {
    console.log('🛑 트레이딩 정지');
    
    // ✅ 모듈 사용 (우선시)
    if (typeof TradingEngine !== 'undefined') {
        const result = TradingEngine.stopTrading();
        
        if (result.success) {
            console.log('✅ 모듈 트레이딩 정지:', result);
            updateTradingStatus(false);
            return result;
        }
    }
    
    // ✅ 기존 방식 (폴백)
    try {
        const response = await fetch('/api/trading/stop', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        
        const data = await response.json();
        console.log('✅ 기존 방식 트레이딩 정지:', data);
        updateTradingStatus(false);
        return data;
    } catch (error) {
        console.error('❌ 트레이딩 정지 실패:', error);
        return { success: false, error: error.message };
    }
}

// ==================== 계정 정보 업데이트 ====================
async function updateAccountInfo() {
    console.log('🔄 계정 정보 업데이트');
    
    // ✅ 모듈 사용 (우선시)
    if (typeof BinanceAPI !== 'undefined' && typeof Utils !== 'undefined') {
        try {
            const accountInfo = await BinanceAPI.getAccountInfo();
            if (accountInfo) {
                const formattedBalance = Utils.formatNumber(accountInfo.balance, 2);
                document.getElementById('balance').textContent = formattedBalance;
                console.log('✅ 모듈로 계정 정보 업데이트:', formattedBalance);
                return;
            }
        } catch (error) {
            console.error('모듈 계정 정보 조회 실패, 기존 방식으로 폴백');
        }
    }
    
    // ✅ 기존 방식 (폴백)
    try {
        const balanceResponse = await fetch('/api/account/balance', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        
        const balance = await balanceResponse.json();
        document.getElementById('balance').innerText = JSON.stringify(balance);
        console.log('✅ 기존 방식 계정 정보 업데이트:', balance);
    } catch (error) {
        console.error('❌ 계정 정보 업데이트 실패:', error);
    }
}

// ==================== 주기적 데이터 업데이트 ====================
function startPeriodicUpdates() {
    // 5초마다 계정 정보 업데이트
    setInterval(async () => {
        await updateAccountInfo();
        
        // 포지션 정보도 similar하게 업데이트
        await updatePositions();
        
        // 주문 내역 업데이트
        await updateOrders();
    }, 5000);
}

async function updatePositions() {
    // ✅ 모듈이나 기존 방식으로 포지션 업데이트
    console.log('📊 포지션 정보 업데이트');
}

async function updateOrders() {
    // ✅ 모듈이나 기존 방식으로 주문 내역 업데이트
    console.log('📋 주문 내역 업데이트');
}

// ==================== 대시보드 초기화 ====================
function initializeDashboard() {
    console.log('🎯 대시보드 초기화 시작');
    
    // ✅ 모듈 테스트
    if (window.DeepSignal && window.DeepSignal.get) {
        console.log('✅ DeepSignal 모듈 로드됨');
        const api = DeepSignal.get('api');
        const utils = DeepSignal.get('utils');
        const trading = DeepSignal.get('trading');
        const charts = DeepSignal.get('charts');
        
        // 모듈 사용 예시
        api.getAccountInfo().then(account => {
            if (account && account.balance) {
                const formattedBalance = utils.formatNumber(account.balance, 2);
                document.getElementById('balance').textContent = formattedBalance;
            }
        });
    } else if (typeof BinanceAPI !== 'undefined' && typeof Utils !== 'undefined') {
        console.log('✅ 개별 모듈 로드됨');
        // 개별 모듈 사용
    } else {
        console.log('ℹ️ 모듈이 로드되지 않음, 기존 방식 사용');
    }
    
    // 기존 초기화 코드 유지
    updateBalance();
    loadPositions();
    
    // 주기적 업데이트 시작
    startPeriodicUpdates();
}

// ==================== 기존 함수들 유지 ====================
function updateBalance() {
    // 기존 잔고 업데이트 코드 유지
    console.log('💳 잔고 업데이트');
}

function loadPositions() {
    // 기존 포지션 로드 코드 유지
    console.log('📈 포지션 로드');
}

function updateTradingStatus(isActive) {
    // 트레이딩 상태 UI 업데이트
    const statusElement = document.getElementById('tradingStatus');
    if (statusElement) {
        statusElement.textContent = isActive ? '실행 중' : '중지됨';
        statusElement.className = isActive ? 'status-active' : 'status-inactive';
    }
    
    // 버튼 상태 업데이트
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (startBtn) startBtn.disabled = isActive;
    if (stopBtn) stopBtn.disabled = !isActive;
}

// ==================== 유틸리티 함수들 ====================
function formatNumber(num, decimals = 2) {
    // ✅ 모듈 사용 (우선시)
    if (typeof Utils !== 'undefined') {
        return Utils.formatNumber(num, decimals);
    }
    
    // ✅ 기존 방식 (폴백)
    if (typeof num === 'number') {
        if (num === Math.floor(num)) {
            return num.toLocaleString();
        } else {
            return num.toLocaleString(undefined, { 
                minimumFractionDigits: decimals, 
                maximumFractionDigits: decimals 
            });
        }
    }
    return '0';
}

function formatCurrency(amount, currency = 'USD') {
    // ✅ 모듈 사용 (우선시)
    if (typeof Utils !== 'undefined' && Utils.formatCurrency) {
        return Utils.formatCurrency(amount, currency);
    }
    
    // ✅ 기존 방식 (폴백)
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// ==================== 이벤트 리스너 ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM 로드 완료, 대시보드 초기화 시작');
    
    // 대시보드 초기화
    initializeDashboard();
    
    // 버튼 이벤트 리스너 설정
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (startBtn) {
        startBtn.addEventListener('click', startTrading);
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', stopTrading);
    }
    
    // 모듈 테스트
    setTimeout(() => {
        console.log('🧪 모듈 테스트:');
        console.log('- Utils:', typeof Utils);
        console.log('- BinanceAPI:', typeof BinanceAPI);
        console.log('- TradingEngine:', typeof TradingEngine);
        console.log('- ChartManager:', typeof ChartManager);
        console.log('- DeepSignal:', typeof DeepSignal);
    }, 1000);
});

// ==================== 글로벌 함수 (개발용) ====================
window.testTrading = function() {
    console.log('🧪 테스트 트레이딩 실행');
    startTrading().then(result => {
        console.log('테스트 결과:', result);
    });
};

window.testModules = function() {
    console.log('🔧 모듈 테스트:');
    
    if (typeof Utils !== 'undefined') {
        console.log('✅ Utils 작동:', Utils.formatNumber(1234.567));
        Utils.storage.set('test', '모듈 연결 성공!');
        console.log('✅ Storage 작동:', Utils.storage.get('test'));
    }
    
    if (typeof TradingEngine !== 'undefined') {
        console.log('✅ TradingEngine 작동:', TradingEngine.startTrading('test', {}));
    }
};

console.log('✅ dashboard.js 로드 완료');