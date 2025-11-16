from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from binance.client import Client
import uvicorn
import time
from typing import Optional, Dict

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 변수
binance_clients = {}
active_trading = {}

class BinanceConfig(BaseModel):
    apiKey: str
    secretKey: str
    useTestnet: bool = True

class TradingConfig(BaseModel):
    strategy: str
    symbol: str = "BTCUSDT"
    leverage: int = 5

@app.get("/")
async def root():
    return {"message": "DeepSignal 백엔드 실행 중"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "DeepSignal 백엔드 실행 중"}

@app.post("/api/binance/test-connection")
async def test_binance_connection(config: BinanceConfig):
    try:
        if config.useTestnet:
            client = Client(config.apiKey, config.secretKey, testnet=True)
        else:
            client = Client(config.apiKey, config.secretKey)
        
        # 연결 테스트
        account = client.get_account()
        return {
            "success": True, 
            "message": "바이낸스 연결 성공",
            "data": {
                "canTrade": account.get('canTrade', False),
                "balances": account.get('balances', [])
            }
        }
    except Exception as e:
        return {
            "success": False, 
            "message": f"바이낸스 연결 실패: {str(e)}"
        }

@app.post("/api/binance/connect")
async def connect_binance(config: BinanceConfig):
    try:
        client_id = f"{config.apiKey[:10]}_{int(time.time())}"
        
        if config.useTestnet:
            client = Client(config.apiKey, config.secretKey, testnet=True)
        else:
            client = Client(config.apiKey, config.secretKey)
        
        binance_clients[client_id] = client
        active_trading[client_id] = False
        
        return {
            "success": True,
            "message": "바이낸스 연결 성공",
            "clientId": client_id
        }
    except Exception as e:
        return {
            "success": False, 
            "message": f"바이낸스 연결 실패: {str(e)}"
        }

@app.get("/api/binance/account")
async def get_account_info(clientId: str):
    try:
        if clientId not in binance_clients:
            raise HTTPException(status_code=400, detail="클라이언트를 찾을 수 없습니다")
        
        client = binance_clients[clientId]
        account = client.get_account()
        
        # USDT 잔고
        usdt_balance = next((item for item in account['balances'] if item['asset'] == 'USDT'), None)
        balance = float(usdt_balance['free']) if usdt_balance else 1000.0  # 기본값 1000 USDT
        
        # 시뮬레이션 데이터
        positions = [
            {
                "symbol": "BTCUSDT",
                "side": "BUY",
                "quantity": 0.001,
                "entryPrice": 43000.0,
                "currentPrice": 43250.0,
                "pnl": 0.25
            }
        ]
        
        return {
            "success": True,
            "data": {
                "balance": balance,
                "totalAssetValue": balance + 2.5,
                "positions": positions
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"계정 정보 조회 실패: {str(e)}"
        }

@app.get("/api/binance/prices")
async def get_crypto_prices(symbol: str = "BTCUSDT"):
    try:
        # 시뮬레이션 가격 데이터
        import random
        price = 43000 + random.uniform(-100, 100)
        
        return {
            "success": True,
            "data": {
                "symbol": symbol,
                "price": round(price, 2)
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"가격 조회 실패: {str(e)}"
        }

@app.post("/api/trading/start")
async def start_trading(config: TradingConfig, clientId: str):
    try:
        if clientId not in binance_clients:
            raise HTTPException(status_code=400, detail="클라이언트를 찾을 수 없습니다")
        
        active_trading[clientId] = True
        
        return {
            "success": True,
            "message": f"{config.strategy} 전략으로 트레이딩 시작",
            "data": {
                "strategy": config.strategy,
                "symbol": config.symbol,
                "leverage": config.leverage,
                "status": "active"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"트레이딩 시작 실패: {str(e)}"
        }

@app.post("/api/trading/stop")
async def stop_trading(clientId: str):
    try:
        if clientId not in binance_clients:
            raise HTTPException(status_code=400, detail="클라이언트를 찾을 수 없습니다")
        
        active_trading[clientId] = False
        
        return {
            "success": True,
            "message": "트레이딩 중지",
            "data": {
                "status": "stopped"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"트레이딩 중지 실패: {str(e)}"
        }

@app.get("/api/ai/signal")
async def get_ai_signal(symbol: str = "BTCUSDT"):
    import random
    
    signals = ["STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"]
    confidence = random.uniform(0.5, 0.95)
    signal = random.choice(signals)
    
    return {
        "success": True,
        "data": {
            "symbol": symbol,
            "signal": signal,
            "confidence": confidence,
            "timestamp": int(time.time())
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)