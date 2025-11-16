from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from models.user import ExchangeKey
from schemas.user import ExchangeKeyCreate, ExchangeKeyResponse
from services.auth_service import verify_token
from services.binance_service import RealBinanceService

router = APIRouter(prefix="/api/exchange", tags=["exchange"])

def get_current_user(token: str, db: Session = Depends(get_db)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="인증이 유효하지 않습니다.")
    
    user_email = payload.get("sub")
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")
    return user

@router.post("/keys", response_model=ExchangeKeyResponse)
async def add_exchange_key(
    key_data: ExchangeKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 바이낸스 연결 테스트
    try:
        binance = RealBinanceService(
            key_data.api_key, 
            key_data.secret_key, 
            testnet=key_data.is_testnet
        )
        account_info = binance.get_real_account_info()
        
        # API 키 저장
        exchange_key = ExchangeKey(
            user_id=current_user.id,
            exchange_name=key_data.exchange_name,
            api_key=key_data.api_key,
            secret_key=key_data.secret_key,
            is_testnet=key_data.is_testnet
        )
        
        db.add(exchange_key)
        db.commit()
        db.refresh(exchange_key)
        
        return exchange_key
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"거래소 연결 실패: {str(e)}")

@router.get("/keys")
async def get_exchange_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    keys = db.query(ExchangeKey).filter(ExchangeKey.user_id == current_user.id).all()
    return keys