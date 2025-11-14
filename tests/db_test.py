from fastapi import FastAPI
from database.database import engine, Base
from models.user import User, ExchangeKey, AIStrategy  # 모델 임포트

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def hello():
    return {"message": "데이터베이스 연결 테스트"}

@app.get("/api/db-check")
def db_check():
    try:
        # 데이터베이스 연결 테스트
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            return {
                "status": "success", 
                "message": "데이터베이스 연결 성공",
                "database": "SQLite"
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)