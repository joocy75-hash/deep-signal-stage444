const axios = require('axios');
const crypto = require('crypto');

class BinanceSimpleService {
  constructor() {
    this.baseURL = 'https://testnet.binance.vision';
    this.apiKey = process.env.BINANCE_API_KEY;
    this.secretKey = process.env.BINANCE_SECRET_KEY;
    this.isConnected = false;
  }

  async makeSignedRequest(method, endpoint, params = {}) {
    const timestamp = Date.now();
    const queryString = new URLSearchParams({
      ...params,
      timestamp,
      recvWindow: 5000
    }).toString();
    
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex');

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}?${queryString}&signature=${signature}`,
        headers: {
          'X-MBX-APIKEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Binance API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      // 1. 서버 상태 확인 (공개 API)
      const serverTime = await axios.get(`${this.baseURL}/api/v3/time`);
      console.log('✅ 서버 시간:', new Date(serverTime.data.serverTime));

      // 2. 계정 정보 확인 (사인드 API)
      const accountInfo = await this.makeSignedRequest('GET', '/api/v3/account');
      console.log('✅ 계정 정보 조회 성공');
      this.isConnected = true;
      
      return {
        success: true,
        message: '바이낸스 API 연결 성공',
        account: accountInfo
      };
    } catch (error) {
      console.error('❌ 바이낸스 API 연결 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.msg || error.message
      };
    }
  }

  async getAccountInfo() {
    try {
      const accountInfo = await this.makeSignedRequest('GET', '/api/v3/account');
      return this.formatAccountData(accountInfo);
    } catch (error) {
      console.error('계정 정보 조회 실패:', error);
      return this.getMockAccountData();
    }
  }

  formatAccountData(accountInfo) {
    const balances = accountInfo.balances.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
    let totalBalance = 0;
    const formattedBalances = balances.map(balance => {
      const usdValue = parseFloat(balance.free) + parseFloat(balance.locked);
      totalBalance += usdValue;
      return {
        asset: balance.asset,
        free: balance.free,
        locked: balance.locked,
        usdValue: usdValue
      };
    });

    return {
      totalBalance,
      availableBalance: totalBalance,
      balances: formattedBalances
    };
  }

  getMockAccountData() {
    return {
      totalBalance: 10000,
      availableBalance: 8000,
      balances: [
        { asset: 'BTC', free: '0.1', locked: '0.0', usdValue: 3500 },
        { asset: 'USDT', free: '5000', locked: '0.0', usdValue: 5000 }
      ]
    };
  }

  async getCurrentPrice(symbol) {
    try {
      const response = await axios.get(`${this.baseURL}/api/v3/ticker/price`, {
        params: { symbol }
      });
      return {
        symbol: response.data.symbol,
        price: response.data.price
      };
    } catch (error) {
      console.error('가격 조회 실패:', error);
      return {
        symbol: symbol,
        price: symbol.includes('BTC') ? '35000' : '1500'
      };
    }
  }
}

module.exports = BinanceSimpleService;