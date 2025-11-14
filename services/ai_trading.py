from typing import Dict, List
import random

class SimpleTradingStrategy:
    """기본 트레이딩 전략"""
    
    @staticmethod
    def simple_moving_average_strategy(prices: List[float], short_window: int = 5, long_window: int = 10) -> Dict:
        """단순 이동평균 전략"""
        if len(prices) < long_window:
            return {"action": "HOLD", "reason": "데이터 부족", "confidence": 0.5}
        
        short_ma = sum(prices[-short_window:]) / short_window
        long_ma = sum(prices[-long_window:]) / long_window
        
        current_price = prices[-1]
        
        if short_ma > long_ma:
            return {
                "action": "BUY",
                "confidence": 0.7,
                "reason": "골든크로스 신호 - 단기 이동평균이 장기 이동평균을 상향 돌파",
                "entry_price": current_price,
                "stop_loss": current_price * 0.98,
                "take_profit": current_price * 1.06
            }
        elif short_ma < long_ma:
            return {
                "action": "SELL", 
                "confidence": 0.6,
                "reason": "데드크로스 신호 - 단기 이동평균이 장기 이동평균을 하향 돌파",
                "entry_price": current_price,
                "stop_loss": current_price * 1.02,
                "take_profit": current_price * 0.94
            }
        else:
            return {
                "action": "HOLD", 
                "reason": "추세 불명확 - 이동평균들이 교차하지 않음",
                "confidence": 0.5
            }
