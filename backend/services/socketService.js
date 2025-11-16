// services/socketService.js
const WebSocket = require('ws');

class SocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log('클라이언트 연결됨');

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('클라이언트 연결 해제');
      });

      // 초기 데이터 전송
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        message: '실시간 데이터 스트림에 연결되었습니다'
      }));
    });
  }

  // 실시간 데이터 브로드캐스트
  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // 가격 업데이트 전송
  sendPriceUpdate(symbol, priceData) {
    this.broadcast({
      type: 'PRICE_UPDATE',
      symbol,
      data: priceData,
      timestamp: new Date()
    });
  }

  // 포지션 업데이트 전송
  sendPositionUpdate(position) {
    this.broadcast({
      type: 'POSITION_UPDATE',
      data: position,
      timestamp: new Date()
    });
  }
}

module.exports = SocketService;