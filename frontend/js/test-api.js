// test-api.js - API 연결 테스트 전용
class APITester {
    constructor() {
        this.results = [];
        this.testCount = 0;
        this.passCount = 0;
    }

    async runAllTests() {
        console.log('🚀 API 연결 종합 테스트 시작');
        
        await this.testModuleLoading();
        await this.testBackendConnection();
        await this.testBinanceAPI();
        await this.showResults();
    }

    async testModuleLoading() {
        this.testCount++;
        try {
            if (typeof Utils !== 'undefined' && 
                typeof BinanceAPI !== 'undefined' && 
                typeof TradingEngine !== 'undefined') {
                console.log('✅ 모듈 로딩 테스트: PASS');
                this.passCount++;
                return true;
            } else {
                throw new Error('일부 모듈이 로드되지 않음');
            }
        } catch (error) {
            console.log('❌ 모듈 로딩 테스트: FAIL -', error.message);
            return false;
        }
    }

    async testBackendConnection() {
        this.testCount++;
        try {
            // 백엔드 연결 테스트
            const response = await fetch('http://localhost:8000/api/status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ 백엔드 연결 테스트: PASS', data);
                this.passCount++;
                return true;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.log('❌ 백엔드 연결 테스트: FAIL -', error.message);
            console.log('💡 백엔드 서버가 실행 중인지 확인하세요: python main.py');
            return false;
        }
    }

    async testBinanceAPI() {
        this.testCount++;
        try {
            if (typeof BinanceAPI === 'undefined') {
                throw new Error('BinanceAPI 모듈이 로드되지 않음');
            }

            // 테스트넷 공용 API 키로 기본 연결 테스트
            const price = await BinanceAPI.getCurrentPrice('BTCUSDT');
            
            if (price && price.symbol) {
                console.log('✅ Binance API 연결 테스트: PASS', price);
                this.passCount++;
                return true;
            } else {
                throw new Error('가격 데이터를 가져오지 못함');
            }
        } catch (error) {
            console.log('❌ Binance API 연결 테스트: FAIL -', error.message);
            return false;
        }
    }

    showResults() {
        console.log('\n📊 테스트 결과 요약');
        console.log(`총 테스트: ${this.testCount}개`);
        console.log(`통과: ${this.passCount}개`);
        console.log(`실패: ${this.testCount - this.passCount}개`);
        console.log(`성공률: ${((this.passCount / this.testCount) * 100).toFixed(1)}%`);

        if (this.passCount === this.testCount) {
            console.log('🎉 모든 테스트 통과! API 연결이 정상입니다.');
        } else {
            console.log('🔧 일부 테스트가 실패했습니다. 문제를 해결해주세요.');
        }
    }
}

// 테스트 실행 함수
window.runAPITests = function() {
    const tester = new APITester();
    return tester.runAllTests();
};

console.log('🔧 API 테스트가 준비되었습니다. 콘솔에서 "runAPITests()"를 실행하세요.');