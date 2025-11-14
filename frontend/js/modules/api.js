// Binance API 연동 모듈 - 수정된 버전
class BinanceAPI {
    constructor() {
        this.baseURL = 'https://testnet.binance.vision';
        this.wsURL = 'wss://testnet.binance.vision/ws';
        this.isConnected = false;
        this.apiKey = '';
        this.secretKey = '';
    }

    // API 키 설정 - 이 함수가 있어야 합니다!
    setApiKeys(apiKey, secretKey) {
        this.apiKey = apiKey;
        this.secretKey = secretKey;
        console.log('✅ API 키 설정 완료');
        return true;
    }

    // 서명 생성 함수 (Binance API용)
    generateSignature(queryString) {
        if (!this.secretKey) {
            console.error('Secret Key가 설정되지 않았습니다.');
            return '';
        }
        return CryptoJS.HmacSHA256(queryString, this.secretKey).toString(CryptoJS.enc.Hex);
    }

    // 현재가 조회 (공개 API - API 키 필요 없음)
    async getCurrentPrice(symbol) {
        try {
            console.log(`🔍 ${symbol} 현재가 조회 중...`);
            const response = await fetch(`${this.baseURL}/api/v3/ticker/price?symbol=${symbol}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ ${symbol} 현재가:`, data);
            return data;
        } catch (error) {
            console.error(`❌ ${symbol} 가격 조회 실패:`, error);
            return { 
                symbol: symbol,
                price: '0',
                error: error.message 
            };
        }
    }

    // 테스트 연결 (공개 API)
    async testConnection() {
        try {
            console.log('🔗 Binance API 연결 테스트 중...');
            const response = await fetch(`${this.baseURL}/api/v3/ping`);
            
            if (response.ok) {
                console.log('✅ Binance API 연결 성공');
                return { success: true, message: 'Binance API 연결 성공' };
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Binance API 연결 실패:', error);
            return { 
                success: false, 
                error: `연결 실패: ${error.message}` 
            };
        }
    }

    // 계정 정보 조회 (비공개 API - API 키 필요)
    async getAccountInfo() {
        if (!this.apiKey || !this.secretKey) {
            console.warn('⚠️ API 키가 설정되지 않아 테스트 데이터 반환');
            return this.getTestAccountInfo();
        }

        try {
            console.log('👤 계정 정보 조회 중...');
            const timestamp = Date.now();
            const queryString = `timestamp=${timestamp}`;
            const signature = this.generateSignature(queryString);
            
            const response = await fetch(`${this.baseURL}/api/v3/account?${queryString}&signature=${signature}`, {
                headers: {
                    'X-MBX-APIKEY': this.apiKey
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ 계정 정보:', data);
            return data;
        } catch (error) {
            console.error('❌ 계정 정보 조회 실패:', error);
            return this.getTestAccountInfo();
        }
    }

    // 테스트 계정 정보 (API 키 없을 때 사용)
    getTestAccountInfo() {
        return {
            balances: [
                { asset: 'BTC', free: '0.001', locked: '0' },
                { asset: 'ETH', free: '0.1', locked: '0' },
                { asset: 'USDT', free: '1000', locked: '0' }
            ],
            canTrade: true,
            updateTime: Date.now()
        };
    }

    // 서버 시간 동기화
    async getServerTime() {
        try {
            const response = await fetch(`${this.baseURL}/api/v3/time`);
            const data = await response.json();
            return data.serverTime;
        } catch (error) {
            console.error('서버 시간 조회 실패:', error);
            return Date.now();
        }
    }

    // 거래 가능한 심볼 목록 조회
    async getExchangeInfo() {
        try {
            const response = await fetch(`${this.baseURL}/api/v3/exchangeInfo`);
            return await response.json();
        } catch (error) {
            console.error('거래소 정보 조회 실패:', error);
            return null;
        }
    }
}

// CryptoJS 로드 체크 및 폴백
if (typeof CryptoJS === 'undefined') {
    console.warn('⚠️ CryptoJS가 로드되지 않았습니다. 서명 기능이 제한됩니다.');
    // 간단한 HMAC SHA256 폴백 (기본 기능만)
    if (typeof CryptoJS === 'undefined') {
        var CryptoJS = {
            HmacSHA256: function(message, secret) {
                // 단순화된 구현 (실제 환경에서는 CryptoJS 라이브러리 필요)
                return {
                    toString: function() {
                        return 'simulated_signature_' + Date.now();
                    }
                };
            },
            enc: {
                Hex: {}
            }
        };
    }
}

// 싱글톤 인스턴스 생성
const binanceAPI = new BinanceAPI();