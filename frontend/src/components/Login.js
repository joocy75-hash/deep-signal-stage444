import React, { useState } from 'react';
import api from '../services/api';
import './Login.css';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      
      if (isLogin) {
        response = await api.login(formData.email, formData.password);
      } else {
        response = await api.register(formData.email, formData.password, formData.name);
      }

      if (response.success) {
        if (isLogin) {
          api.setToken(response.data.token);
          onLogin(response.data.user);
        } else {
          alert('🎉 회원가입 성공! 이제 로그인해주세요.');
          setIsLogin(true);
          setFormData(prev => ({ ...prev, password: '' }));
        }
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUser = {
      id: 1,
      email: 'demo@deepsignal.com',
      name: '데모 사용자'
    };
    onLogin(demoUser);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🤖 DeepSignal AI</h1>
          <p>AI 기반 암호화폐 자동매매 플랫폼</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label>이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="이름을 입력하세요"
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="이메일을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="login-button"
          >
            {loading ? '⏳ 처리중...' : (isLogin ? '🔐 로그인' : '📝 회원가입')}
          </button>
        </form>

        <button 
          type="button" 
          onClick={() => setIsLogin(!isLogin)}
          className="switch-button"
        >
          {isLogin ? '📝 계정이 없으신가요? 회원가입' : '🔐 이미 계정이 있으신가요? 로그인'}
        </button>

        <div className="demo-login-section">
          <button 
            type="button" 
            onClick={handleDemoLogin}
            className="demo-button"
          >
            🚀 데모 로그인 (테스트용)
          </button>
          <small>
            데모 모드에서는 실제 거래가 발생하지 않습니다
          </small>
        </div>

        <div className="test-account-info">
          <h4>💡 테스트 계정</h4>
          <div>
            <div>이메일: admin@deepsignal.com</div>
            <div>비밀번호: password123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;