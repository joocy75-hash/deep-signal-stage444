// 메인 애플리케이션 로더
class DeepSignalApp {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
    }

    // 앱 초기화
    async init() {
        try {
            console.log('DeepSignal 앱 초기화 중...');
            
            // 모듈들 초기화
            this.modules.api = binanceAPI;
            this.modules.trading = tradingEngine;
            this.modules.charts = chartManager;
            this.modules.utils = Utils;

            // 글로벌에서 접근 가능하게 (기존 코드 호환성)
            window.DeepSignal = this;
            window.BinanceAPI = binanceAPI;
            window.TradingEngine = tradingEngine;

            this.isInitialized = true;
            console.log('✅ DeepSignal 앱 초기화 완료');
            
            return true;
        } catch (error) {
            console.error('❌ 앱 초기화 실패:', error);
            return false;
        }
    }

    // 모듈 가져오기
    get(moduleName) {
        return this.modules[moduleName];
    }
}

// 앱 인스턴스 생성 및 초기화
const app = new DeepSignalApp();

// DOM이 로드되면 자동 초기화
document.addEventListener('DOMContentLoaded', function() {
    app.init().then(success => {
        if (success) {
            // 초기화 성공 시 추가 작업
            if (typeof onAppReady === 'function') {
                onAppReady();
            }
        }
    });
});