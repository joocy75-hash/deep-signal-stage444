import ccxt from 'ccxt';

// 바이낸스 테스트넷 연결 함수
export const testBinanceConnection = async (apiKey, secretKey) => {
  try {
    const exchange = new ccxt.binance({
      apiKey: apiKey,
      secret: secretKey,
      sandbox: true, // 테스트넷 사용
      verbose: false,
    });

    exchange.setSandboxMode(true);

    // 잔고 조회 시도
    const balance = await exchange.fetchBalance();
    console.log('✅ 바이낸스 테스트넷 연결 성공');
    
    return {
      success: true,
      balance: balance.total
    };
  } catch (error) {
    console.error('❌ 바이낸스 테스트넷 연결 실패:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// 공용 마켓 데이터 조회 (API 키 없이)
export const getMarketData = async () => {
  try {
    const exchange = new ccxt.binance();
    const symbols = ['BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'DOT/USDT', 'LINK/USDT'];
    const tickers = await exchange.fetchTickers(symbols);
    
    const marketData = symbols.map(symbol => {
      const ticker = tickers[symbol];
      return {
        symbol,
        price: ticker.last,
        change24h: ticker.percentage,
        high24h: ticker.high,
        low24h: ticker.low,
        volume: ticker.baseVolume
      };
    });

    return marketData;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
};