import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TradingControl from './components/TradingControl';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 시스템 상태 확인
    checkSystemStatus();
    
    // 30초마다 상태 업데이트
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = () => {
    fetch('http://localhost:8001/api/health')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => {
        console.error('Health check failed:', err);
        setSystemStatus({ status: 'Disconnected', error: 'Backend connection failed' });
      });
  };

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentView('dashboard');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>🤖 DeepSignal AI Trading</h1>
          <nav className="nav-menu">
            <button 
              className={currentView === 'dashboard' ? 'active' : ''}
              onClick={() => setCurrentView('dashboard')}
            >
              📊 대시보드
            </button>
            <button 
              className={currentView === 'trading' ? 'active' : ''}
              onClick={() => setCurrentView('trading')}
            >
              ⚡ AI 트레이딩
            </button>
            <button 
              className={currentView === 'admin' ? 'active' : ''}
              onClick={() => setCurrentView('admin')}
            >
              🔧 관리자
            </button>
            <button onClick={handleLogout} className="logout-btn">
              🔓 로그아웃
            </button>
          </nav>
          <div className="user-info">
            <span>👤 {user?.name || user?.email}</span>
          </div>
        </div>
      </header>

      <main className="App-main">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'trading' && <TradingControl />}
        {currentView === 'admin' && <AdminPanel />}
      </main>

      <footer className="App-footer">
        <div className="status-bar">
          <span className={`status ${systemStatus.status === 'OK' ? 'online' : 'offline'}`}>
            ● {systemStatus.status === 'OK' ? '온라인' : '오프라인'}
          </span>
          <span>환경: {systemStatus.environment || 'N/A'}</span>
          <span>마지막 확인: {new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;