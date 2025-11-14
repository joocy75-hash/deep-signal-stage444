// src/components/ApiConfig.jsx
import React, { useState } from 'react';
import axios from 'axios';

const ApiConfig = () => {
    const [apiKey, setApiKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('');
    const [btcPrice, setBtcPrice] = useState('');

    const connectApi = async () => {
        try {
            const response = await axios.post('http://localhost:8000/api/connect', {
                api_key: apiKey,
                secret_key: secretKey
            });
            
            setConnectionStatus(response.data.message);
            setBtcPrice(`BTC 가격: $${response.data.btc_price}`);
        } catch (error) {
            setConnectionStatus(`연결 실패: ${error.response?.data?.detail || error.message}`);
        }
    };

    return (
        <div className="api-config">
            <h2>Binance API 설정</h2>
            
            <div className="connection-status">
                {connectionStatus && <p>{connectionStatus}</p>}
                {btcPrice && <p>{btcPrice}</p>}
            </div>

            <div className="input-group">
                <label>API Key:</label>
                <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Binance 테스트넷에서 발급받은 API Key"
                />
            </div>

            <div className="input-group">
                <label>Secret Key:</label>
                <input 
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Binance 테스트넷에서 발급받은 Secret Key"
                />
            </div>

            <button onClick={connectApi}>API 연결</button>

            <div className="server-info">
                <p><strong>백엔드 서버 주소:</strong></p>
                <p>http://localhost:8000</p>
                <p>FastAPI 백엔드 서버가 실행 중인 주소</p>
            </div>
        </div>
    );
};

export default ApiConfig;