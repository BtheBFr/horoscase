// Основные переменные
let currentUser = null;
let casesData = [];
const API_URL = 'http://localhost:3000';

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию
    checkAuth();
    
    // Настраиваем торговые кнопки
    setupTradeButtons();
    
    // Загружаем кейсы
    loadCases();
    
    // Настройка мобильного меню
    setupMobileMenu();
    
    // Обновляем статистику
    updateRealStats();
});

// Настройка кнопок для торговли
function setupTradeButtons() {
    // Кнопка "Торговать" на главной
    const tradeButtons = document.querySelectorAll('.btn-secondary, a[href="#market"]');
    
    tradeButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const token = localStorage.getItem('horoscase_token');
            
            if (!token) {
                e.preventDefault();
                showNotification('Для торговли нужно войти в аккаунт', 'warning');
                setTimeout(() => {
                    window.location.href = 'auth.html?register=true';
                }, 1500);
                return false;
            }
        });
    });
    
    // Кнопки "Открыть кейс"
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-open-case') || 
            e.target.closest('.btn-open-case')) {
            const token = localStorage.getItem('horoscase_token');
            
            if (!token) {
                e.preventDefault();
                showNotification('Чтобы открыть кейс, войдите в аккаунт', 'warning');
                setTimeout(() => {
                    window.location.href = 'auth.html?register=true';
                }, 2000);
            }
        }
    });
}

// Мобильное меню
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
        
        // Закрытие меню при клике на ссылку
        const menuLinks = navMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
            });
        });
    }
}

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
        displayCases(casesData.slice(0, 6));
    } catch (error) {
        console.error('Ошибка загрузки кейсов:', error);
        // Тестовые кейсы
        casesData = getTestCases();
        displayCases(casesData);
    }
}

function displayCases(cases) {
    const casesGrid = document.getElementById('casesGrid');
    if (!casesGrid) return;
    
    casesGrid.innerHTML = cases.map(caseItem => `
        <div class="case-card" data-id="${caseItem.id}">
            <div class="case-image" style="background: linear-gradient(45deg, ${caseItem.color || '#222'}, #333)">
                <i class="${caseItem.icon || 'fas fa-box'}"></i>
            </div>
            <div class="case-content">
                <h3>${caseItem.name}</h3>
                <p>${caseItem.description || 'Случайные предметы из игры'}</p>
                <div class="case-game">${getGameName(caseItem.game)}</div>
                <div class="case-price">${caseItem.price_rub} ₽</div>
                <button class="btn-open-case" onclick="openCase('${caseItem.id}')">
                    Открыть за ${caseItem.price_rub} ₽
                </button>
            </div>
        </div>
    `).join('');
}

// Обновление реальной статистики
async function updateRealStats() {
    try {
        // Загружаем данные
        const [usersRes, casesRes] = await Promise.all([
            fetch('/data/users.json').catch(() => ({})),
            fetch('/data/cases.json').catch(() => ({}))
        ]);
        
        const usersData = await usersRes.json() || {};
        const casesData = await casesRes.json() || {};
        
        // Считаем реальную статистику
        const totalUsers = Object.keys(usersData).length;
        const totalCases = [
            ...(casesData.csgo_cases || []),
            ...(casesData.dota_cases || []),
            ...(casesData.rust_cases || [])
        ].length;
        
        // Обновляем элементы на странице
        updateStatElement('Кейсов открыто сегодня', calculateTodayOpened());
        updateStatElement('Активных трейдеров', calculateActiveTraders(totalUsers));
        updateStatElement('Редких предметов', calculateRareItems());
        
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        // Стандартные значения
        updateStatElement('Кейсов открыто сегодня', 0);
        updateStatElement('Активных трейдеров', 0);
        updateStatElement('Редких предметов', 0);
    }
}

function updateStatElement(statName, value) {
    // Находим все stat-card и обновляем соответствующий
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        const p = card.querySelector('p');
        if (p && p.textContent.includes(statName)) {
            const h3 = card.querySelector('h3');
            if (h3) {
                h3.textContent = formatNumber(value);
            }
        }
    });
}

function calculateTodayOpened() {
    // В реальном приложении здесь запрос к API
    // Сейчас рандомное значение на основе времени
    const hour = new Date().getHours();
    return Math.floor(hour * 42 + 100);
}

function calculateActiveTraders(totalUsers) {
    // 70% от всех пользователей как активные
    return Math.floor(totalUsers * 0.7);
}

function calculateRareItems() {
    // Рандомное значение
    return Math.floor(Math.random() * 500) + 300;
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Открытие кейса
function openCase(caseId) {
    if (!currentUser) {
        showNotification('Войдите в аккаунт чтобы открывать кейсы', 'warning');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
    // Проверяем баланс
    const balance = parseInt(localStorage.getItem('user_balance') || '0');
    const caseItem = casesData.find(c => c.id === caseId);
    
    if (!caseItem) {
        showNotification('Кейс не найден', 'error');
        return;
    }
    
    if (balance < caseItem.price_rub) {
        showNotification(`Недостаточно средств. Нужно ${caseItem.price_rub} ₽`, 'error');
        return;
    }
    
    // Показываем анимацию открытия
    showCaseOpeningAnimation(caseId, caseItem);
}

function showCaseOpeningAnimation(caseId, caseItem) {
    // Снимаем деньги
    const balance = parseInt(localStorage.getItem('user_balance') || '0');
    const newBalance = balance - caseItem.price_rub;
    localStorage.setItem('user_balance', newBalance.toString());
    
    // Создаем модальное окно для анимации
    const modal = document.createElement('div');
    modal.className = 'case-opening-modal';
    modal.innerHTML = `
        <div class="case-opening-content">
            <div class="spinning-case">
                <i class="${caseItem.icon}"></i>
            </div>
            <h3>Открываем ${caseItem.name}</h3>
            <p>Ищем ваш предмет...</p>
            <div class="opening-progress">
                <div class="progress-bar"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Анимация прогресса
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        const progressBar = modal.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                modal.remove();
                const item = getRandomItemFromCase(caseItem);
                showItemResult(item, caseItem);
                
                // Обновляем статистику
                updateRealStats();
            }, 500);
        }
    }, 100);
}

// Аутентификация
async function checkAuth() {
    const token = localStorage.getItem('horoscase_token');
    if (token) {
        currentUser = {
            email: localStorage.getItem('user_email'),
            username: localStorage.getItem('user_username'),
            balance: localStorage.getItem('user_balance'),
            isAdmin: localStorage.getItem('is_admin') === 'true'
        };
        updateUIForLoggedInUser();
    } else {
        updateUIForGuest();
    }
}

function updateUIForGuest() {
    const navAuth = document.querySelector('.nav-auth');
    if (navAuth) {
        navAuth.innerHTML = `
            <a href="auth.html" class="btn-login"><i class="fas fa-sign-in-alt"></i> Войти</a>
            <a href="auth.html?register=true" class="btn-register">Создать аккаунт</a>
        `;
    }
}

function updateUIForLoggedInUser() {
    const navAuth = document.querySelector('.nav-auth');
    if (navAuth && currentUser) {
        let adminLink = '';
        if (currentUser.isAdmin || currentUser.email === 'frondoffical@gmail.com') {
            adminLink = `<a href="admin.html" style="color: #FFD700; margin-right: 15px;">
                <i class="fas fa-crown"></i> Админ
            </a>`;
        }
        
        navAuth.innerHTML = `
            ${adminLink}
            <a href="inventory.html" class="btn-inventory" style="margin-right: 15px;">
                <i class="fas fa-backpack"></i> Инвентарь
                <span class="balance-badge">${currentUser.balance || 0} ₽</span>
            </a>
            <a href="profile.html" class="btn-profile">
                <i class="fas fa-user-circle"></i>
                ${currentUser.username || 'Пользователь'}
            </a>
            <button onclick="logout()" class="btn-logout">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        `;
    }
}

function logout() {
    localStorage.removeItem('horoscase_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_username');
    localStorage.removeItem('is_admin');
    currentUser = null;
    window.location.reload();
}

// Вспомогательные функции
function getGameName(gameCode) {
    const games = {
        'csgo': 'CS:GO',
        'dota2': 'Dota 2',
        'rust': 'Rust',
        'tf2': 'Team Fortress 2'
    };
    return games[gameCode] || gameCode;
}

function getRandomItemFromCase(caseItem) {
    const items = caseItem.contains || [
        { name: 'Обычный предмет', rarity: 'common', value: Math.floor(caseItem.price_rub * 0.5) },
        { name: 'Редкий предмет', rarity: 'rare', value: Math.floor(caseItem.price_rub * 2) },
        { name: 'Эпический предмет', rarity: 'epic', value: Math.floor(caseItem.price_rub * 5) }
    ];
    
    // Вес в зависимости от редкости
    const weights = {
        'common': 70,
        'rare': 20,
        'epic': 7,
        'legendary': 3
    };
    
    let totalWeight = 0;
    const weightedItems = items.map(item => {
        const weight = weights[item.rarity] || 10;
        totalWeight += weight;
        return { ...item, weight };
    });
    
    let random = Math.random() * totalWeight;
    for (const item of weightedItems) {
        if (random < item.weight) {
            return {
                id: 'item_' + Date.now(),
                name: item.name,
                rarity: item.rarity,
                value: item.value || Math.floor(caseItem.price_rub * (item.rarity === 'legendary' ? 10 : 3)),
                game: caseItem.game,
                icon: getItemIcon(item.rarity)
            };
        }
        random -= item.weight;
    }
    
    // Если что-то пошло не так, возвращаем первый предмет
    return {
        id: 'item_' + Date.now(),
        name: items[0].name,
        rarity: items[0].rarity,
        value: Math.floor(caseItem.price_rub * 0.5),
        game: caseItem.game,
        icon: getItemIcon(items[0].rarity)
    };
}

function getItemIcon(rarity) {
    const icons = {
        'common': 'fas fa-box',
        'rare': 'fas fa-gem',
        'epic': 'fas fa-crown',
        'legendary': 'fas fa-dragon'
    };
    return icons[rarity] || 'fas fa-box';
}

function showItemResult(item, caseItem) {
    const modal = document.createElement('div');
    modal.className = 'item-result-modal';
    modal.innerHTML = `
        <div class="item-result-content">
            <div class="item-rarity ${item.rarity}">${getRarityName(item.rarity)}</div>
            <div class="item-icon">
                <i class="${item.icon}"></i>
            </div>
            <h3>${item.name}</h3>
            <p>Из кейса: ${caseItem.name}</p>
            <div class="item-value">Цена: ${item.value} ₽</div>
            <div class="item-actions">
                <button class="btn-inventory" onclick="addToInventory('${item.id}', '${item.name}', ${item.value}, '${item.rarity}', '${item.game}', '${item.icon}')">
                    <i class="fas fa-backpack"></i> В инвентарь
                </button>
                <button class="btn-sell" onclick="sellItem('${item.id}', ${item.value})">
                    <i class="fas fa-coins"></i> Продать сейчас
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function getRarityName(rarity) {
    const names = {
        'common': 'ОБЫЧНЫЙ',
        'rare': 'РЕДКИЙ',
        'epic': 'ЭПИЧЕСКИЙ',
        'legendary': 'ЛЕГЕНДАРНЫЙ'
    };
    return names[rarity] || rarity.toUpperCase();
}

function addToInventory(itemId, name, value, rarity, game, icon) {
    // Сохраняем в localStorage
    const inventory = JSON.parse(localStorage.getItem('user_inventory') || '[]');
    inventory.push({
        id: itemId,
        name: name,
        value: value,
        rarity: rarity,
        game: game,
        icon: icon,
        obtained: new Date().toISOString()
    });
    
    localStorage.setItem('user_inventory', JSON.stringify(inventory));
    
    showNotification(`"${name}" добавлен в инвентарь!`, 'success');
    document.querySelector('.item-result-modal')?.remove();
}

function sellItem(itemId, value) {
    const balance = parseInt(localStorage.getItem('user_balance') || '0');
    const newBalance = balance + value;
    localStorage.setItem('user_balance', newBalance.toString());
    
    showNotification(`Предмет продан за ${value} ₽`, 'success');
    document.querySelector('.item-result-modal')?.remove();
    
    // Обновляем UI
    if (currentUser) {
        currentUser.balance = newBalance;
        updateUIForLoggedInUser();
    }
}

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Тестовые данные
function getTestCases() {
    return [
        {
            id: 'test_1',
            name: 'CS:GO Test Case',
            game: 'csgo',
            price_rub: 50,
            color: '#FF6B35',
            icon: 'fas fa-fire',
            description: 'Тестовый кейс CS:GO'
        },
        {
            id: 'test_2',
            name: 'Dota 2 Test Treasure',
            game: 'dota2',
            price_rub: 75,
            color: '#00A8FF',
            icon: 'fas fa-gem',
            description: 'Тестовый сундук Dota 2'
        }
    ];
}

// Добавляем CSS для новых элементов
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .btn-inventory {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 15px;
        background: rgba(108, 99, 255, 0.1);
        border: 1px solid #6c63ff;
        border-radius: 20px;
        color: #6c63ff;
        text-decoration: none;
        transition: all 0.3s;
    }
    
    .btn-inventory:hover {
        background: rgba(108, 99, 255, 0.2);
    }
    
    .balance-badge {
        background: linear-gradient(45deg, #6c63ff, #ff6584);
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.8rem;
        font-weight: bold;
        margin-left: 5px;
    }
    
    .case-game {
        color: #6c63ff;
        font-size: 0.9rem;
        margin: 5px 0;
        font-weight: bold;
    }
    
    .spinning-case {
        font-size: 4rem;
        animation: spin 1s linear infinite;
        margin: 20px 0;
        color: #6c63ff;
    }
    
    .opening-progress {
        width: 100%;
        height: 5px;
        background: #333;
        border-radius: 3px;
        margin: 20px 0;
        overflow: hidden;
    }
    
    .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #6c63ff, #ff6584);
        width: 0%;
        transition: width 0.1s linear;
    }
    
    .item-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
    }
    
    .item-actions button {
        flex: 1;
        padding: 10px;
        border-radius: 8px;
        border: none;
        font-weight: bold;
        cursor: pointer;
        transition: opacity 0.3s;
    }
    
    .btn-inventory {
        background: rgba(108, 99, 255, 0.2);
        color: #6c63ff;
    }
    
    .btn-sell {
        background: rgba(255, 107, 53, 0.2);
        color: #ff6b35;
    }
    
    .item-actions button:hover {
        opacity: 0.8;
    }
`;

document.head.appendChild(additionalStyles);
