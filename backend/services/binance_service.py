from binance.client import Client
from binance.enums import *
import pandas as pd
from typing import Dict, List, Optional
import ta  # 기술적 분석 라이브러리

class AdvancedBinanceService:
    def __init__(self, api_key: str, api_secret: str, testnet: bool = True):
        self.client = Client(api_key, api_secret, testnet=testnet)
        self.is_testnet = testnet
    
    def get_real_time_chart_data(self, symbol: str = "BTCUSDT", interval: str = "1h", limit: int = 100):
        """실제 차트 데이터 조회"""
        try:
            klines = self.client.futures_klines(
                symbol=symbol,
                interval=interval,
                limit=limit
            )
            
            df = pd.DataFrame(klines, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume',
                'close_time', 'quote_asset_volume', 'number_of_trades',
                'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
            ])
            
            # 숫자형으로 변환
            for col in ['open', 'high', 'low', 'close', 'volume']:
                df[col] = pd.to_numeric(df[col])
            
            # 기술적 지표 계산
            df = self.add_technical_indicators(df)
            
            return {
                "status": "success",
                "symbol": symbol,
                "interval": interval,
                "data": df.to_dict('records')
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def add_technical_indicators(self, df):
        """기술적 지표 추가"""
        # 이동평균
        df['sma_20'] = ta.trend.sma_indicator(df['close'], window=20)
        df['sma_50'] = ta.trend.sma_indicator(df['close'], window=50)
        
        # RSI
        df['rsi'] = ta.momentum.rsi(df['close'], window=14)
        
        # MACD
        macd = ta.trend.MACD(df['close'])
        df['macd'] = macd.macd()
        df['macd_signal'] = macd.macd_signal()
        df['macd_histogram'] = macd.macd_diff()
        
        # 볼린저 밴드
        bollinger = ta.volatility.BollingerBands(df['close'])
        df['bb_upper'] = bollinger.bollinger_hband()
        df['bb_lower'] = bollinger.bollinger_lband()
        df['bb_middle'] = bollinger.bollinger_mavg()
        
        return df
    
    def get_account_balance(self):
        """실제 계좌 잔액 조회"""
        try:
            account = self.client.futures_account()
            balances = {
                "total_balance": float(account['totalWalletBalance']),
                "available_balance": float(account['availableBalance']),
                "unrealized_pnl": float(account['totalUnrealizedProfit']),
                "margin_balance": float(account['totalMarginBalance'])
            }
            return {"status": "success", "balances": balances}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_positions(self):
        """실제 포지션 조회"""
        try:
            account = self.client.futures_account()
            positions = []
            
            for position in account['positions']:
                if float(position['positionAmt']) != 0:
                    positions.append({
                        'symbol': position['symbol'],
                        'position_amt': float(position['positionAmt']),
                        'entry_price': float(position['entryPrice']),
                        'unrealized_pnl': float(position['unrealizedProfit']),
                        'leverage': int(position['leverage'])
                    })
            
            return {"status": "success", "positions": positions}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def create_order(self, symbol: str, side: str, quantity: float, order_type: str = "MARKET"):
        """실제 주문 생성"""
        try:
            order = self.client.futures_create_order(
                symbol=symbol,
                side=side,
                type=order_type,
                quantity=quantity
            )
            return {"status": "success", "order": order}
        except Exception as e:
            return {"status": "error", "message": str(e)}