// 인증 관련 함수 - 백엔드 API와 완전 연동
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('auth_token');
        this.API_BASE = 'http://127.0.0.1:8001';
        this.init();
    }
    
    init() {
        if (this.token) {
            this.validateToken();
        }
    }
    
    async login(email, password) {
        try {
            console.log('🔐 로그인 시도:', email);
            
            const response = await fetch(`${this.API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '로그인 실패');
            }
            
            const data = await response.json();
            this.token = data.access_token;
            
            // 토큰으로 사용자 정보 조회
            const userResponse = await fetch(`${this.API_BASE}/api/auth/me?token=${this.token}`);
            if (userResponse.ok) {
                this.currentUser = await userResponse.json();
            }
            
            localStorage.setItem('auth_token', this.token);
            if (this.currentUser) {
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));
            }
            
            console.log('✅ 로그인 성공:', this.currentUser);
            return { success: true, user: this.currentUser, token: this.token };
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async register(userData) {
        try {
            console.log('👤 회원가입 시도:', userData.email);
            
            const response = await fetch(`${this.API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '회원가입 실패');
            }
            
            const user = await response.json();
            console.log('✅ 회원가입 성공:', user);
            return { success: true, user };
        } catch (error) {
            console.error('❌ Register error:', error);
            return { success: false, error: error.message };
        }
    }
    
    logout() {
        console.log('🚪 로그아웃');
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = 'index.html';
    }
    
    async validateToken() {
        if (!this.token) return false;
        
        try {
            const response = await fetch(`${this.API_BASE}/api/auth/me?token=${this.token}`);
            
            if (response.ok) {
                this.currentUser = await response.json();
                console.log('✅ 토큰 유효함:', this.currentUser.email);
                return true;
            } else {
                console.log('❌ 토큰 만료됨');
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('❌ Token validation error:', error);
            return false;
        }
    }
    
    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }
    
    getToken() {
        return this.token;
    }
    
    getUser() {
        return this.currentUser;
    }
    
    // API 요청용 헤더 생성
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

// 글로벌 AuthManager 인스턴스 생성
const authManager = new AuthManager();