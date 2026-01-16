// Основные переменные для работы сайта
let currentUser = null;
let casesData = [];
const GOOGLE_SHEETS_API = 'https://script.google.com/macros/s/AKfycbx08LjFIWFZlBPwH_oihZ7MqpbKH-zYT5OC1dPqUtig6WaStSVCIZ2j1fBpwlbhfHB6/exec';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию пользователя
    checkAuth();
    
    // Загружаем кейсы из data/cases.json
    loadCases();
    
    // Настройка адаптивного меню для мобильных устройств
    setupResponsiveMenu();
    
    // Настройка кнопок для неавторизованных пользователей
    setupGuestButtons();
    
    // Загружаем статистику из Google Sheets
    loadStatsFromGoogleSheets();
    
    // Исправление viewport для мобильных устройств
    fixMobileViewport();
    
    // Автообновление статистики каждую минуту
    setInterval(loadStatsFromGoogleSheets, 60000);
});

// Функция для исправления viewport на мобильных устройствах
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
            // Анимация иконки бургер-меню
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
        
        // Закрытие меню при клике вне его области
        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
                navMenu.classList.remove('active');
                menuToggle.querySelector('i').classList.remove('fa-times');
                menuToggle.querySelector('i').classList.add('fa-bars');
            }
        });
    }
    
    // Адаптация кнопок для мобильных устройств
    adaptButtonsForMobile();
}

// Настройка кнопок для гостей (неавторизованных пользователей)
function setupGuestButtons() {
    // Кнопка "Торговать" на главной странице
    const tradeBtn = document.querySelector('.trade-btn');
    if (tradeBtn) {
        tradeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!localStorage.getItem('horoscase_token')) {
                showNotification('Для торговли нужен аккаунт', 'warning');
                setTimeout(() => {
                    window.location.href = 'auth.html?register=true';
                }, 1500);
                return false;
            }
            
            showNotification('Торговая площадка скоро будет доступна', 'info');
        });
    }
    
    // Кнопки "Маркет" и "Топ" в навигации
    const marketLinks = document.querySelectorAll('.market-link, .top-link');
    marketLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!localStorage.getItem('horoscase_token')) {
                showNotification('Эта функция доступна только авторизованным пользователям', 'warning');
                setTimeout(() => {
                    window.location.href = 'auth.html?register=true';
                }, 1500);
            } else {
                showNotification('Функция скоро будет доступна', 'info');
            }
        });
    });
}

// Адаптация кнопок под мобильные устройства
function adaptButtonsForMobile() {
    const isMobile = window.innerWidth <= 768;
    const navAuth = document.getElementById('navAuth');
    
    if (!navAuth) return;
    
    // Проверяем авторизацию пользователя
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
                ${!isMobile ? username : ''}
            </a>
            <button onclick="logout()" class="btn-logout" title="Выйти">
                <i class="fas fa-sign-out-alt"></i>
                ${!isMobile ? 'Выйти' : ''}
            </button>
        `;
    } else {
        // Гость (неавторизованный пользователь)
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

// Загрузка кейсов из JSON файла
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
            // Используем тестовые данные если файл пустой
            casesData = getTestCases();
            displayCases(casesData);
        }
    } catch (error) {
        console.error('Ошибка загрузки кейсов:', error);
        casesData = getTestCases();
        displayCases(casesData);
    }
}

// Отображение кейсов на странице
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

// Загрузка статистики из Google Sheets
async function loadStatsFromGoogleSheets() {
    try {
        // Добавляем timestamp чтобы избежать кэширования
        const response = await fetch(`${GOOGLE_SHEETS_API}?t=${Date.now()}`);
        
        if (!response.ok) {
            throw new Error('Google Sheets API не отвечает');
        }
        
        const data = await response.json();
        
        // Обновляем цифры на сайте
        updateStatElement('statsCases', data.cases || 485);
        updateStatElement('statsTraders', data.traders || 100);
        updateStatElement('statsItems', data.items || 150);
        
    } catch (error) {
        console.error('Ошибка загрузки статистики из Google Sheets:', error);
        // Используем резервные значения при ошибке
        updateStatElement('statsCases', 485);
        updateStatElement('statsTraders', 100);
        updateStatElement('statsItems', 150);
    }
}

// Обновление статистики при открытии кейса
async function updateStatsOnCaseOpen() {
    try {
        // Увеличиваем счётчик кейсов на 1
        await fetch(`${GOOGLE_SHEETS_API}?action=update&type=cases&value=1`);
        
        // 15% шанс добавить редкий предмет
        if (Math.random() < 0.15) {
            await fetch(`${GOOGLE_SHEETS_API}?action=update&type=items&value=1`);
        }
        
        // 5% шанс добавить активного трейдера
        if (Math.random() < 0.05) {
            await fetch(`${GOOGLE_SHEETS_API}?action=update&type=traders&value=1`);
        }
        
        // Обновляем отображение через 1 секунду
        setTimeout(loadStatsFromGoogleSheets, 1000);
        
    } catch (error) {
        console.error('Ошибка обновления статистики:', error);
    }
}

// Обновление элемента статистики с анимацией
function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        const current = parseInt(element.textContent.replace(/,/g, '')) || 0;
        if (current !== value) {
            animateCounter(elementId, value);
        }
    }
}

// Анимация счётчика при изменении значения
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const current = parseInt(element.textContent.replace(/,/g, '')) || 0;
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
    // Проверяем авторизацию
    if (!localStorage.getItem('horoscase_token')) {
        showNotification('Для открытия кейсов войдите в аккаунт', 'warning');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
    // Находим кейс
    const caseItem = casesData.find(c => c.id === caseId);
    if (!caseItem) {
        showNotification('Кейс не найден', 'error');
        return;
    }
    
    // Проверяем баланс
    const balance = parseInt(localStorage.getItem('user_balance') || '0');
    if (balance < caseItem.price_rub) {
        showNotification(`Недостаточно средств. Нужно ${caseItem.price_rub} ₽`, 'error');
        return;
    }
    
    // Обновляем статистику в Google Sheets
    updateStatsOnCaseOpen();
    
    // Открываем кейс
    openCase(caseItem);
}

// Логика открытия кейса
function openCase(caseItem) {
    showNotification(`Открываем ${caseItem.name}...`, 'info');
    
    // Снимаем деньги с баланса
    const balance = parseInt(localStorage.getItem('user_balance') || '0');
    const newBalance = balance - caseItem.price_rub;
    localStorage.setItem('user_balance', newBalance.toString());
    
    // Обновляем UI если пользователь авторизован
    if (currentUser) {
        currentUser.balance = newBalance;
        updateUIForLoggedInUser();
    }
    
    // Показываем результат через 2 секунды (симуляция открытия)
    setTimeout(() => {
        const items = [
            { name: 'Обычный скин 🎨', value: caseItem.price_rub * 0.5 },
            { name: 'Редкий скин ⭐', value: caseItem.price_rub * 1.5 },
            { name: 'Эпический скин ✨', value: caseItem.price_rub * 3 },
            { name: 'Легендарный предмет! 💎', value: caseItem.price_rub * 10 }
        ];
        
        const chances = [60, 25, 10, 5]; // Шансы в процентах
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
        
        showNotification(`Вы получили: ${selectedItem.name}`, 'success');
        
        // Обновляем статистику через 1 секунду
        setTimeout(() => {
            loadStatsFromGoogleSheets();
        }, 1000);
        
    }, 2000);
}

// Проверка авторизации пользователя
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

// Обновление UI для гостя
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

// Обновление UI для авторизованного пользователя
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
            ${!isMobile ? currentUser.username : ''}
        </a>
        <button onclick="logout()" class="btn-logout" title="Выйти">
            <i class="fas fa-sign-out-alt"></i>
            ${!isMobile ? 'Выйти' : ''}
        </button>
    `;
}

// Выход из аккаунта
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

// Форматирование баланса
function formatBalance(balance) {
    if (balance >= 1000000) {
        return (balance / 1000000).toFixed(1) + 'M';
    } else if (balance >= 1000) {
        return (balance / 1000).toFixed(1) + 'K';
    }
    return balance;
}

// Тестовые данные кейсов
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

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    // Удаляем старое уведомление если есть
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

// Обработка кликов по кнопкам открытия кейса
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-open-case') || 
        e.target.closest('.btn-open-case')) {
        
        const caseId = e.target.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || 
                      e.target.closest('.btn-open-case')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        
        if (caseId) {
            handleOpenCase(caseId);
        }
    }
});

// Обработка изменения размера окна
window.addEventListener('resize', function() {
    adaptButtonsForMobile();
});
