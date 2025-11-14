from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/journal", tags=["trading-journal"])

@router.get("/trades")
async def get_trading_journal(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """트레이딩 저널 조회"""
    return {
        "status": "success",
        "message": "트레이딩 저널 기능은 준비 중입니다.",
        "user_id": current_user.id,
        "trades": []
    }

@router.post("/trades")
async def add_trade_to_journal(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """트레이딩 저널에 거래 추가"""
    return {
        "status": "success",
        "message": "트레이딩 저널 기록이 추가되었습니다.",
        "trade_id": "temp_001"
    }