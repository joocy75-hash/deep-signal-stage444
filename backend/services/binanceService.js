const axios = require('axios');
const crypto = require('crypto');

class BinanceService {
  constructor() {
    this.baseURL = 'https://testnet.binance.vision';
    this.apiKey = process.env.BINANCE_API_KEY;
    this.secretKey = process.env.BINANCE_SECRET_KEY;
    this.isConnected = false;
    console.log('🔗 바이낸스 서비스 초기화됨');
  }

  // 서명 생성
  generateSignature(queryString) {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex');
  }

  // 서명된 요청 보내기
  async makeSignedRequest(method, endpoint, params = {}) {
    try {
      const timestamp = Date.now();
      const queryString = new URLSearchParams({
        ...params,
        timestamp,
        recvWindow: 60000
      }).toString();
      
      const signature = this.generateSignature(queryString);

      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}?${queryString}&signature=${signature}`,
        headers: {
          'X-MBX-APIKEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('❌ 바이낸스 API 요청 실패:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || error.message);
    }
  }

  // 공개 API 요청
  async makePublicRequest(endpoint, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${this.baseURL}${endpoint}${queryString ? '?' + queryString : ''}`;
      
      const response = await axios.get(url, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.error('❌ 바이낸스 공개 API 요청 실패:', error.response?.data || error.message);
      throw error;
    }
  }

  // 연결 테스트
  async testConnection() {
    try {
      console.log('🔗 바이낸스 API 연결 테스트 시작...');
      
      // 1. 서버 상태 확인 (공개 API)
      const serverTime = await this.makePublicRequest('/api/v3/time');
      console.log('✅ 서버 시간:', new Date(serverTime.serverTime));

      // 2. 계정 정보 확인 (서명된 API)
      try {
        const accountInfo = await this.makeSignedRequest('GET', '/api/v3/account');
        console.log('✅ 계정 정보 조회 성공');
        console.log('💰 계정 자산:', accountInfo.balances.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0));
        
        this.isConnected = true;
        return { 
          success: true, 
          message: '바이낸스 API 연결 성공!',
          account: this.formatAccountData(accountInfo)
        };
      } catch (accountError) {
        console.log('⚠️ 계정 정보 조회 실패, 공개 API는 작동:', accountError.message);
        return { 
          success: true, 
          message: '공개 API 연결 성공 (계정 권한 필요)',
          warning: accountError.message
        };
      }
      
    } catch (error) {
      console.error('❌ 바이낸스 API 연결 실패:', error.message);
      return { 
        success: false, 
        error: error.message,
        details: 'API 키, 시크릿 키, IP 제한을 확인해주세요.'
      };
    }
  }

  // 계정 정보 가져오기
  async getAccountInfo() {
    try {
      if (!this.isConnected) {
        return this.getMockAccountData();
      }

      const accountInfo = await this.makeSignedRequest('GET', '/api/v3/account');
      return this.formatAccountData(accountInfo);
    } catch (error) {
      console.error('계정 정보 조회 실패, Mock 데이터 사용:', error.message);
      return this.getMockAccountData();
    }
  }

  // 현재 가격 조회
  async getCurrentPrice(symbol) {
    try {
      if (!this.isConnected) {
        return this.getMockPrice(symbol);
      }

      const data = await this.makePublicRequest('/api/v3/ticker/price', { symbol });
      return {
        symbol: data.symbol,
        price: parseFloat(data.price),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('가격 조회 실패, Mock 데이터 사용:', error.message);
      return this.getMockPrice(symbol);
    }
  }

  // 여러 심볼 가격 조회
  async getMultiplePrices(symbols) {
    try {
      if (!this.isConnected) {
        return this.getMockMultiplePrices(symbols);
      }

      const data = await this.makePublicRequest('/api/v3/ticker/price');
      const filtered = data.filter(ticker => symbols.includes(ticker.symbol));
      return filtered.map(ticker => ({
        symbol: ticker.symbol,
        price: parseFloat(ticker.price),
        timestamp: new Date()
      }));
    } catch (error) {
      console.error('다중 가격 조회 실패, Mock 데이터 사용:', error.message);
      return this.getMockMultiplePrices(symbols);
    }
  }

  // 계정 데이터 포맷팅
  formatAccountData(accountInfo) {
    const balances = accountInfo.balances
      .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map(balance => ({
        asset: balance.asset,
        free: parseFloat(balance.free),
        locked: parseFloat(balance.locked),
        total: parseFloat(balance.free) + parseFloat(balance.locked)
      }));

    const totalBalance = balances.reduce((sum, balance) => sum + balance.total, 0);

    return {
      totalBalance,
      availableBalance: totalBalance * 0.8, // 실제로는 계산 필요
      balances,
      canTrade: accountInfo.canTrade,
      canWithdraw: accountInfo.canWithdraw,
      canDeposit: accountInfo.canDeposit
    };
  }

  // Mock 데이터들
  getMockAccountData() {
    return {
      totalBalance: 10000,
      availableBalance: 8000,
      balances: [
        { asset: 'BTC', free: 0.1, locked: 0, total: 0.1, usdValue: 3500 },
        { asset: 'ETH', free: 2, locked: 0, total: 2, usdValue: 3000 },
        { asset: 'USDT', free: 5000, locked: 0, total: 5000, usdValue: 5000 }
      ],
      canTrade: true,
      canWithdraw: true,
      canDeposit: true
    };
  }

  getMockPrice(symbol) {
    const basePrices = {
      'BTCUSDT': 35000 + (Math.random() * 1000 - 500),
      'ETHUSDT': 1500 + (Math.random() * 100 - 50),
      'ADAUSDT': 0.25 + (Math.random() * 0.1 - 0.05)
    };
    
    return {
      symbol: symbol,
      price: basePrices[symbol] || 100,
      timestamp: new Date(),
      isMock: true
    };
  }

  getMockMultiplePrices(symbols) {
    return symbols.map(symbol => this.getMockPrice(symbol));
  }
}

module.exports = BinanceService;