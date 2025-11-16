import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/api';

class TradingAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  async request(endpoint, options = {}) {
    try {
      const config = {
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('API Request Failed:', error);
      throw new Error(error.response?.data?.error || 'Network error');
    }
  }

  // 인증 API
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      data: { email, password }
    });
  }

  async register(email, password, name) {
    return this.request('/auth/register', {
      method: 'POST',
      data: { email, password, name }
    });
  }

  async verifyToken(token) {
    return this.request('/auth/verify', {
      method: 'POST',
      data: { token }
    });
  }

  // 대시보드 API
  async getDashboard() {
    return this.request('/dashboard');
  }

  async getPrices(symbols) {
    const symbolString = symbols.join(',');
    return this.request(`/dashboard/prices?symbols=${symbolString}`);
  }

  // AI 트레이딩 API
  async startTrading(config) {
    return this.request('/ai-trading/start', {
      method: 'POST',
      data: config
    });
  }

  async stopTrading() {
    return this.request('/ai-trading/stop', {
      method: 'POST'
    });
  }

  async getTradingStatus() {
    return this.request('/ai-trading/status');
  }

  async getPrediction(symbol) {
    return this.request(`/ai-trading/predict/${symbol}`);
  }

  // 거래 API
  async getTradeHistory() {
    return this.request('/trading/history');
  }

  async buy(symbol, quantity, price) {
    return this.request('/trading/buy', {
      method: 'POST',
      data: { symbol, quantity, price }
    });
  }

  async sell(symbol, quantity, price) {
    return this.request('/trading/sell', {
      method: 'POST',
      data: { symbol, quantity, price }
    });
  }

  // 테스트 API
  async testBinanceConnection() {
    return this.request('/test/binance-connection');
  }

  async getAccountInfo() {
    return this.request('/test/account-info');
  }

  // 관리자 API
  async getAdminStats(token) {
    return this.request('/admin/users/stats', {
      headers: { 'admin-token': token }
    });
  }

  async getTradingMonitor(token) {
    return this.request('/admin/trading/monitor', {
      headers: { 'admin-token': token }
    });
  }

  async getSystemLogs(token) {
    return this.request('/admin/system/logs', {
      headers: { 'admin-token': token }
    });
  }
}

export default new TradingAPI();