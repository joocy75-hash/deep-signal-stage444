from database.database import engine, Base, SessionLocal
from models.user import User
from services.auth_service import get_password_hash

# 테이블 생성
Base.metadata.create_all(bind=engine)

# 데이터베이스 연결 테스트
db = SessionLocal()
try:
    # 간단한 사용자 생성 테스트
    test_user = User(
        email="manual@test.com",
        hashed_password=get_password_hash("test123"),
        full_name="Manual Test"
    )
    db.add(test_user)
    db.commit()
    print("✅ 데이터베이스 테스트 성공!")
    print(f"생성된 사용자: {test_user.email}")
except Exception as e:
    print(f"❌ 데이터베이스 에러: {e}")
finally:
    db.close()