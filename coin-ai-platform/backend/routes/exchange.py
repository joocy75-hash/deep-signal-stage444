from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database.database import get_db
from models.user import User, ExchangeKey
from schemas.user import ExchangeKeyCreate, ExchangeKeyResponse
from services.auth_service import verify_token

router = APIRouter(prefix="/api/exchange", tags=["exchange"])

def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="인증 토큰이 필요합니다.")
    
    token = authorization.split(" ")[1]
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
    # 간단한 바이낸스 연결 테스트 (나중에 실제 구현)
    try:
        # 임시로 항상 성공한다고 가정
        test_success = True
        
        if not test_success:
            raise HTTPException(status_code=400, detail="거래소 연결 실패")
        
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
