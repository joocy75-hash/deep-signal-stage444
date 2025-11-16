import time
import threading
from typing import Dict, List
from services.advanced_ai_trading import AdvancedAITrading

class AutoTradingBot:
    def __init__(self):
        self.is_running = False
        self.current_strategy = "trend_following"
        self.ai_engine = AdvancedAITrading()
        self.trading_thread = None
        self.positions = []
        
    def start_trading(self, binance_service, symbol: str = "BTCUSDT", quantity: float = 0.001):
        """자동매매 시작"""
        if self.is_running:
            return {"status": "error", "message": "이미 실행 중입니다"}
        
        self.is_running = True
        self.trading_thread = threading.Thread(
            target=self._trading_loop,
            args=(binance_service, symbol, quantity)
        )
        self.trading_thread.daemon = True
        self.trading_thread.start()
        
        return {"status": "success", "message": "자동매매 시작됨"}
    
    def stop_trading(self):
        """자동매매 중지"""
        self.is_running = False
        if self.trading_thread:
            self.trading_thread.join(timeout=5)
        return {"status": "success", "message": "자동매매 중지됨"}
    
    def _trading_loop(self, binance_service, symbol: str, quantity: float):
        """트레이딩 메인 루프"""
        while self.is_running:
            try:
                # 1. 시장 데이터 수집
                chart_data = binance_service.get_real_time_chart_data(symbol, "15m", 50)
                if chart_data["status"] != "success":
                    time.sleep(60)
                    continue
                
                # 2. AI 분석
                analysis = self.ai_engine.analyze_with_strategy(
                    chart_data["data"], 
                    self.current_strategy
                )
                
                # 3. 매매 조건 확인 (신뢰도 70% 이상, 현재 포지션이 없을 때)
                if (analysis["action"] in ["BUY", "SELL"] and 
                    analysis["confidence"] > 0.7 and
                    not self._has_active_position(symbol)):
                    
                    # 4. 주문 실행
                    order_result = binance_service.place_real_order(
                        symbol=symbol,
                        side=analysis["action"],
                        quantity=quantity
                    )
                    
                    if order_result["status"] == "success":
                        self.positions.append({
                            "symbol": symbol,
                            "side": analysis["action"],
                            "quantity": quantity,
                            "entry_time": time.time(),
                            "order_id": order_result["order"]["orderId"]
                        })
                        print(f"✅ {analysis['action']} 주문 실행: {symbol}")
                
                # 5. 1분 대기
                time.sleep(60)
                
            except Exception as e:
                print(f"❌ 트레이딩 루프 에러: {e}")
                time.sleep(60)
    
    def _has_active_position(self, symbol: str) -> bool:
        """활성 포지션 확인"""
        # 간단한 구현 - 실제로는 바이낸스에서 포지션 조회
        return any(pos["symbol"] == symbol for pos in self.positions)
    
    def set_strategy(self, strategy_name: str):
        """트레이딩 전략 설정"""
        if strategy_name in self.ai_engine.strategies:
            self.current_strategy = strategy_name
            return {"status": "success", "message": f"전략 변경: {strategy_name}"}
        else:
            return {"status": "error", "message": "지원하지 않는 전략"}
    
    def get_status(self):
        """봇 상태 조회"""
        return {
            "is_running": self.is_running,
            "current_strategy": self.current_strategy,
            "active_positions": len(self.positions),
            "positions": self.positions
        }