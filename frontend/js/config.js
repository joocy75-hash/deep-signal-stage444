// 환경 설정
const CONFIG = {
    API_BASE_URL: 'http://localhost:8000',
    APP_NAME: 'DeepSignal AI',
    VERSION: '1.0.0',
    
    // AI 전략 설정
    STRATEGIES: {
        momentum: {
            name: '모멘텀 전략',
            description: '추세 따라가기 전략',
            risk: '중간',
            recommended: true
        },
        meanReversion: {
            name: '평균회귀 전략', 
            description: '되돌림 포착 전략',
            risk: '낮음',
            recommended: false
        },
        volatility: {
            name: '변동성 돌파',
            description: '돌파 신호 매매',
            risk: '높음',
            recommended: false
        },
        aiEnhanced: {
            name: 'AI 강화 전략',
            description: '다중 지표 분석',
            risk: '중간',
            recommended: true
        }
    },
    
    // 거래소 설정
    EXCHANGES: {
        binance: {
            name: 'Binance',
            testnet: true,
            supported: true
        },
        bybit: {
            name: 'Bybit', 
            testnet: true,
            supported: false
        },
        bitget: {
            name: 'Bitget',
            testnet: false,
            supported: false
        }
    }
};

// 전역 유틸리티 함수
const Utils = {
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    },
    
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    formatPercent(value) {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    },
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    showNotification(message, type = 'info') {
        // 알림 표시 로직
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
};