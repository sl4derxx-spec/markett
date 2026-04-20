import { state } from './state.js';

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let currentChart = null;

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
            <button class="top-up-btn">+⭐</button>
        </div>

        <div class="main-balance">
            <span class="stars-val">⭐${state.ngt_stars}</span>
        </div>

        <div class="market-section">
            <p class="market-title">РЫНОК АКТИВОВ</p>
            <div class="market-list">
                ${state.currencies.map(coin => `
                    <div class="coin-card" onclick="window.openTrade('${coin.symbol}')">
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

window.openTrade = (symbol) => {
    const coin = state.currencies.find(c => c.symbol === symbol);
    if (!coin) return;

    document.getElementById('app-root').style.display = 'none';
    const tradeScreen = document.getElementById('trade-screen');
    tradeScreen.style.display = 'flex';

    document.getElementById('coin-logo-large').innerText = coin.icon || '💎';
    document.getElementById('coin-price-large').innerText = `${coin.price.toFixed(2)} ⭐`;
    document.getElementById('chart-container').style.display = 'block';

    initChart(coin);
};

window.backToMarket = () => {
    renderApp();
};

function initChart(coin) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    if (currentChart) currentChart.destroy();

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
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
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
                y: { grid: { color: '#ffffff11' }, ticks: { color: '#888' } }
            }
        }
    });
}

window.buyProcess = () => {
    const activePriceText = document.getElementById('coin-price-large').innerText;
    const symbol = document.querySelector('.coin-symbol')?.innerText || 'NGR';
    const coin = state.currencies.find(c => c.symbol === symbol);
    
    if (coin) {
        coin.price *= 1.02; // +2% за покупку
        coin.history.push(coin.price);
        document.getElementById('coin-price-large').innerText = `${coin.price.toFixed(2)} ⭐`;
        initChart(coin);
        tg.HapticFeedback.impactOccurred('medium');
    }
};

window.sellProcess = () => {
    const symbol = document.querySelector('.coin-symbol')?.innerText || 'NGR';
    const coin = state.currencies.find(c => c.symbol === symbol);
    
    if (coin) {
        coin.price *= 0.98; // -2% за продажу
        coin.history.push(coin.price);
        document.getElementById('coin-price-large').innerText = `${coin.price.toFixed(2)} ⭐`;
        initChart(coin);
        tg.HapticFeedback.impactOccurred('light');
    }
};

renderApp();

