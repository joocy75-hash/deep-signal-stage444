// login.js - 완전히 새로운 코드로 교체

// 로그인 처리 함수
function handleLogin(event) {
    if (event) event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    const loginLoading = document.getElementById('loginLoading');

    // 로딩 상태 표시
    loginText.style.display = 'none';
    loginLoading.style.display = 'inline-block';
    loginBtn.disabled = true;

    console.log('로그인 시도:', email);

    // 간단한 인증 검사 (실제로는 서버 검증 필요)
    if (email && password) {
        // 로그인 성공 시
        setTimeout(() => {
            // 인증 상태 저장
            if (window.Utils) {
                Utils.storage.set('isLoggedIn', true);
                Utils.storage.set('userEmail', email);
                Utils.storage.set('loginTime', new Date().toISOString());
            } else {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', email);
            }
            
            // 대시보드로 이동
            console.log('✅ 로그인 성공, 대시보드로 이동');
            window.location.href = 'dashboard.html';
        }, 1000);
    } else {
        // 로그인 실패 시
        setTimeout(() => {
            loginText.style.display = 'inline-block';
            loginLoading.style.display = 'none';
            loginBtn.disabled = false;
            alert('이메일과 비밀번호를 입력해주세요.');
        }, 500);
    }
}

// 테스트 로그인 함수
function testLogin() {
    console.log("🔓 테스트 로그인 실행");
    
    const testAccounts = [
        {email: "test1@deepsignal.com", password: "1234"},
        {email: "admin@deepsignal.com", password: "admin123"}
    ];
    
    // 테스트 계정 입력
    document.getElementById('email').value = testAccounts[0].email;
    document.getElementById('password').value = testAccounts[0].password;
    
    console.log("테스트 계정 입력 완료");
    
    // 로그인 실행
    handleLogin();
}

// 테스트 버튼 생성
function createTestButton() {
    // 이미 버튼이 있으면 제거
    const existingBtn = document.getElementById('testLoginBtn');
    if (existingBtn) existingBtn.remove();
    
    const testBtn = document.createElement('button');
    testBtn.textContent = "🔓 테스트 로그인";
    testBtn.id = "testLoginBtn";
    testBtn.type = "button"; // form 제출 방지
    testBtn.style.cssText = `
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: #28a745; 
        color: white; 
        border: none; 
        padding: 10px 15px; 
        border-radius: 5px; 
        cursor: pointer;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    testBtn.onclick = testLogin;
    document.body.appendChild(testBtn);
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    // 테스트 버튼 생성
    createTestButton();
    
    // 로그인 폼 이벤트 리스너
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 로그인 버튼 이벤트 리스너 (이중으로 확실히)
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    console.log("✅ 로그인 페이지 준비 완료");
    console.log("테스트 방법: 1. 우측 상단 버튼 클릭 2. 직접 입력 후 로그인");
});

// 글로벌에서 접근 가능하게
window.testLogin = testLogin;
window.handleLogin = handleLogin;