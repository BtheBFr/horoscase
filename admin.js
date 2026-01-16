// admin.js - Панель администратора
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAccess();
    loadAdminStats();
    setupAdminControls();
});

function checkAdminAccess() {
    const userEmail = localStorage.getItem('user_email');
    if (userEmail !== 'frondoffical@gmail.com') {
        document.body.innerHTML = `
            <div style="text-align: center; padding: 100px; color: white;">
                <h2 style="color: #ff4757;">⛔ Доступ запрещен!</h2>
                <p>Эта панель только для администратора</p>
                <a href="index.html" style="color: #6c63ff;">На главную</a>
            </div>
        `;
        return false;
    }
    return true;
}

async function loadAdminStats() {
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbx08LjFIWFZlBPwH_oihZ7MqpbKH-zYT5OC1dPqUtig6WaStSVCIZ2j1fBpwlbhfHB6/exec');
        const data = await response.json();
        
        document.getElementById('adminCases').textContent = data.cases || 0;
        document.getElementById('adminTraders').textContent = data.traders || 0;
        document.getElementById('adminItems').textContent = data.items || 0;
        document.getElementById('lastUpdate').textContent = new Date(data.updated || Date.now()).toLocaleString('ru-RU');
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

function setupAdminControls() {
    // Кнопка сброса кейсов
    document.getElementById('resetCases')?.addEventListener('click', function() {
        if (confirm('Сбросить счетчик кейсов на 0?')) {
            updateGoogleSheetStat('cases', -9999); // Сброс до 0
            setTimeout(loadAdminStats, 1000);
        }
    });
    
    // Кнопка добавления тестовых данных
    document.getElementById('addTestData')?.addEventListener('click', function() {
        updateGoogleSheetStat('cases', 50);
        updateGoogleSheetStat('traders', 10);
        updateGoogleSheetStat('items', 5);
        setTimeout(loadAdminStats, 2000);
    });
}

async function updateGoogleSheetStat(type, value) {
    try {
        await fetch(`https://script.google.com/macros/s/AKfycbx08LjFIWFZlBPwH_oihZ7MqpbKH-zYT5OC1dPqUtig6WaStSVCIZ2j1fBpwlbhfHB6/exec?action=update&type=${type}&value=${value}`);
    } catch (error) {
        console.error('Ошибка обновления:', error);
    }
}
