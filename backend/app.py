from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import re
import time
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import os
import sys

# 경로 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# 데이터베이스 및 모델 임포트
from database.database import SessionLocal, engine
from models.user import Base, User, ExchangeKey
from schemas.user import UserCreate, UserLogin, UserResponse

# JWT 임포트
try:
    import jwt
    JWT_AVAILABLE = True
    print("✅ PyJWT imported successfully")
except ImportError as e:
    print(f"❌ JWT import failed: {e}")
    JWT_AVAILABLE = False

# BinanceService 임포트
try:
    from services.binance_service import BinanceService, mask_api_key
    BINANCE_SERVICE_AVAILABLE = True
    print("✅ BinanceService imported successfully")
except ImportError as e:
    print(f"⚠️ BinanceService import failed: {e}")
    BINANCE_SERVICE_AVAILABLE = False

# 데이터베이스 테이블 생성
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")
except Exception as e:
    print(f"❌ Database table creation failed: {e}")

app = FastAPI(
    title="Deep Signal Crypto Platform", 
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 의존성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 폴백 서비스
class SimpleFallbackService:
    def __init__(self, api_key: str = "", secret_key: str = ""):
        self.api_key = api_key
        self.secret_key = secret_key
    
    def get_ticker_price(self, symbol: str = None):
        fallback_prices = {
            "BTCUSDT": {"symbol": "BTCUSDT", "price": "43250.75"},
            "ETHUSDT": {"symbol": "ETHUSDT", "price": "2580.40"},
            "BNBUSDT": {"symbol": "BNBUSDT", "price": "315.20"},
            "ADAUSDT": {"symbol": "ADAUSDT", "price": "0.52"},
            "DOTUSDT": {"symbol": "DOTUSDT", "price": "7.15"}
        }
        
        if symbol and symbol in fallback_prices:
            return fallback_prices[symbol]
        elif symbol:
            return {"symbol": symbol, "price": "100.00"}
        else:
            return list(fallback_prices.values())
    
    def get_24hr_ticker(self, symbol: str):
        return {
            "symbol": symbol,
            "priceChange": "1250.50",
            "priceChangePercent": "2.98",
            "lastPrice": "43250.75",
            "volume": "28500.50"
        }
    
    def get_exchange_info(self):
        return {
            "timezone": "UTC",
            "serverTime": int(time.time() * 1000),
            "symbols": [
                {"symbol": "BTCUSDT", "status": "TRADING"},
                {"symbol": "ETHUSDT", "status": "TRADING"}
            ]
        }
    
    def get_server_time(self):
        return {"serverTime": int(time.time() * 1000)}
    
    def get_account_balances(self):
        return [
            {"asset": "BTC", "free": "0.125", "locked": "0.0"},
            {"asset": "ETH", "free": "3.2", "locked": "0.0"},
            {"asset": "USDT", "free": "1250.50", "locked": "0.0"}
        ]
    
    def test_connection(self):
        return {"status": "success", "msg": "Fallback mode"}

# 서비스 초기화
if BINANCE_SERVICE_AVAILABLE:
    binance_service = BinanceService()
else:
    binance_service = SimpleFallbackService()
    print("🔄 Using SimpleFallbackService")

# Pydantic 모델
class ExchangeKeyCreate(BaseModel):
    exchange_name: str
    api_key: str
    secret_key: str

class Token(BaseModel):
    access_token: str
    token_type: str

# 유틸리티 함수
def is_valid_email(email: str) -> bool:
    try:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    except:
        return False

def is_strong_password(password: str) -> bool:
    try:
        return len(password) >= 8
    except:
        return False

def get_password_hash(password: str) -> str:
    try:
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()
    except Exception as e:
        print(f"Password hashing error: {e}")
        return password  # 폴백

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return get_password_hash(plain_password) == hashed_password
    except:
        return False

def create_access_token(data: dict):
    if not JWT_AVAILABLE:
        # 간단한 토큰 생성 (JWT 없이)
        import json
        import base64
        data_str = json.dumps(data)
        return base64.b64encode(data_str.encode()).decode()
    
    try:
        # JWT 사용
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=30)
        to_encode.update({"exp": expire})
        
        if 'jwt' in sys.modules:
            encoded_jwt = jwt.encode(to_encode, "secret-key", algorithm="HS256")
        else:
            from jose import jwt
            encoded_jwt = jwt.encode(to_encode, "secret-key", algorithm="HS256")
        
        return encoded_jwt
    except Exception as e:
        print(f"JWT token creation error: {e}")
        # JWT 실패시 폴백
        import json
        import base64
        data_str = json.dumps(data)
        return base64.b64encode(data_str.encode()).decode()

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        print(f"Registration attempt for: {user.email}")
        
        # 이메일 검증
        if not is_valid_email(user.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email format"
            )
        
        # 비밀번호 강도 검증
        if not is_strong_password(user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters"
            )
        
        # 이메일 중복 확인
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # 비밀번호 해싱
        hashed_password = get_password_hash(user.password)
        
        # 사용자 생성
        db_user = User(
            email=user.email,
            hashed_password=hashed_password,
            full_name=user.full_name
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        print(f"User registered successfully: {db_user.id}")
        
        # created_at 필드를 포함한 응답
        return UserResponse(
            id=db_user.id,
            email=db_user.email,
            full_name=db_user.full_name,
            is_active=db_user.is_active,
            created_at=db_user.created_at  # created_at 추가
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.email == user_data.email).first()
        if not db_user or not verify_password(user_data.password, db_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        access_token = create_access_token(data={"sub": db_user.email})
        
        return Token(access_token=access_token, token_type="bearer")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@app.get("/api/auth/me", response_model=UserResponse)
async def read_users_me(token: str, db: Session = Depends(get_db)):
    try:
        # 간단한 토큰 검증
        if JWT_AVAILABLE:
            payload = jwt.decode(token, "secret-key", algorithms=["HS256"])
            email = payload.get("sub")
        else:
            import base64
            import json
            decoded = base64.b64decode(token).decode()
            email = json.loads(decoded).get("sub")
        
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active
        )
    except Exception as e:
        print(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

# 암호화폐 엔드포인트 (기존 코드 유지)
@app.get("/api/crypto/prices")
async def get_prices(symbol: str = None):
    try:
        prices = binance_service.get_ticker_price(symbol)
        return {
            "success": True,
            "data": prices,
            "source": "binance" if BINANCE_SERVICE_AVAILABLE else "fallback"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/crypto/prices/{symbol}")
async def get_price(symbol: str):
    try:
        price = binance_service.get_ticker_price(symbol.upper())
        return {
            "success": True,
            "data": price,
            "source": "binance" if BINANCE_SERVICE_AVAILABLE else "fallback"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/crypto/24hr/{symbol}")
async def get_24hr_ticker(symbol: str):
    try:
        ticker = binance_service.get_24hr_ticker(symbol.upper())
        return {"success": True, "data": ticker}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/crypto/exchange-info")
async def get_exchange_info():
    try:
        info = binance_service.get_exchange_info()
        return {"success": True, "data": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/crypto/server-time")
async def get_server_time():
    try:
        server_time = binance_service.get_server_time()
        return {"success": True, "data": server_time}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/crypto/balances")
async def get_balances():
    try:
        balances = binance_service.get_account_balances()
        return {"success": True, "data": balances}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/crypto/exchange-keys")
async def register_exchange_keys(key_data: ExchangeKeyCreate, db: Session = Depends(get_db)):
    try:
        # 데모용 사용자 ID
        demo_user_id = 1
        
        # API 키 저장
        db_key = ExchangeKey(
            user_id=demo_user_id,
            exchange_name=key_data.exchange_name,
            api_key=key_data.api_key,
            secret_key=key_data.secret_key
        )
        db.add(db_key)
        db.commit()
        
        return {
            "success": True,
            "message": "Exchange keys registered"
        }
    except Exception as e:
        print(f"Exchange key registration error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/crypto/test-connection")
async def test_binance_connection():
    try:
        result = binance_service.test_connection()
        return {
            "success": True,
            "data": result,
            "service_available": BINANCE_SERVICE_AVAILABLE
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# 기본 엔드포인트
@app.get("/")
async def root():
    return {
        "message": "Deep Signal Crypto Platform API", 
        "status": "running",
        "binance_service": "available" if BINANCE_SERVICE_AVAILABLE else "fallback",
        "jwt": "available" if JWT_AVAILABLE else "basic"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/debug/db-check")
async def debug_db_check(db: Session = Depends(get_db)):
    """데이터베이스 연결 테스트 엔드포인트"""
    try:
        user_count = db.query(User).count()
        return {
            "database_status": "connected",
            "user_count": user_count,
            "tables_created": True
        }
    except Exception as e:
        return {
            "database_status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)