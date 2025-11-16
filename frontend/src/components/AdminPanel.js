import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AdminPanel.css';

const AdminPanel = () => {
  const [adminStats, setAdminStats] = useState(null);
  const [tradingMonitor, setTradingMonitor] = useState(null);
  const [systemLogs, setSystemLogs] = useState([]);
  const [adminToken, setAdminToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setAdminToken('test-admin-token-12345');
    }
  }, []);

  const loadAdminData = async () => {
    if (!adminToken) {
      alert('🔐 관리자 토큰을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const [statsResponse, monitorResponse, logsResponse] = await Promise.all([
        api.getAdminStats(adminToken),
        api.getTradingMonitor(adminToken),
        api.getSystemLogs(adminToken)
      ]);

      if (statsResponse.success) setAdminStats(statsResponse.data);
      if (monitorResponse.success) setTradingMonitor(monitorResponse.data);
      if (logsResponse.success) setSystemLogs(logsResponse.data);

    } catch (error) {
      console.error('Admin data load failed:', error);
      alert('❌ 관리자 데이터 로딩 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'optimal': return 'var(--profit-color)';
      case 'good': return 'var(--primary-color)';
      case 'warning': return '#ffaa00';
      case 'critical': return 'var(--loss-color)';
      default: return 'var(--text-color)';
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'INFO': return 'var(--primary-color)';
      case 'WARN': return '#ffaa00';
      case 'ERROR': return 'var(--loss-color)';
      default: return 'var(--text-color)';
    }
  };

  return (
    <div className="admin-panel">
      <div className="card">
        <h2>🔧 관리자 패널</h2>

        <div className="admin-auth card">
          <h3>🔐 관리자 인증</h3>
          <div className="auth-form">
            <div>
              <label>관리자 토큰</label>
              <input
                type="password"
                placeholder="관리자 토큰을 입력하세요"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
              />
            </div>
            <button onClick={loadAdminData} disabled={loading}>
              {loading ? '⏳ 로딩중...' : '📊 데이터 불러오기'}
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <small className="dev-mode-notice">
              💡 개발 모드: 기본 토큰이 자동 설정됩니다
            </small>
          )}
        </div>

        {adminStats && (
          <div className="admin-stats card">
            <h3>📈 시스템 통계</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>총 사용자</h3>
                <p>{adminStats.totalUsers}</p>
              </div>
              <div className="stat-card">
                <h3>활성 트레이더</h3>
                <p>{adminStats.activeTraders}</p>
              </div>
              <div className="stat-card">
                <h3>총 수익</h3>
                <p className="profit">${adminStats.totalProfit?.toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <h3>오늘 거래</h3>
                <p>{adminStats.todayTrades}</p>
              </div>
              <div className="stat-card">
                <h3>시스템 가동률</h3>
                <p>{adminStats.systemUptime}</p>
              </div>
              <div className="stat-card">
                <h3>활성 봇</h3>
                <p>{adminStats.activeBots}</p>
              </div>
              <div className="stat-card">
                <h3>총 거래량</h3>
                <p>${adminStats.totalVolume?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {tradingMonitor && (
          <div className="trading-monitor card">
            <h3>👁️ 트레이딩 모니터링</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>활성 세션</h3>
                <p>{tradingMonitor.activeSessions}</p>
              </div>
              <div className="stat-card">
                <h3>오픈 포지션</h3>
                <p>{tradingMonitor.totalOpenPositions}</p>
              </div>
              <div className="stat-card">
                <h3>성공률</h3>
                <p>{tradingMonitor.successRate}%</p>
              </div>
              <div className="stat-card">
                <h3>평균 수익</h3>
                <p>${tradingMonitor.averageProfit?.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <h3>시스템 상태</h3>
                <p style={{ color: getHealthColor(tradingMonitor.systemHealth) }}>
                  {tradingMonitor.systemHealth}
                </p>
              </div>
            </div>

            <div className="performance-section" style={{ marginTop: '2rem' }}>
              <h4>📊 성능 지표</h4>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>시간당</h3>
                  <p className="profit">+${tradingMonitor.performance?.hourly}</p>
                </div>
                <div className="stat-card">
                  <h3>일간</h3>
                  <p className="profit">+${tradingMonitor.performance?.daily}</p>
                </div>
                <div className="stat-card">
                  <h3>주간</h3>
                  <p className="profit">+${tradingMonitor.performance?.weekly}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {systemLogs.length > 0 && (
          <div className="system-logs card">
            <h3>📝 시스템 로그</h3>
            <div className="logs-container">
              <table>
                <thead>
                  <tr>
                    <th>시간</th>
                    <th>레벨</th>
                    <th>메시지</th>
                  </tr>
                </thead>
                <tbody>
                  {systemLogs.map((log, index) => (
                    <tr key={index}>
                      <td>{new Date(log.time).toLocaleTimeString()}</td>
                      <td style={{ color: getLogLevelColor(log.level) }}>
                        {log.level}
                      </td>
                      <td>{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!adminStats && !loading && (
          <div className="card welcome-message">
            <h3>👋 관리자 패널에 오신 것을 환영합니다!</h3>
            <p>관리자 토큰을 입력하고 데이터를 불러오세요.</p>
            <small>
              이 패널에서는 시스템 전반의 통계와 모니터링 데이터를 확인할 수 있습니다.
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;