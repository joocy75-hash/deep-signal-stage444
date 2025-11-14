// 인증 관련 함수
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('auth_token');
        this.init();
    }
    
    init() {
        if (this.token) {
            this.validateToken();
        }
    }
    
    async login(email, password) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                throw new Error('로그인 실패');
            }
            
            const data = await response.json();
            this.token = data.access_token;
            this.currentUser = data.user;
            
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('user_data', JSON.stringify(this.currentUser));
            
            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async register(userData) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                throw new Error('회원가입 실패');
            }
            
            return { success: true };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: error.message };
        }
    }
    
    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/';
    }
    
    async validateToken() {
        if (!this.token) return false;
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/validate`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const userData = localStorage.getItem('user_data');
                this.currentUser = userData ? JSON.parse(userData) : null;
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }
    
    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }
    
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const userTier = this.currentUser.tier;
        const permissions = {
            basic: ['view_dashboard', 'basic_trading'],
            premium: ['view_dashboard', 'basic_trading', 'advanced_strategies', 'api_access'],
            enterprise: ['view_dashboard', 'basic_trading', 'advanced_strategies', 'api_access', 'admin_panel']
        };
        
        return permissions[userTier]?.includes(permission) || false;
    }
}

// 글로벌 AuthManager 인스턴스 생성
const authManager = new AuthManager();