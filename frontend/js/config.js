// API 설정
const CONFIG = {
    API_BASE_URL: 'http://127.0.0.1:8001',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            ME: '/api/auth/me',
            VERIFY_TOKEN: '/api/auth/verify-token'
        },
        CRYPTO: {
            PRICES: '/api/crypto/prices',
            BALANCES: '/api/crypto/balances',
            EXCHANGE_INFO: '/api/crypto/exchange-info',
            SERVER_TIME: '/api/crypto/server-time',
            TEST_CONNECTION: '/api/crypto/test-connection'
        }
    }
};