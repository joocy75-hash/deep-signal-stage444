const express = require('express');
const cors = require('cors');
const Binance = require('node-binance-api');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

// Binance API 클라이언트 저장소
const clients = new Map();

// Binance 연결 엔드포인트
app.post('/api/binance/connect', (req, res) => {
    const { apiKey, secretKey } = req.body;
    
    try {
        const binance = new Binance().options({
            APIKEY: apiKey,
            APISECRET: secretKey,
            useServerTime: true
        });
        
        // 연결 테스트
        binance.balance((error, balances) => {
            if (error) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Binance 연결 실패: ' + error.message 
                });
            }
            
            // 클라이언트 정보 저장
            const clientId = generateClientId();
            clients.set(clientId, { binance, apiKey, secretKey });
            
            res.json({ 
                success: true, 
                clientId,
                balances 
            });
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: '서버 오류: ' + error.message 
        });
    }
});

// 계정 정보 조회
app.get('/api/binance/account', (req, res) => {
    const clientId = req.headers['client-id'];
    const client = clients.get(clientId);
    
    if (!client) {
        return res.status(401).json({ error: '인증되지 않은 클라이언트' });
    }
    
    client.binance.balance((error, balances) => {
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        
        res.json({ balances });
    });
});

// 주문 실행
app.post('/api/binance/order', (req, res) => {
    const clientId = req.headers['client-id'];
    const client = clients.get(clientId);
    
    if (!client) {
        return res.status(401).json({ error: '인증되지 않은 클라이언트' });
    }
    
    const { symbol, side, quantity, price, type } = req.body;
    
    client.binance.order(side, symbol, quantity, price, { type }, (error, response) => {
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        
        res.json({ success: true, order: response });
    });
});

// WebSocket 서버
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('클라이언트 연결됨');
    
    // Binance WebSocket 연결
    const binanceWS = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
    
    binanceWS.on('message', (data) => {
        // 데이터를 클라이언트에게 전송
        ws.send(data);
    });
    
    ws.on('close', () => {
        binanceWS.close();
        console.log('클라이언트 연결 종료');
    });
});

function generateClientId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
});