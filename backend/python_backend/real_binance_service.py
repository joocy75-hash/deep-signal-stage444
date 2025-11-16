from binance.client import Client
from binance.enums import *
import pandas as pd
from typing import Dict, List
import time

class RealBinanceService:
    def __init__(self, api_key: str, api_secret: str, testnet: bool = True):
        self.client = Client(api_key, api_secret, testnet=testnet)
        self.is_testnet = testnet
        self.connected = True
    
    def get_real_account_info(self):
        """실제 계좌 정보 조회"""
        try:
            account = self.client.futures_account()
            return {
                "status": "success",
                "account": account,
                "connected": True
            }
        except Exception as e:
            return {"status": "error", "message": str(e), "connected": False}
    
    def place_real_order(self, symbol: str, side: str, quantity: float, order_type: str = "MARKET"):
        """실제 주문 실행"""
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