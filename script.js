// Основные переменные
let currentUser = null;
let casesData = [];
const GIST_URL = 'https://gist.githubusercontent.com/BtheBFr/1c8f02d1e8e5554f42ea3e69c27323ad/raw/';

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию
    checkAuth();
    
    // Загружаем кейсы
    loadCases();
    
    // Настройка адаптивного меню
    setupResponsiveMenu();
    
    // Настройка кнопок для неавторизованных
    setupGuestButtons();
    
    // Загружаем реальную статистику из Gist
    loadStatsFromGist();
    
    // Исправление мобильного viewport
    fixMobileViewport();
});

// ФИКС: Исправление viewport на мобильных
function fixMobileViewport() {
    if ('ontouchstart' in window) {
        document.documentElement.style.touchAction = 'manipulation';
        document.documentElement.style.webkitTapHighlightColor = 'transparent';
        
        // Предотвращение масштабирования при двойном тапе
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
}

// Настройка адаптивного меню
function setupResponsiveMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            const icon = this.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Закрытие меню при клике на ссылку
        const menuLinks = navMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.querySelector('i').classList.remove('fa-times');
                menuToggle.querySelector('i').classList.add('fa-bars');
            });
        });
        
        // Закрытие меню при клике вне его
        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
                navMenu.classList.remove('active');
                menuToggle.querySelector('i').classList.remove('fa-times');
                menuToggle.querySelector('i').classList.add('fa-bars');
            }
        });
    }
    
    // Адаптация кнопок для мобильных
    adaptButtonsForMobile();
}

// ФИКС: Кнопки Маркет и Топ для неавторизованных
function setupGuestButtons() {
    // Кнопка "Торговать" на главной
    const tradeBtn = document.querySelector('.trade-btn');
    if (tradeBtn) {
        tradeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!localStorage.getItem('horoscase_token')) {
                showNotification('❌ Для торговли нужен аккаунт', 'warning');
                setTimeout(() => {
                    window.location.href = 'auth.html?register=true';
                }, 1500);
                return false;
            }
            
            showNotification('✅ Торговая площадка скоро будет доступна', 'info');
        });
    }
    
    // Кнопки Маркет и Топ в навигации
    const marketLinks = document.querySelectorAll('.market-link, .top-link');
    marketLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!localStorage.getItem('horoscase_token')) {
                showNotification('🔒 Эта функция доступна только авторизованным пользователям', 'warning');
                setTimeout(() => {
                    window.location.href = 'auth.html?register=true';
                }, 1500);
            } else {
                showNotification('⚡ Функция скоро будет доступна', 'info');
            }
        });
    });
}

// Адаптация кнопок под мобильные
function adaptButtonsForMobile() {
    const isMobile = window.innerWidth <= 768;
    const navAuth = document.getElementById('navAuth');
    
    if (!navAuth) return;
    
    // Проверяем авторизацию
    const token = localStorage.getItem('horoscase_token');
    const email = localStorage.getItem('user_email');
    
    if (token && email) {
        // Пользователь авторизован
        const username = localStorage.getItem('user_username') || email.split('@')[0];
        const balance = parseInt(localStorage.getItem('user_balance') || '0');
        const isAdmin = localStorage.getItem('is_admin') === 'true' || email === 'frondoffical@gmail.com';
        
        let adminBtn = '';
        if (isAdmin) {
            adminBtn = isMobile ? 
                '<a href="admin.html" class="btn-admin" title="Админ"><i class="fas fa-crown"></i></a>' :
                '<a href="admin.html" class="btn-admin"><i class="fas fa-crown"></i> Админ</a>';
        }
        
        const balanceText = isMobile ? 
            `<span class="balance-badge">${formatBalance(balance)}</span>` :
            `<span class="balance-badge">${formatBalance(balance)} ₽</span>`;
        
        navAuth.innerHTML = `
            ${adminBtn}
            <a href="inventory.html" class="btn-inventory">
                <i class="fas fa-backpack"></i>
                ${!isMobile ? 'Инвентарь ' : ''}${balanceText}
            </a>
            <a href="profile.html" class="btn-profile" title="${username}">
                <i class="fas fa-user-circle"></i>
                ${!isMobile ? truncateText(username, 12) : ''}
            </a>
            <button onclick="logout()" class="btn-logout" title="Выйти">
                <i class="fas fa-sign-out-alt"></i>
                ${!isMobile ? 'Выйти' : ''}
            </button>
        `;
    } else {
        // Гость
        navAuth.innerHTML = isMobile ? `
            <a href="auth.html" class="btn-login" title="Войти">
                <i class="fas fa-sign-in-alt"></i>
            </a>
            <a href="auth.html?register=true" class="btn-register" title="Регистрация">
                <i class="fas fa-user-plus"></i>
            </a>
        ` : `
            <a href="auth.html" class="btn-login">
                <i class="fas fa-sign-in-alt"></i> Войти
            </a>
            <a href="auth.html?register=true" class="btn-register">
                <i class="fas fa-user-plus"></i> Регистрация
            </a>
        `;
    }
}

// Ресайз окна
window.addEventListener('resize', function() {
    adaptButtonsForMobile();
});

// Загрузка кейсов
async function loadCases() {
    try {
        const response = await fetch('/data/cases.json');
        const data = await response.json();
        
        casesData = [
            ...(data.csgo_cases || []),
            ...(data.dota_cases || []),
            ...(data.rust_cases || [])
        ];
        
        if (casesData.length > 0) {
            displayCases(casesData.slice(0, 6));
        } else {
            casesData = getTestCases();
            displayCases(casesData);
        }
    } catch (error) {
        console.error('Ошибка загрузки кейсов:', error);
        casesData = getTestCases();
        displayCases(casesData);
    }
}

function displayCases(cases) {
    const casesGrid = document.getElementById('casesGrid');
    if (!casesGrid) return;
    
    casesGrid.innerHTML = cases.map(caseItem => `
        <div class="case-card">
            <div class="case-image" style="background: linear-gradient(135deg, ${caseItem.color || '#222'}, #333)">
                <i class="${caseItem.icon || 'fas fa-box'}"></i>
            </div>
            <div class="case-content">
                <h3>${caseItem.name}</h3>
                <p>${caseItem.description || 'Случайные предметы из игры'}</p>
                <div class="case-game">${getGameName(caseItem.game)}</div>
                <div class="case-price">${caseItem.price_rub} ₽</div>
                <button class="btn-open-case" onclick="handleOpenCase('${caseItem.id}')">
                    <i class="fas fa-box-open"></i> Открыть за ${caseItem.price_rub} ₽
                </button>
            </div>
        </div>
    `).join('');
}

// ЗАГРУЗКА СТАТИСТИКИ ИЗ GIST
async function loadStatsFromGist() {
    try {
        // Показываем загрузку
        document.getElementById('statsCases').innerHTML = '<div class="stat-loader"></div>';
        document.getElementById('statsTraders').innerHTML = '<div class="stat-loader"></div>';
        document.getElementById('statsItems').innerHTML = '<div class="stat-loader"></div>';
        
        // Загружаем данные из Gist
        const response = await fetch(GIST_URL + '?t=' + Date.now()); // Добавляем timestamp чтобы избежать кэша
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Проверяем структуру данных
        if (data && typeof data === 'object') {
            // Пытаемся получить значения разными способами (для разных форматов JSON)
            const cases = data.cases || data.cases_opened || data.opened_cases || 485;
            const traders = data.traders || data.active_traders || data.traders_count || 100;
            const items = data.items || data.rare_items || data.items_count || 150;
            
            // Обновляем с анимацией
            animateCounter('statsCases', parseInt(cases) || 485);
            animateCounter('statsTraders', parseInt(traders) || 100);
            animateCounter('statsItems', parseInt(items) || 150);
            
            console.log('Статистика загружена из Gist:', { cases, traders, items });
        } else {
            throw new Error('Неверный формат данных в Gist');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки статистики из Gist:', error);
        
        // Резервные значения
        const backupValues = {
            cases: 485,
            traders: 100,
            items: 150
        };
        
        // Показываем резервные значения
        document.getElementById('statsCases').textContent = backupValues.cases;
        document.getElementById('statsTraders').textContent = backupValues.traders;
        document.getElementById('statsItems').textContent = backupValues.items;
        
        showNotification('⚠️ Используем базовую статистику. Обновите Gist файл.', 'warning');
    }
}

// Анимация счетчика
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const current = parseInt(element.textContent) || 0;
    if (current === targetValue) return;
    
    const increment = targetValue > current ? 1 : -1;
    const step = Math.abs(targetValue - current) / 30;
    
    let currentValue = current;
    const interval = setInterval(() => {
        currentValue += increment * step;
        
        if ((increment > 0 && currentValue >= targetValue) || 
            (increment < 0 && currentValue <= targetValue)) {
            currentValue = targetValue;
            clearInterval(interval);
        }
        
        element.textContent = Math.floor(currentValue).toLocaleString('ru-RU');
    }, 30);
}

// Обработка открытия кейса
function handleOpenCase(caseId) {
    if (!localStorage.getItem('horoscase_token')) {
        showNotification('🔐 Для открытия кейсов войдите в аккаунт', 'warning');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
    const caseItem = casesData.find(c => c.id === caseId);
    if (!caseItem) {
        showNotification('❌ Кейс не найден', 'error');
        return;
    }
    
    const balance = parseInt(localStorage.getItem('user_balance') || '0');
    if (balance < caseItem.price_rub) {
        showNotification(`💰 Недостаточно средств. Нужно ${caseItem.price_rub} ₽`, 'error');
        return;
    }
    
    openCase(caseItem);
}

// Открытие кейса
function openCase(caseItem) {
    showNotification(`🎁 Открываем ${caseItem.name}...`, 'info');
    
    // Снимаем деньги
    const balance = parseInt(localStorage.getItem('user_balance') || '0');
    const newBalance = balance - caseItem.price_rub;
    localStorage.setItem('user_balance', newBalance.toString());
    
    // Обновляем UI
    if (currentUser) {
        currentUser.balance = newBalance;
        updateUIForLoggedInUser();
    }
    
    // Показываем результат
    setTimeout(() => {
        const items = [
            { name: 'Обычный скин 🎨', value: caseItem.price_rub * 0.5 },
            { name: 'Редкий скин ⭐', value: caseItem.price_rub * 1.5 },
            { name: 'Эпический скин ✨', value: caseItem.price_rub * 3 },
            { name: 'Легендарный предмет! 💎', value: caseItem.price_rub * 10 }
        ];
        const chances = [50, 30, 15, 5];
        
        const random = Math.random() * 100;
        let cumulative = 0;
        let selectedItem = items[0];
        
        for (let i = 0; i < items.length; i++) {
            cumulative += chances[i];
            if (random <= cumulative) {
                selectedItem = items[i];
                break;
            }
        }
        
        showNotification(`🎉 Вы получили: ${selectedItem.name} (${selectedItem.value} ₽)`, 'success');
        
        // Обновляем статистику (открытие кейса)
        setTimeout(() => {
            loadStatsFromGist();
        }, 1000);
        
    }, 2000);
}

// Аутентификация
function checkAuth() {
    const token = localStorage.getItem('horoscase_token');
    const email = localStorage.getItem('user_email');
    
    if (token && email) {
        currentUser = {
            email: email,
            username: localStorage.getItem('user_username') || email.split('@')[0],
            balance: localStorage.getItem('user_balance') || '0',
            isAdmin: localStorage.getItem('is_admin') === 'true'
        };
        updateUIForLoggedInUser();
    } else {
        updateUIForGuest();
    }
}

function updateUIForGuest() {
    const navAuth = document.getElementById('navAuth');
    if (navAuth) {
        const isMobile = window.innerWidth <= 768;
        
        navAuth.innerHTML = isMobile ? `
            <a href="auth.html" class="btn-login" title="Войти">
                <i class="fas fa-sign-in-alt"></i>
            </a>
            <a href="auth.html?register=true" class="btn-register" title="Регистрация">
                <i class="fas fa-user-plus"></i>
            </a>
        ` : `
            <a href="auth.html" class="btn-login">
                <i class="fas fa-sign-in-alt"></i> Войти
            </a>
            <a href="auth.html?register=true" class="btn-register">
                <i class="fas fa-user-plus"></i> Регистрация
            </a>
        `;
    }
}

function updateUIForLoggedInUser() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth || !currentUser) return;
    
    const isMobile = window.innerWidth <= 768;
    const balance = parseInt(currentUser.balance) || 0;
    const isAdmin = currentUser.isAdmin || currentUser.email === 'frondoffical@gmail.com';
    
    let adminBtn = '';
    if (isAdmin) {
        adminBtn = isMobile ? 
            '<a href="admin.html" class="btn-admin" title="Админ"><i class="fas fa-crown"></i></a>' :
            '<a href="admin.html" class="btn-admin"><i class="fas fa-crown"></i> Админ</a>';
    }
    
    const balanceText = isMobile ? 
        `<span class="balance-badge">${formatBalance(balance)}</span>` :
        `<span class="balance-badge">${formatBalance(balance)} ₽</span>`;
    
    navAuth.innerHTML = `
        ${adminBtn}
        <a href="inventory.html" class="btn-inventory">
            <i class="fas fa-backpack"></i>
            ${!isMobile ? 'Инвентарь ' : ''}${balanceText}
        </a>
        <a href="profile.html" class="btn-profile" title="${currentUser.username}">
            <i class="fas fa-user-circle"></i>
            ${!isMobile ? truncateText(currentUser.username, 12) : ''}
        </a>
        <button onclick="logout()" class="btn-logout" title="Выйти">
            <i class="fas fa-sign-out-alt"></i>
            ${!isMobile ? 'Выйти' : ''}
        </button>
    `;
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('horoscase_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_username');
        localStorage.removeItem('user_balance');
        localStorage.removeItem('is_admin');
        localStorage.removeItem('user_inventory');
        
        currentUser = null;
        window.location.reload();
    }
}

// Вспомогательные функции
function getGameName(gameCode) {
    const games = {
        'csgo': '🎮 CS:GO',
        'dota2': '⚔️ Dota 2',
        'rust': '🛡️ Rust',
        'tf2': '💥 Team Fortress 2'
    };
    return games[gameCode] || gameCode;
}

function formatBalance(balance) {
    if (balance >= 1000000) {
        return (balance / 1000000).toFixed(1) + 'M';
    } else if (balance >= 1000) {
        return (balance / 1000).toFixed(1) + 'K';
    }
    return balance;
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function getTestCases() {
    return [
        {
            id: 'test_csgo',
            name: 'CS:GO Кейс',
            game: 'csgo',
            price_rub: 50,
            color: '#FF6B35',
            icon: 'fas fa-fire',
            description: 'Тестовый кейс CS:GO'
        },
        {
            id: 'test_dota',
            name: 'Dota 2 Сундук',
            game: 'dota2',
            price_rub: 75,
            color: '#00A8FF',
            icon: 'fas fa-gem',
            description: 'Тестовый сундук Dota 2'
        }
    ];
}

// Уведомления
function showNotification(message, type = 'info') {
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) oldNotification.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        'info': 'info-circle',
        'warning': 'exclamation-triangle',
        'success': 'check-circle',
        'error': 'times-circle'
    };
    
    notification.innerHTML = `
        <i class="fas fa-${icons[type] || 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Автоудаление через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Проверка клика по кнопке открытия кейса
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-open-case') || e.target.closest('.btn-open-case')) {
        const caseId = e.target.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || 
                      e.target.closest('.btn-open-case')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        
        if (caseId) {
            handleOpenCase(caseId);
        }
    }
});

// Обновление статистики каждые 5 минут
setInterval(() => {
    loadStatsFromGist();
}, 5 * 60 * 1000);

// При фокусе окна обновляем статистику
window.addEventListener('focus', () => {
    loadStatsFromGist();
});
