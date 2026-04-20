import { state } from './state.js';

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); // Разворачиваем на весь экран

let currentChart = null;
let currentSymbol = '';

// ГЛАВНЫЙ ЭКРАН (Рынок)
const renderApp = () => {
    const user = tg.initDataUnsafe?.user;
    const root = document.getElementById('app-root');
    const tradeScreen = document.getElementById('trade-screen');
    
    if (!root) return;
    
    root.style.display = 'block';
    if (tradeScreen) tradeScreen.style.display = 'none';

    root.innerHTML = `
        <div class="header-top">
            <div class="profile-section">
                <img src="${user?.photo_url || 'https://via.placeholder.com/100'}" class="avatar">
                <span class="nickname">${user?.first_name || 'Алижан'}</span>
            </div>
            <button class="top-up-btn" onclick="window.topUp()">+⭐</button>
        </div>

        <div class="main-balance">
            <span class="stars-val">⭐${state.ngt_stars.toFixed(2)}</span>
            <div class="withdraw-actions">
                <button onclick="window.withdraw('Coins')">Вывод в Coins</button>
                <button onclick="window.withdraw('NIG')">Вывод в NIG</button>
            </div>
        </div>

        <div class="market-section">
            <p class="market-title">РЫНОК АКТИВОВ</p>
            <div class="market-list">
                ${state.currencies.map(coin => `
                    <div class="coin-card" onclick="window.openTrade('${coin.symbol}')">
                        <div class="coin-info">
                            <span class="coin-icon">${coin.icon}</span>
                            <span class="coin-symbol">${coin.symbol}</span>
                        </div>
                        <span class="coin-price">${coin.price.toFixed(2)} ★</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

// ПОПОЛНЕНИЕ (Курс 100 TG Stars = 100 NGT Stars)
window.topUp = () => {
    tg.showConfirm("Купить 100 NGT Stars за 100 ⭐ Telegram Stars?", (confirmed) => {
        if (confirmed) {
            state.ngt_stars += 100;
            renderApp();
            tg.HapticFeedback.notificationOccurred('success');
            tg.showAlert("Оплата прошла успешно! Баланс пополнен.");
        }
    });
};

// ВЫВОД В БОТА
window.withdraw = (target) => {
    if (state.ngt_stars <= 0) {
        tg.showAlert("У вас нет NGT Stars для вывода!");
        return;
    }
    
    tg.showPopup({
        title: 'Вывод средств',
        message: `Вывести ${state.ngt_stars.toFixed(2)} Stars в ${target}?`,
        buttons: [
            {id: 'yes', type: 'default', text: 'Да, вывести'},
            {id: 'no', type: 'destructive', text: 'Отмена'},
        ]
    }, (buttonId) => {
        if (buttonId === 'yes') {
            tg.sendData(JSON.stringify({
                action: "withdraw",
                amount: state.ngt_stars,
                target: target
            }));
            state.ngt_stars = 0;
            renderApp();
        }
    });
};

// ЭКРАН ТОРГОВЛИ
window.openTrade = (symbol) => {
    currentSymbol = symbol;
    const coin = state.currencies.find(c => c.symbol === symbol);
    
    document.getElementById('app-root').style.display = 'none';
    const tradeScreen = document.getElementById('trade-screen');
    tradeScreen.style.display = 'flex';
    
    document.getElementById('coin-logo-large').innerText = coin.icon;
    document.getElementById('coin-price-large').innerText = `${coin.price.toFixed(2)} ⭐`;
    
    initChart(coin);
};

window.backToMarket = () => {
    renderApp();
};

// ПОКУПКА АКТИВА (С ПРОВЕРКОЙ БАЛАНСА)
window.buyProcess = () => {
    const coin = state.currencies.find(c => c.symbol === currentSymbol);
    
    if (state.ngt_stars >= coin.price) {
        state.ngt_stars -= coin.price;
        coin.price *= 1.01; // Рост на 1% после покупки
        coin.history.push(coin.price);
        
        document.getElementById('coin-price-large').innerText = `${coin.price.toFixed(2)} ⭐`;
        initChart(coin);
        tg.HapticFeedback.impactOccurred('medium');
    } else {
        tg.showAlert("Недостаточно NGT Stars! Пополните баланс кнопкой +⭐");
    }
};

// ПРОДАЖА АКТИВА
window.sellProcess = () => {
    const coin = state.currencies.find(c => c.symbol === currentSymbol);
    
    state.ngt_stars += coin.price * 0.95; // Продажа с комиссией 5%
    coin.price *= 0.99; // Падение после продажи
    coin.history.push(coin.price);
    
    document.getElementById('coin-price-large').innerText = `${coin.price.toFixed(2)} ⭐`;
    initChart(coin);
    tg.HapticFeedback.impactOccurred('light');
};

// ТАЙМФРЕЙМЫ (Оживляем кнопки 1Д, 7Д, 1М, 1Г)
window.changeTimeframe = (tf) => {
    tg.HapticFeedback.selectionChanged();
    const coin = state.currencies.find(c => c.symbol === currentSymbol);
    
    // Имитация изменения масштаба (для визуала)
    if (tf === '1Г') {
        tg.showAlert("Загружаем статистику за год...");
    }
    initChart(coin);
};

// ГРАФИК (Chart.js)
function initChart(coin) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    if (currentChart) currentChart.destroy();
    
    const isUp = coin.history[coin.history.length - 1] >= coin.history[0];
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: coin.history.map((_, i) => i),
            datasets: [{
                data: coin.history,
                borderColor: isUp ? '#f3ba2f' : '#ff4d4d',
                borderWidth: 3,
                fill: true,
                backgroundColor: isUp ? 'rgba(243, 186, 47, 0.1)' : 'rgba(255, 77, 77, 0.1)',
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#848e9c', font: { size: 10 } }
                }
            }
        }
    });
}

// Запуск приложения
renderApp();

