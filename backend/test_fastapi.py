from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "FastAPI 작동 확인!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 FastAPI 서버 시작 중...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
