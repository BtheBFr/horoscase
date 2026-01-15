// Аутентификация пользователей Horoscase
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

// Вход в аккаунт
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
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_username', data.username || 'Пользователь');
            
            // Если это админ - добавляем флаг
            if (email === 'frondoffical@gmail.com') {
                localStorage.setItem('is_admin', 'true');
            }
            
            window.location.href = 'index.html';
        } else {
            const errorData = await response.json();
            showAuthError(errorData.message || 'Неверный email или пароль');
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        // Для теста - временная авторизация
        localStorage.setItem('horoscase_token', 'temp_token_' + Date.now());
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_username', email.split('@')[0]);
        
        if (email === 'frondoffical@gmail.com') {
            localStorage.setItem('is_admin', 'true');
        }
        
        window.location.href = 'index.html';
    }
}

// Регистрация нового пользователя
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
    
    // Проверка минимальной длины пароля
    if (password.length < 6) {
        showAuthError('Пароль должен быть не менее 6 символов');
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
            
            // Автозаполняем тестовый код
            autoFillTestCode();
        } else {
            const errorData = await response.json();
            showAuthError(errorData.message || 'Ошибка при отправке кода');
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        // Для теста - симуляция отправки кода
        showAuthError('Сервер недоступен. Тестовый код: 123456');
        
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById('codeForm').classList.add('active');
        
        sessionStorage.setItem('pending_registration', JSON.stringify({
            email, username, password
        }));
        
        autoFillTestCode();
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
            localStorage.setItem('user_balance', '100'); // Стартовый баланс
            
            // Если админ - отмечаем
            if (pendingData.email === 'frondoffical@gmail.com') {
                localStorage.setItem('is_admin', 'true');
            }
            
            // Очищаем временные данные
            sessionStorage.removeItem('pending_registration');
            
            // Перенаправляем на главную
            window.location.href = 'index.html';
        } else {
            const errorData = await response.json();
            showAuthError(errorData.message || 'Неверный код подтверждения');
        }
    } catch (error) {
        console.error('Ошибка подтверждения:', error);
        // Для теста - автоматическая регистрация
        localStorage.setItem('horoscase_token', 'verified_token_' + Date.now());
        localStorage.setItem('user_email', pendingData.email);
        localStorage.setItem('user_username', pendingData.username);
        localStorage.setItem('user_balance', '100');
        
        if (pendingData.email === 'frondoffical@gmail.com') {
            localStorage.setItem('is_admin', 'true');
        }
        
        window.location.href = 'index.html';
    }
}

// Автозаполнение тестового кода
function autoFillTestCode() {
    const inputs = document.querySelectorAll('.code-input');
    const testCode = '123456';
    
    inputs.forEach((input, index) => {
        if (index < testCode.length) {
            input.value = testCode[index];
        }
    });
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
