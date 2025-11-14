import pandas as pd
import numpy as np
from typing import Dict, List
import ta
from datetime import datetime

class AdvancedAITrading:
    def __init__(self):
        self.strategies = {
            'trend_following': self.trend_following_strategy,
            'mean_reversion': self.mean_reversion_strategy,
            'breakout': self.breakout_strategy,
            'rsi_momentum': self.rsi_momentum_strategy
        }
    
    def analyze_with_strategy(self, data: List, strategy_name: str = 'trend_following'):
        """선택된 전략으로 분석"""
        if strategy_name not in self.strategies:
            return {"status": "error", "message": "전략을 찾을 수 없습니다"}
        
        df = pd.DataFrame(data)
        return self.strategies[strategy_name](df)
    
    def trend_following_strategy(self, df):
        """트렌드 추종 전략"""
        # 이동평균 기반 트렌드 분석
        df['sma_20'] = ta.trend.sma_indicator(df['close'], window=20)
        df['sma_50'] = ta.trend.sma_indicator(df['close'], window=50)
        
        current_price = df['close'].iloc[-1]
        sma_20 = df['sma_20'].iloc[-1]
        sma_50 = df['sma_50'].iloc[-1]
        
        if sma_20 > sma_50 and current_price > sma_20:
            action = "BUY"
            confidence = 0.8
            reason = "강한 상승 트렌드 - 골든크로스 확인"
        elif sma_20 < sma_50 and current_price < sma_20:
            action = "SELL"
            confidence = 0.7
            reason = "강한 하락 트렌드 - 데드크로스 확인"
        else:
            action = "HOLD"
            confidence = 0.5
            reason = "트렌드 불명확 - 관망 필요"
        
        return {
            "action": action,
            "confidence": confidence,
            "reason": reason,
            "entry_price": current_price,
            "stop_loss": current_price * 0.98,
            "take_profit": current_price * 1.04,
            "strategy": "trend_following"
        }
    
    def mean_reversion_strategy(self, df):
        """평균 회귀 전략"""
        df['rsi'] = ta.momentum.rsi(df['close'], window=14)
        current_rsi = df['rsi'].iloc[-1]
        current_price = df['close'].iloc[-1]
        
        if current_rsi < 30:  # 과매도
            action = "BUY"
            confidence = 0.75
            reason = "RSI 과매도 구간 - 매수 기회"
        elif current_rsi > 70:  # 과매수
            action = "SELL"
            confidence = 0.65
            reason = "RSI 과매수 구간 - 매도 기회"
        else:
            action = "HOLD"
            confidence = 0.5
            reason = "RSI 중립 구간 - 관망"
        
        return {
            "action": action,
            "confidence": confidence,
            "reason": reason,
            "entry_price": current_price,
            "stop_loss": current_price * 0.97,
            "take_profit": current_price * 1.03,
            "strategy": "mean_reversion"
        }
    
    def breakout_strategy(self, df):
        """브레이크아웃 전략"""
        df['high_20'] = df['high'].rolling(window=20).max()
        df['low_20'] = df['low'].rolling(window=20).min()
        
        current_price = df['close'].iloc[-1]
        resistance = df['high_20'].iloc[-2]  # 이전 저항선
        support = df['low_20'].iloc[-2]      # 이전 지지선
        
        if current_price > resistance:
            action = "BUY"
            confidence = 0.7
            reason = "저항선 돌파 - 상승 신호"
        elif current_price < support:
            action = "SELL"
            confidence = 0.6
            reason = "지지선 붕괴 - 하락 신호"
        else:
            action = "HOLD"
            confidence = 0.5
            reason = "범위 내 횡보 - 관망"
        
        return {
            "action": action,
            "confidence": confidence,
            "reason": reason,
            "entry_price": current_price,
            "stop_loss": current_price * 0.98,
            "take_profit": current_price * 1.05,
            "strategy": "breakout"
        }
    
    def rsi_momentum_strategy(self, df):
        """RSI 모멘텀 전략"""
        df['rsi'] = ta.momentum.rsi(df['close'], window=14)
        df['rsi_signal'] = df['rsi'].rolling(window=3).mean()
        
        current_rsi = df['rsi'].iloc[-1]
        current_signal = df['rsi_signal'].iloc[-1]
        current_price = df['close'].iloc[-1]
        
        if current_rsi > current_signal and current_rsi < 60:
            action = "BUY"
            confidence = 0.7
            reason = "RSI 모멘텀 상승 - 매수 신호"
        elif current_rsi < current_signal and current_rsi > 40:
            action = "SELL"
            confidence = 0.6
            reason = "RSI 모멘텀 하락 - 매도 신호"
        else:
            action = "HOLD"
            confidence = 0.5
            reason = "RSI 모멘텀 불명확 - 관망"
        
        return {
            "action": action,
            "confidence": confidence,
            "reason": reason,
            "entry_price": current_price,
            "stop_loss": current_price * 0.98,
            "take_profit": current_price * 1.04,
            "strategy": "rsi_momentum"
        }

class TradingBot:
    def __init__(self):
        self.is_running = False
        self.current_strategy = 'trend_following'
        self.ai_engine = AdvancedAITrading()
    
    def start_auto_trading(self, symbol: str, quantity: float):
        """자동매매 시작"""
        self.is_running = True
        return {"status": "success", "message": "자동매매 시작됨"}
    
    def stop_auto_trading(self):
        """자동매매 중지"""
        self.is_running = False
        return {"status": "success", "message": "자동매매 중지됨"}
    
    def set_strategy(self, strategy_name: str):
        """트레이딩 전략 설정"""
        if strategy_name in self.ai_engine.strategies:
            self.current_strategy = strategy_name
            return {"status": "success", "message": f"전략 변경: {strategy_name}"}
        else:
            return {"status": "error", "message": "지원하지 않는 전략입니다"}