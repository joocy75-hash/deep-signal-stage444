import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
    
    const interval = setInterval(loadDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const response = await api.getDashboard();
      
      if (response.success) {
        setDashboardData(response.data);
        
        if (response.data.priceHistory) {
          const chartData = response.data.priceHistory.map((item, index) => ({
            time: new Date(item.time).toLocaleTimeString(),
            price: item.close,
            volume: item.volume
          }));
          setPrices(chartData);
        }
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">📊 대시보드 데이터를 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="error">
        ❌ 데이터 로딩 실패: {error}
        <button onClick={loadDashboardData}>🔄 재시도</button>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="error">❌ 데이터를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="dashboard">
      <div className="card">
        <h2>📊 트레이딩 대시보드</h2>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>총 자산</h3>
            <p>${dashboardData.account?.totalBalance?.toLocaleString() || '0'}</p>
          </div>
          <div className="stat-card">
            <h3>사용 가능</h3>
            <p>${dashboardData.account?.availableBalance?.toLocaleString() || '0'}</p>
          </div>
          <div className="stat-card">
            <h3>현재 포지션</h3>
            <p>{dashboardData.openPositions?.length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>오늘 수익</h3>
            <p className={dashboardData.todayProfit >= 0 ? 'profit' : 'loss'}>
              ${dashboardData.todayProfit?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      </div>

      <div className="card chart-section">
        <h3>📈 BTCUSDT 실시간 차트</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={prices}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" />
            <YAxis stroke="rgba(255,255,255,0.7)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 15, 35, 0.9)',
                border: '1px solid rgba(0, 212, 255, 0.5)',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#00d4ff" 
              strokeWidth={2}
              dot={false}
              name="가격 (USDT)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>💱 실시간 가격</h3>
        <div className="stats-grid">
          {dashboardData.prices?.map((price, index) => (
            <div key={index} className="stat-card">
              <h3>{price.symbol}</h3>
              <p>${parseFloat(price.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <small>{new Date(price.timestamp).toLocaleTimeString()}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="card positions-section">
        <h3>📋 현재 포지션</h3>
        {dashboardData.openPositions && dashboardData.openPositions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>심볼</th>
                <th>수량</th>
                <th>진입 가격</th>
                <th>현재 가격</th>
                <th>PnL</th>
                <th>유형</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.openPositions.map((position, index) => (
                <tr key={index}>
                  <td>{position.symbol}</td>
                  <td>{position.amount}</td>
                  <td>${position.entryPrice?.toLocaleString()}</td>
                  <td>${position.currentPrice?.toLocaleString()}</td>
                  <td className={position.pnl >= 0 ? 'profit' : 'loss'}>
                    ${position.pnl} ({position.pnlPercent}%)
                  </td>
                  <td>{position.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>📭 현재 오픈된 포지션이 없습니다.</p>
        )}
      </div>

      <div className="card">
        <h3>💰 계정 잔고</h3>
        <div className="stats-grid">
          {dashboardData.account?.balances?.map((balance, index) => (
            <div key={index} className="stat-card">
              <h3>{balance.asset}</h3>
              <p>{balance.total} {balance.asset}</p>
              <small>≈ ${balance.usdValue?.toLocaleString()}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;