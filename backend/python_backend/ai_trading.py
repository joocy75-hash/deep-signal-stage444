# import openai  # 임시 주석
from typing import Dict, List, Optional
import json
from datetime import datetime

class AITradingStrategy:
    def __init__(self, api_key: str):
        # self.client = openai.OpenAI(api_key=api_key)  # 임시 주석
        pass
    
    def analyze_market_signal(self, market_data: Dict, trading_history: List) -> Dict:
        """AI를 이용한 시장 분석 및 트레이딩 신호 생성"""
        
        # 임시로 기본 분석 결과 반환
        return {
            "status": "success",
            "analysis": {
                "action": "HOLD",
                "confidence": 0.5,
                "reason": "OpenAI 패키지 설치 필요",
                "entry_price": market_data.get('price', 0),
                "stop_loss": market_data.get('price', 0) * 0.98,
                "take_profit": market_data.get('price', 0) * 1.03
            },
            "timestamp": datetime.now().isoformat(),
            "note": "OpenAI 설치: pip install openai"
        }

class SimpleTradingStrategy:
    """AI 없이 기본 트레이딩 전략"""
    
    @staticmethod
    def simple_moving_average_strategy(prices: List[float], short_window: int = 10, long_window: int = 20) -> Dict:
        """단순 이동평균 전략"""
        if len(prices) < long_window:
            return {"action": "HOLD", "reason": "데이터 부족"}
        
        short_ma = sum(prices[-short_window:]) / short_window
        long_ma = sum(prices[-long_window:]) / long_window
        
        if short_ma > long_ma * 1.01:  # 1% 이상 상승
            return {
                "action": "BUY",
                "confidence": 0.7,
                "reason": "골든크로스 신호",
                "entry_price": prices[-1],
                "stop_loss": prices[-1] * 0.98,  # 2% 손실 한도
                "take_profit": prices[-1] * 1.06  # 6% 목표 수익
            }
        elif short_ma < long_ma * 0.99:  # 1% 이상 하락
            return {
                "action": "SELL",
                "confidence": 0.6,
                "reason": "데드크로스 신호",
                "entry_price": prices[-1],
                "stop_loss": prices[-1] * 1.02,  # 2% 손실 한도
                "take_profit": prices[-1] * 0.94  # 6% 목표 수익
            }
        else:
            return {
                "action": "HOLD", 
                "reason": "추세 불명확",
                "confidence": 0.5
            }