// Основные переменные
let currentUser = null;
const API_URL = 'http://localhost:3000';

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию
    checkAuth();
    
    // Загружаем кейсы
    loadCases();
    
    // Настройка мобильного меню
    setupMobileMenu();
    
    // Проверяем админ-доступ
    checkAdminAccess();
});

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
        displayCases(data.csgo_cases.slice(0, 6)); // Показываем первые 6
    } catch (error) {
        console.error('Ошибка загрузки кейсов:', error);
        // Заглушка на случай ошибки
        displayCases(getFallbackCases());
    }
}

function displayCases(cases) {
    const casesGrid = document.getElementById('casesGrid');
    if (!casesGrid) return;
    
    casesGrid.innerHTML = cases.map(caseItem => `
        <div class="case-card">
            <div class="case-image" style="background: linear-gradient(45deg, ${caseItem.color || '#222'}, #333)">
                <i class="${caseItem.icon || 'fas fa-box'}"></i>
            </div>
            <div class="case-content">
                <h3>${caseItem.name}</h3>
                <p>${caseItem.description || 'Случайные предметы из игры'}</p>
                <div class="case-price">${caseItem.price_rub} ₽</div>
                <button class="btn-open-case" onclick="openCase('${caseItem.id}')">
                    Открыть за ${caseItem.price_rub} ₽
                </button>
            </div>
        </div>
    `).join('');
}

// Заглушка на случай отсутствия данных
function getFallbackCases() {
    return [
        {
            id: 'csgo_1',
            name: 'CS:GO Case',
            description: 'Шанс получить нож или перчатки',
            price_rub: 50,
            color: '#FF6B35',
            icon: 'fas fa-fist-raised'
        },
        {
            id: 'dota_1',
            name: 'Dota 2 Treasure',
            description: 'Редкие сеты героев',
            price_rub: 75,
            color: '#00A8FF',
            icon: 'fas fa-gem'
        },
        {
            id: 'rust_1',
            name: 'Rust Crate',
            description: 'Скины оружия и одежды',
            price_rub: 30,
            color: '#FFD166',
            icon: 'fas fa-shield-alt'
        }
    ];
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
    
    // Показываем анимацию открытия
    showCaseOpeningAnimation(caseId);
}

function showCaseOpeningAnimation(caseId) {
    // Создаем модальное окно для анимации
    const modal = document.createElement('div');
    modal.className = 'case-opening-modal';
    modal.innerHTML = `
        <div class="case-opening-content">
            <div class="spinner"></div>
            <h3>Открываем кейс...</h3>
            <p>Получаем ваш предмет</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Имитируем задержку
    setTimeout(() => {
        modal.remove();
        const item = getRandomItem();
        showItemResult(item);
    }, 2000);
}

function showItemResult(item) {
    const modal = document.createElement('div');
    modal.className = 'item-result-modal';
    modal.innerHTML = `
        <div class="item-result-content">
            <div class="item-rarity ${item.rarity}">${item.rarity.toUpperCase()}</div>
            <div class="item-icon">
                <i class="${item.icon}"></i>
            </div>
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <div class="item-value">Цена: ${item.value} ₽</div>
            <button onclick="addToInventory('${item.id}')">Забрать в инвентарь</button>
            <button onclick="this.closest('.item-result-modal').remove()">Закрыть</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
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

// Аутентификация
async function checkAuth() {
    const token = localStorage.getItem('horoscase_token');
    if (token) {
        try {
            const response = await fetch(`${API_URL}/api/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                currentUser = await response.json();
                updateUIForLoggedInUser();
            }
        } catch (error) {
            localStorage.removeItem('horoscase_token');
        }
    }
}

function updateUIForLoggedInUser() {
    const navAuth = document.querySelector('.nav-auth');
    if (navAuth && currentUser) {
        navAuth.innerHTML = `
            <a href="profile.html" class="btn-profile">
                <i class="fas fa-user-circle"></i>
                ${currentUser.username}
            </a>
            <button onclick="logout()" class="btn-logout">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        `;
    }
}

function logout() {
    localStorage.removeItem('horoscase_token');
    currentUser = null;
    window.location.reload();
}

// Админ доступ
function checkAdminAccess() {
    const token = localStorage.getItem('horoscase_token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.email === 'frondoffical@gmail.com') {
                addAdminLink();
            }
        } catch (error) {
            console.error('Ошибка проверки токена:', error);
        }
    }
}

function addAdminLink() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        const adminLink = document.createElement('a');
        adminLink.href = 'admin.html';
        adminLink.innerHTML = '<i class="fas fa-crown"></i> Админка';
        adminLink.style.color = '#FFD700';
        navMenu.appendChild(adminLink);
    }
}

// Добавление CSS для модальных окон
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .case-opening-modal, .item-result-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    }
    
    .case-opening-content {
        text-align: center;
    }
    
    .spinner {
        width: 80px;
        height: 80px;
        border: 5px solid #333;
        border-top: 5px solid #6c63ff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .item-result-content {
        background: #1a1a1a;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        border: 2px solid #6c63ff;
        max-width: 400px;
        width: 90%;
    }
    
    .item-rarity {
        display: inline-block;
        padding: 5px 15px;
        border-radius: 15px;
        margin-bottom: 20px;
        font-weight: bold;
    }
    
    .item-rarity.common { background: #555; color: white; }
    .item-rarity.rare { background: #00a8ff; color: white; }
    .item-rarity.epic { background: #9c88ff; color: white; }
    .item-rarity.legendary { background: #fbc531; color: black; }
    
    .item-icon {
        font-size: 4rem;
        margin: 20px 0;
        color: #6c63ff;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: #1a1a1a;
        border-left: 4px solid #6c63ff;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 15px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    }
    
    .notification-warning {
        border-left-color: #ffa502;
    }
    
    .notification button {
        background: none;
        border: none;
        color: #aaa;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0 5px;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;

document.head.appendChild(modalStyles);

// Временные функции
function getRandomItem() {
    const items = [
        { id: '1', name: 'Нож Karambit', description: 'Легендарный нож CS:GO', rarity: 'legendary', value: 15000, icon: 'fas fa-dagger' },
        { id: '2', name: 'Перчатки Спектр', description: 'Редкие перчатки', rarity: 'epic', value: 5000, icon: 'fas fa-hand-paper' },
        { id: '3', name: 'AK-47 Красная линия', description: 'Обычный скин', rarity: 'common', value: 150, icon: 'fas fa-gun' }
    ];
    return items[Math.floor(Math.random() * items.length)];
}

function addToInventory(itemId) {
    showNotification('Предмет добавлен в инвентарь!', 'info');
    document.querySelector('.item-result-modal')?.remove();
}
