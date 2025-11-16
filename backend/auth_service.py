from passlib.context import CryptContext
import hashlib

# 비밀번호 해싱 (bcrypt 사용 시도, 실패시 SHA256 폴백)
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    BCrypt_AVAILABLE = True
except:
    BCrypt_AVAILABLE = False

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if BCrypt_AVAILABLE:
        return pwd_context.verify(plain_password, hashed_password)
    else:
        # SHA256 폴백
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def get_password_hash(password: str) -> str:
    if BCrypt_AVAILABLE:
        return pwd_context.hash(password)
    else:
        # SHA256 폴백
        return hashlib.sha256(password.encode()).hexdigest()