# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from binance.client import Client
from binance.exceptions import BinanceAPIException
from pydantic import BaseModel

app = FastAPI()

# CORS 설정 - 프론트엔드(포트 5173)에서 접속 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ApiKeys(BaseModel):
    api_key: str
    secret_key: str

# Binance 클라이언트 전역 변수
binance_client = None

@app.get("/")
async def root():
    return {"message": "백엔드 서버 실행 중!"}

@app.get("/api/test")
async def test():
    return {"status": "success", "message": "테스트 연결 성공"}

@app.post("/api/connect")
async def connect_binance(keys: ApiKeys):
    global binance_client
    try:
        # 테스트넷 클라이언트 생성
        binance_client = Client(
            api_key=keys.api_key,
            api_secret=keys.secret_key,
            testnet=True  # 테스트넷 사용
        )
        
        # 연결 테스트 (BTCUSDT 가격 조회)
        btc_price = binance_client.get_symbol_ticker(symbol="BTCUSDT")
        
        return {
            "status": "success",
            "message": "Binance API 연결 성공!",
            "btc_price": btc_price['price']
        }
    except BinanceAPIException as e:
        raise HTTPException(status_code=400, detail=f"Binance API 오류: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {e}")

@app.get("/api/balance")
async def get_balance():
    global binance_client
    if not binance_client:
        raise HTTPException(status_code=400, detail="먼저 API에 연결해주세요.")
    
    try:
        account = binance_client.get_account()
        balances = []
        for balance in account['balances']:
            if float(balance['free']) > 0 or float(balance['locked']) > 0:
                balances.append({
                    'asset': balance['asset'],
                    'free': balance['free'],
                    'locked': balance['locked']
                })
        return {"balances": balances}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ticker/{symbol}")
async def get_ticker(symbol: str):
    global binance_client
    if not binance_client:
        raise HTTPException(status_code=400, detail="먼저 API에 연결해주세요.")
    
    try:
        ticker = binance_client.get_symbol_ticker(symbol=symbol)
        return ticker
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)