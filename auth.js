// Аутентификация пользователей
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, если пользователь уже авторизован
    if (localStorage.getItem('horoscase_token')) {
        window.location.href = 'index.html';
        return;
    }
    
    // Обработчики форм
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    document.getElementById('codeForm')?.addEventListener('submit', handleCodeVerification);
});

// Вход
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('horoscase_token', data.token);
            window.location.href = 'index.html';
        } else {
            showAuthError('Неверный email или пароль');
        }
    } catch (error) {
        showAuthError('Ошибка подключения к серверу');
        // Для теста - временный токен
        localStorage.setItem('horoscase_token', 'temp_token_' + Date.now());
        window.location.href = 'index.html';
    }
}

// Регистрация
async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerPasswordConfirm').value;
    
    // Проверка паролей
    if (password !== confirmPassword) {
        showAuthError('Пароли не совпадают');
        return;
    }
    
    // Проверка email администратора
    if (email === 'frondoffical@gmail.com') {
        showAuthError('Этот email зарезервирован для администратора');
        return;
    }
    
    try {
        // Отправляем код на почту
        const response = await fetch(`${API_URL}/api/send-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });
        
        if (response.ok) {
            // Показываем форму ввода кода
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById('codeForm').classList.add('active');
            
            // Сохраняем данные для подтверждения
            sessionStorage.setItem('pending_registration', JSON.stringify({
                email, username, password
            }));
        } else {
            showAuthError('Ошибка при отправке кода');
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        // Для теста - сразу пропускаем
        localStorage.setItem('horoscase_token', 'temp_token_' + Date.now());
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_username', username);
        window.location.href = 'index.html';
    }
}

// Подтверждение кода
async function handleCodeVerification(e) {
    e.preventDefault();
    
    // Собираем код из полей
    const inputs = document.querySelectorAll('.code-input');
    const code = Array.from(inputs).map(input => input.value).join('');
    
    const pendingData = JSON.parse(sessionStorage.getItem('pending_registration') || '{}');
    
    try {
        const response = await fetch(`${API_URL}/api/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: pendingData.email,
                code: code
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Сохраняем токен
            localStorage.setItem('horoscase_token', data.token);
            localStorage.setItem('user_email', pendingData.email);
            localStorage.setItem('user_username', pendingData.username);
            
            // Очищаем временные данные
            sessionStorage.removeItem('pending_registration');
            
            // Перенаправляем на главную
            window.location.href = 'index.html';
        } else {
            showAuthError('Неверный код подтверждения');
        }
    } catch (error) {
        // Для теста - пропускаем проверку
        localStorage.setItem('horoscase_token', 'temp_token_' + Date.now());
        localStorage.setItem('user_email', pendingData.email);
        localStorage.setItem('user_username', pendingData.username);
        window.location.href = 'index.html';
    }
}

// Отображение ошибок
function showAuthError(message) {
    // Удаляем старую ошибку
    const oldError = document.querySelector('.auth-error');
    if (oldError) oldError.remove();
    
    // Создаем новое сообщение об ошибке
    const errorDiv = document.createElement('div');
    errorDiv.className = 'auth-error';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    // Стили для ошибки
    errorDiv.style.cssText = `
        background: rgba(255, 87, 87, 0.1);
        border-left: 4px solid #ff5757;
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #ff5757;
        animation: slideIn 0.3s ease;
    `;
    
    // Добавляем в первую активную форму
    const activeForm = document.querySelector('.auth-form.active');
    if (activeForm) {
        activeForm.insertBefore(errorDiv, activeForm.firstChild);
        
        // Автоудаление через 5 секунд
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Функция для теста - генерация случайного кода
function generateTestCode() {
    const code = Math.floor(100000 + Math.random() * 900000);
    console.log('Тестовый код для регистрации:', code);
    return code.toString();
}

// Проверка почты администратора
function isAdminEmail(email) {
    return email === 'frondoffical@gmail.com';
}
