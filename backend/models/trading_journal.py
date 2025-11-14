from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from database.database import Base

class TradingJournal(Base):
    __tablename__ = "trading_journal"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    symbol = Column(String(20), nullable=False)
    action = Column(String(10), nullable=False)  # BUY, SELL
    quantity = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    stop_loss = Column(Float)
    take_profit = Column(Float)
    exit_price = Column(Float)
    exit_reason = Column(String(50))  # stop_loss, take_profit, manual
    pnl = Column(Float)  # profit and loss
    pnl_percentage = Column(Float)
    opened_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_at = Column(DateTime(timezone=True))
    is_open = Column(Boolean, default=True)
    notes = Column(Text)

    # AI 분석 정보
    ai_confidence = Column(Float)
    ai_reason = Column(Text)
    strategy_used = Column(String(50))