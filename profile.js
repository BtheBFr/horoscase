// profile.js
document.addEventListener('DOMContentLoaded', function() {
    const userEmail = localStorage.getItem('user_email');
    if (!userEmail) {
        window.location.href = 'auth.html';
        return;
    }
    
    const username = localStorage.getItem('user_username') || userEmail.split('@')[0];
    const balance = localStorage.getItem('user_balance') || '0';
    const isAdmin = localStorage.getItem('is_admin') === 'true' || userEmail === 'frondoffical@gmail.com';
    
    document.getElementById('profileContent').innerHTML = `
        <div class="profile-card">
            <div class="profile-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <h2>${username}</h2>
            <p class="profile-email">${userEmail}</p>
            
            <div class="profile-stats">
                <div class="stat-item">
                    <i class="fas fa-wallet"></i>
                    <span>Баланс: ${parseInt(balance).toLocaleString('ru-RU')} ₽</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-crown"></i>
                    <span>Статус: ${isAdmin ? 'Администратор 👑' : 'Игрок'}</span>
                </div>
            </div>
            
            <div class="profile-actions">
                <button onclick="location.href='inventory.html'" class="btn-primary">
                    <i class="fas fa-backpack"></i> Мой инвентарь
                </button>
                <button onclick="logout()" class="btn-logout">
                    <i class="fas fa-sign-out-alt"></i> Выйти
                </button>
            </div>
        </div>
    `;
});

function logout() {
    if (confirm('Выйти из аккаунта?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}
