from decouple import config

# 데이터베이스 설정
DATABASE_URL = config('DATABASE_URL', default='sqlite:///./trading.db')

# JWT 설정
SECRET_KEY = config('SECRET_KEY', default='your-secret-key-here')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 거래소 설정
EXCHANGES = {
    'binance': {
        'name': 'Binance',
        'testnet': True,
        'future': True
    }
    # 추후 다른 거래소 추가
}

# AI 설정
AI_PROVIDERS = {
    'openai': {
        'name': 'OpenAI',
        'max_tokens': 1000
    }
    # 추후 다른 AI 추가
}