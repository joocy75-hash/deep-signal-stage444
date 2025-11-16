# DeepSignal AI Trading Platform

암호화폐 AI 자동매매 플랫폼

## 프로젝트 구조

```
deep-signal-stage444/
├── backend/          # Node.js Express 백엔드
│   ├── server.js     # 메인 서버 파일
│   └── ...
├── frontend/         # 프론트엔드
│   ├── index.html    # 메인 대시보드
│   ├── dashboard.html # 대시보드
│   └── ...
└── README.md
```

## 설치 및 실행

### 백엔드 실행

```bash
cd backend
npm install
node server.js
```

백엔드는 기본적으로 `http://localhost:8001`에서 실행됩니다.

### 프론트엔드 실행

프론트엔드는 정적 HTML 파일이므로 웹 서버를 통해 실행하거나 브라우저에서 직접 열 수 있습니다.

```bash
cd frontend
# Python 웹 서버 사용 (예시)
python -m http.server 3000
```

또는 브라우저에서 `frontend/index.html` 또는 `frontend/dashboard.html`을 직접 열 수 있습니다.

## API 엔드포인트

- `GET /api/health` - 헬스 체크
- `GET /api/dashboard` - 대시보드 데이터
- `POST /api/ai-trading/start` - AI 트레이딩 시작
- `POST /api/ai-trading/stop` - AI 트레이딩 중지
- `GET /api/trading/account` - 트레이딩 계정 정보
- `GET /api/trading/positions` - 오픈 포지션 조회
- `GET /api/binance/account` - 바이낸스 계정 정보
- `GET /api/ai/signal` - AI 신호 조회

## 주요 기능

- 실시간 암호화폐 시장 모니터링
- AI 기반 트레이딩 신호 분석
- 자동매매 시스템
- 포지션 관리 및 수익률 추적
