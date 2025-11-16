from sqlalchemy.orm import Session

# 절대 임포트 사용
from backend.models.user import ExchangeKey
from backend.schemas.user import ExchangeKeyCreate
from backend.services.binance_service import BinanceService, mask_api_key
from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

load_dotenv()

# 환경변수에서 암호화 키 로드 또는 생성
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')
if not ENCRYPTION_KEY:
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    
fernet = Fernet(ENCRYPTION_KEY.encode())

class ExchangeService:
    @staticmethod
    def encrypt_secret_key(secret_key: str) -> str:
        """비밀 키 암호화"""
        return fernet.encrypt(secret_key.encode()).decode()

    @staticmethod
    def decrypt_secret_key(encrypted_secret: str) -> str:
        """비밀 키 복호화"""
        return fernet.decrypt(encrypted_secret.encode()).decode()

    @staticmethod
    def create_exchange_key(db: Session, exchange_key: ExchangeKeyCreate, user_id: int):
        """거래소 API 키 생성"""
        # API 키 유효성 검증
        try:
            binance_service = BinanceService(exchange_key.api_key, exchange_key.secret_key)
            if not binance_service.test_connection():
                raise ValueError("Invalid API keys or insufficient permissions")
        except Exception as e:
            raise ValueError(f"API connection test failed: {str(e)}")

        # 비밀 키 암호화
        encrypted_secret = ExchangeService.encrypt_secret_key(exchange_key.secret_key)
        
        db_exchange_key = ExchangeKey(
            user_id=user_id,
            exchange_name=exchange_key.exchange_name,
            api_key=exchange_key.api_key,  # API 키는 그대로 저장
            secret_key=encrypted_secret,   # 비밀 키는 암호화 저장
            is_active=True
        )
        
        db.add(db_exchange_key)
        db.commit()
        db.refresh(db_exchange_key)
        return db_exchange_key

    @staticmethod
    def get_user_exchange_keys(db: Session, user_id: int):
        """사용자의 거래소 키 목록 조회"""
        keys = db.query(ExchangeKey).filter(ExchangeKey.user_id == user_id).all()
        
        # API 키 마스킹 처리
        for key in keys:
            key.api_key = mask_api_key(key.api_key)
            
        return keys

    @staticmethod
    def delete_exchange_key(db: Session, key_id: int, user_id: int):
        """거래소 키 삭제"""
        key = db.query(ExchangeKey).filter(
            ExchangeKey.id == key_id, 
            ExchangeKey.user_id == user_id
        ).first()
        
        if key:
            db.delete(key)
            db.commit()
            return True
        return False

    @staticmethod
    def get_binance_service(db: Session, user_id: int, exchange_name: str = "binance"):
        """Binance 서비스 인스턴스 생성"""
        key = db.query(ExchangeKey).filter(
            ExchangeKey.user_id == user_id,
            ExchangeKey.exchange_name == exchange_name,
            ExchangeKey.is_active == True
        ).first()
        
        if not key:
            raise ValueError("No active API key found")
        
        # 비밀 키 복호화
        decrypted_secret = ExchangeService.decrypt_secret_key(key.secret_key)
        return BinanceService(key.api_key, decrypted_secret)