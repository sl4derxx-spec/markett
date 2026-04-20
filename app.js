import { state } from './state.js';

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.setHeaderColor('#0b0e11');

let currentChart = null; // Храним объект графика

const renderApp = () => {
    const user = tg.initDataUnsafe?.user;
    const root = document.getElementById('app-root');
    root.style.display = 'block';
    document.getElementById('trade-screen').style.display = 'none';

    root.innerHTML = `
        <div class="header-top">
            <div class="profile-section">
                <img src="${user?.photo_url || 'https://via.placeholder.com/40'}" class="avatar">
                <span class="nickname">${user?.first_name || 'Алижан'}</span>
            </div>
            <button class="top-up-btn">+⭐</button>
        </div>

        <div class="main-balance">
            <span class="stars-val">⭐${state.ngt_stars}</span>
        </div>

        <div class="market-section">
            <p class="market-title">РЫНОК АКТИВОВ</p>
            <div class="market-list">
                ${state.currencies.map(coin => `
                    <div class="coin-card" onclick="openTrade('${coin.symbol}')">
                        <div class="coin-info">
                            <span class="coin-icon">${coin.icon || '💎'}</span>
                            <span class="coin-symbol">${coin.symbol}</span>
                        </div>
                        <span class="coin-price">${coin.price.toFixed(2)} ★</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

// Функция открытия окна торговли (Тот самый твой рисунок!)
window.openTrade = (symbol) => {
    const coin = state.currencies.find(c => c.symbol === symbol);
    document.getElementById('app-root').style.display = 'none';
    const tradeScreen = document.getElementById('trade-screen');
    tradeScreen.style.display = 'flex';

    document.getElementById('coin-logo-large').innerText = coin.icon || '💎';
    document.getElementById('coin-price-large').innerText = `${coin.price.toFixed(2)} ⭐`;

    initChart(coin);
};

// Функция возврата назад
window.backToMarket = () => {
    renderApp();
};

// ЛОГИКА ГРАФИКА
function initChart(coin) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    if (currentChart) currentChart.destroy(); // Удаляем старый, если был

    // Определяем цвет: если последняя цена >= предпоследней - зеленый, иначе красный
    const isUp = coin.history.length < 2 || coin.history[coin.history.length - 1] >= coin.history[coin.history.length - 2];
    const trendColor = isUp ? '#33ff33' : '#ff3333';

    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: coin.history.map((_, i) => i),
            datasets: [{
                data: coin.history,
                borderColor: trendColor,
                borderWidth: 3,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
                backgroundColor: (context) => {
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, trendColor + '44');
                    gradient.addColorStop(1, 'transparent');
                    return gradient;
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { 
                    grid: { color: '#ffffff11' },
                    ticks: { color: '#888' }
                }
            }
        }
    });
}

// Логика кнопок Buy/Sell (Влияет на рынок!)
window.buyProcess = () => {
    const symbol = document.querySelector('.coin-symbol')?.innerText || 'DGI'; // Условно берем текущую
    const coin = state.currencies.find(c => c.symbol === symbol);
    
    coin.price *= 1.01; // Цена растет на 1%
    coin.history.push(coin.price);
    updateUI(coin);
    tg.HapticFeedback.impactOccurred('medium');
};

window.sellProcess = () => {
    const symbol = document.querySelector('.coin-symbol')?.innerText || 'DGI';
    const coin = state.currencies.find(c => c.symbol === symbol);
    
    coin.price *= 0.99; // Цена падает на 1%
    coin.history.push(coin.price);
    updateUI(coin);
    tg.HapticFeedback.impactOccurred('light');
};

function updateUI(coin) {
    document.getElementById('coin-price-large').innerText = `${coin.price.toFixed(2)} ⭐`;
    initChart(coin);
}

renderApp();

