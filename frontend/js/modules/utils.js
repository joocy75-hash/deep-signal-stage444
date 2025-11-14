// 유틸리티 함수 모듈
const Utils = {
    // 숫자 포맷팅
    formatNumber(num, decimals = 2) {
        return parseFloat(num).toFixed(decimals);
    },

    // 통화 포맷팅
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    // 백분율 계산
    calculatePercentage(part, total) {
        if (total === 0) return 0;
        return (part / total) * 100;
    },

    // 로컬 스토리지 관리
    storage: {
        set(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        },
        
        get(key, defaultValue = null) {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        },
        
        remove(key) {
            localStorage.removeItem(key);
        }
    },

    // 날짜 포맷팅
    formatDate(date = new Date()) {
        return date.toLocaleString('ko-KR');
    },

    // 에러 처리
    handleError(error, userMessage = '오류가 발생했습니다.') {
        console.error('Error:', error);
        alert(userMessage);
        return { success: false, error: error.message };
    }
};