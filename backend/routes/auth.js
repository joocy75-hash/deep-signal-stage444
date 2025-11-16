const express = require('express');
const router = express.Router();

// 간단한 사용자 저장 (실제로는 데이터베이스 사용)
let users = [
  { id: 1, email: 'admin@deepsignal.com', password: 'password123', name: '관리자' }
];

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 이메일 중복 확인
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '이미 존재하는 이메일입니다.'
      });
    }

    // 새 사용자 생성
    const newUser = {
      id: users.length + 1,
      email,
      password, // 실제로는 해싱 필요
      name,
      createdAt: new Date()
    };

    users.push(newUser);

    res.json({
      success: true,
      message: '회원가입 성공',
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 사용자 찾기
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '이메일 또는 비밀번호가 잘못되었습니다.'
      });
    }

    // 간단한 JWT 토큰 생성 (실제로는 jsonwebtoken 라이브러리 사용)
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24시간
    })).toString('base64');

    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name }
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 토큰 검증
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: '토큰이 필요합니다.'
      });
    }

    // 토큰 디코딩
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // 토큰 만료 확인
    if (decoded.exp < Date.now()) {
      return res.status(401).json({
        success: false,
        error: '토큰이 만료되었습니다.'
      });
    }

    // 사용자 찾기
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }

    res.json({
      success: true,
      data: {
        valid: true,
        user: { id: user.id, email: user.email, name: user.name }
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: '유효하지 않은 토큰입니다.'
    });
  }
});

module.exports = router;