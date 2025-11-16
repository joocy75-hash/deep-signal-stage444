const API_BASE_URL = 'http://localhost:8001/api';

class TradingAPI {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      return await response.json();
    } catch (error) {
      console.error('API Request Failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getHealth() {
    return this.request('/health');
  }

  async getDashboard() {
    return this.request('/dashboard');
  }

  async startTrading(config) {
    return this.request('/ai-trading/start', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  async stopTrading() {
    return this.request('/ai-trading/stop', {
      method: 'POST'
    });
  }

  async testBinance() {
    return this.request('/test/binance-connection');
  }
}

export default new TradingAPI();
