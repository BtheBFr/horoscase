// Управление инвентарем
let userInventory = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    loadUserInventory();
    loadBalance();
    loadTradeHistory();
});

// Загрузка инвентаря пользователя
async function loadUserInventory() {
    const userId = localStorage.getItem('user_id') || 'guest';
    
    try {
        // В реальном приложении здесь был бы запрос к API
        // Для демо используем тестовые данные
        userInventory = getDemoInventory();
        displayInventory();
        
        // Показываем/скрываем сообщение о пустом инвентаре
        const emptyMsg = document.getElementById('emptyInventory');
        if (userInventory.length === 0) {
            emptyMsg.style.display = 'block';
        } else {
            emptyMsg.style.display = 'none';
        }
    } catch (error) {
        console.error('Ошибка загрузки инвентаря:', error);
        userInventory = [];
    }
}

// Отображение инвентаря
function displayInventory() {
    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;
    
    let filteredItems = userInventory;
    
    // Применяем фильтр
    if (currentFilter !== 'all') {
        filteredItems = userInventory.filter(item => {
            switch(currentFilter) {
                case 'csgo':
                    return item.game === 'CS:GO';
                case 'dota2':
                    return item.game === 'Dota 2';
                case 'rust':
                    return item.game === 'Rust';
                case 'rare':
                    return item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary';
                case 'tradable':
                    return item.tradable === true;
                default:
                    return true;
            }
        });
    }
    
    grid.innerHTML = filteredItems.map(item => `
        <div class="item-card" data-id="${item.id}">
            <div class="item-rarity rarity-${item.rarity}">
                ${getRarityName(item.rarity)}
            </div>
            <div class="item-image" style="background: linear-gradient(45deg, ${item.color || '#222'}, #333)">
                <i class="${item.icon}"></i>
            </div>
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-game">${item.game}</div>
                <div class="item-value">${item.value} ₽</div>
                <div class="item-actions">
                    <button class="btn-sell" onclick="openSellModal('${item.id}')">
                        <i class="fas fa-coins"></i> Продать
                    </button>
                    <button class="btn-gift" onclick="openGiftModal('${item.id}')">
                        <i class="fas fa-gift"></i> Подарить
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Фильтрация предметов
function filterItems(filter) {
    currentFilter = filter;
    
    // Обновляем активную кнопку фильтра
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Обновляем отображение
    displayInventory();
}

// Загрузка баланса
function loadBalance() {
    const balance = localStorage.getItem('user_balance') || '0';
    document.getElementById('userBalance').textContent = `${balance} ₽`;
}

// Загрузка истории операций
function loadTradeHistory() {
    const history = getDemoTradeHistory();
    const container = document.getElementById('tradeHistory');
    
    if (!container) return;
    
    container.innerHTML = history.map(record => `
        <div class="trade-item">
            <div>
                <div class="trade-type type-${record.type}">${getTypeName(record.type)}</div>
                <div style="margin-top: 5px; color: #aaa;">${record.item}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: bold; color: ${record.type === 'buy' ? '#ff6b35' : '#4cd964'}">
                    ${record.type === 'buy' ? '-' : '+'}${record.amount} ₽
                </div>
                <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                    ${formatDate(record.date)}
                </div>
            </div>
        </div>
    `).join('');
}

// Модальные окна
let selectedItemId = null;

function openSellModal(itemId) {
    selectedItemId = itemId;
    const item = userInventory.find(i => i.id === itemId);
    
    if (!item) return;
    
    document.getElementById('sellItemName').textContent = item.name;
    document.getElementById('sellPrice').value = item.value;
    showModal('sellModal');
}

function openGiftModal(itemId) {
    selectedItemId = itemId;
    const item = userInventory.find(i => i.id === itemId);
    
    if (!item) return;
    
    document.getElementById('giftItemName').textContent = item.name;
    showModal('giftModal');
}

function showDepositModal() {
    showModal('depositModal');
    document.getElementById('customAmount').value = '';
}

// Подтверждение продажи
function confirmSell() {
    const price = parseFloat(document.getElementById('sellPrice').value);
    const item = userInventory.find(i => i.id === selectedItemId);
    
    if (!price || price <= 0) {
        alert('Введите корректную цену');
        return;
    }
    
    if (!item) return;
    
    // Обновляем баланс
    const currentBalance = parseFloat(localStorage.getItem('user_balance') || '0');
    const newBalance = currentBalance + price;
    localStorage.setItem('user_balance', newBalance.toString());
    
    // Удаляем предмет из инвентаря
    userInventory = userInventory.filter(i => i.id !== selectedItemId);
    
    // Добавляем в историю
    addToTradeHistory({
        type: 'sell',
        item: item.name,
        amount: price,
        date: new Date().toISOString()
    });
    
    // Обновляем интерфейс
    loadBalance();
    displayInventory();
    loadTradeHistory();
    
    // Закрываем модальное окно
    closeModal('sellModal');
    
    // Показываем уведомление
    showNotification(`Вы продали "${item.name}" за ${price} ₽`, 'success');
}

// Подтверждение подарка
function confirmGift() {
    const recipient = document.getElementById('giftRecipient').value;
    const item = userInventory.find(i => i.id === selectedItemId);
    
    if (!recipient) {
        alert('Введите email или ID получателя');
        return;
    }
    
    if (!item) return;
    
    // Удаляем предмет из инвентаря
    userInventory = userInventory.filter(i => i.id !== selectedItemId);
    
    // Добавляем в историю
    addToTradeHistory({
        type: 'gift',
        item: item.name,
        recipient: recipient,
        date: new Date().toISOString()
    });
    
    // Обновляем интерфейс
    displayInventory();
    loadTradeHistory();
    
    // Закрываем модальное окно
    closeModal('giftModal');
    
    // Показываем уведомление
    showNotification(`Вы подарили "${item.name}" пользователю ${recipient}`, 'success');
}

// Пополнение баланса
function selectAmount(amount) {
    document.getElementById('customAmount').value = amount;
}

function processDeposit() {
    const amountInput = document.getElementById('customAmount');
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        alert('Введите корректную сумму');
        return;
    }
    
    // Обновляем баланс
    const currentBalance = parseFloat(localStorage.getItem('user_balance') || '0');
    const newBalance = currentBalance + amount;
    localStorage.setItem('user_balance', newBalance.toString());
    
    // Добавляем в историю
    addToTradeHistory({
        type: 'buy',
        item: 'Пополнение баланса',
        amount: amount,
        date: new Date().toISOString()
    });
    
    // Обновляем интерфейс
    loadBalance();
    loadTradeHistory();
    
    // Закрываем модальное окно
    closeModal('depositModal');
    
    // Показываем уведомление
    showNotification(`Баланс пополнен на ${amount} ₽`, 'success');
}

// Вспомогательные функции
function getRarityName(rarity) {
    const names = {
        'common': 'Обычный',
        'rare': 'Редкий',
        'epic': 'Эпический',
        'legendary': 'Легендарный'
    };
    return names[rarity] || rarity;
}

function getTypeName(type) {
    const names = {
        'buy': 'Покупка',
        'sell': 'Продажа',
        'gift': 'Подарок'
    };
    return names[type] || type;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: #1a1a1a;
        border-left: 4px solid ${type === 'success' ? '#4cd964' : '#6c63ff'};
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 15px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Демо-данные
function getDemoInventory() {
    return [
        {
            id: '1',
            name: 'Нож Karambit | Doppler',
            game: 'CS:GO',
            rarity: 'legendary',
            value: 25000,
            icon: 'fas fa-dagger',
            color: '#9c88ff',
            tradable: true
        },
        {
            id: '2',
            name: 'Перчатки Спектр | Кобальт',
            game: 'CS:GO',
            rarity: 'epic',
            value: 8000,
            icon: 'fas fa-hand-paper',
            color: '#00a8ff',
            tradable: true
        },
        {
            id: '3',
            name: 'AK-47 | Красная линия',
            game: 'CS:GO',
            rarity: 'common',
            value: 150,
            icon: 'fas fa-gun',
            color: '#ff6b35',
            tradable: true
        },
        {
            id: '4',
            name: 'Dragonclaw Hook',
            game: 'Dota 2',
            rarity: 'legendary',
            value: 15000,
            icon: 'fas fa-dragon',
            color: '#fbc531',
            tradable: true
        },
        {
            id: '5',
            name: 'Golden Staff of Gun-Yu',
            game: 'Dota 2',
            rarity: 'epic',
            value: 5000,
            icon: 'fas fa-staff',
            color: '#ffd32a',
            tradable: true
        },
        {
            id: '6',
            name: 'Редкий шлем',
            game: 'Rust',
            rarity: 'rare',
            value: 1200,
            icon: 'fas fa-helmet-battle',
            color: '#808e9b',
            tradable: true
        }
    ];
}

function getDemoTradeHistory() {
    return [
        {
            type: 'buy',
            item: 'Operation Phoenix Case',
            amount: 50,
            date: new Date(Date.now() - 86400000).toISOString() // Вчера
        },
        {
            type: 'gift',
            item: 'AK-47 | Красная линия',
            recipient: 'friend@mail.com',
            date: new Date(Date.now() - 172800000).toISOString() // Позавчера
        },
        {
            type: 'sell',
            item: 'Перчатки Спектр',
            amount: 7500,
            date: new Date(Date.now() - 259200000).toISOString() // 3 дня назад
        },
        {
            type: 'buy',
            item: 'Пополнение баланса',
            amount: 1000,
            date: new Date(Date.now() - 345600000).toISOString() // 4 дня назад
        }
    ];
}

function addToTradeHistory(record) {
    // В реальном приложении здесь был бы запрос к API
    // Для демо просто обновляем локальные данные
    const history = getDemoTradeHistory();
    history.unshift(record);
    
    // Обновляем отображение
    loadTradeHistory();
}
