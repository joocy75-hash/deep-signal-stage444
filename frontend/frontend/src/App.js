import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [status, setStatus] = useState('loading');
  const [backendStatus, setBackendStatus] = useState('checking...');

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/health');
      const data = await response.json();
      setBackendStatus(data.status);
      setStatus('success');
    } catch (error) {
      setBackendStatus('disconnected');
      setStatus('error');
    }
  };

  return (
    <div className="App">
      <header style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '2rem', 
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        <h1 style={{ color: '#00d4ff', marginBottom: '1rem' }}>
          🤖 DeepSignal AI Trading Platform
        </h1>
        <p>Frontend is running! 🎉</p>
      </header>

      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          padding: '2rem', 
          borderRadius: '12px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h2>System Status</h2>
          <div style={{ margin: '1rem 0' }}>
            <p><strong>Frontend:</strong> <span style={{color: '#00ff88'}}>✅ Running</span></p>
            <p><strong>Backend:</strong> 
              <span style={{
                color: backendStatus === 'OK' ? '#00ff88' : '#ff4444',
                marginLeft: '0.5rem'
              }}>
                {backendStatus === 'OK' ? '✅ Connected' : '❌ Disconnected'}
              </span>
            </p>
          </div>
          
          <button 
            onClick={checkBackend}
            style={{
              background: '#00d4ff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              color: 'black',
              fontWeight: 'bold',
              cursor: 'pointer',
              margin: '0.5rem'
            }}
          >
            🔄 Check Backend
          </button>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,212,255,0.1)', borderRadius: '8px' }}>
            <h3>Next Steps:</h3>
            <p>1. Make sure backend is running on port 8001</p>
            <p>2. Check the browser console for any errors</p>
            <p>3. Start building your components!</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
