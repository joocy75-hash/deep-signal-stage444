class MockBinanceService:
    def __init__(self):
        self.is_testnet = True
    
    def get_account_info(self):
        return {
            "status": "success",
            "exchange": "binance",
            "testnet": True,
            "account": {
                "total_balance": "1000.0",
                "available_balance": "950.0",
                "unrealized_pnl": "50.0",
                "positions": []
            }
        }
    
    def get_ticker_price(self, symbol: str = "BTCUSDT"):
        # 약간의 변동성을 주기 위해 랜덤 값 추가
        base_price = 35000 if symbol == "BTCUSDT" else 2000
        price = base_price + (base_price * 0.01 * (0.5 - (hash(symbol) % 100) / 100))
        
        return {
            "status": "success",
            "symbol": symbol,
            "price": round(price, 2)
        }
