import { state } from './state.js';

const tg = window.Telegram.WebApp;
tg.ready();

const renderApp = () => {
    const root = document.getElementById('app-root');
    const trade = document.getElementById('trade-screen');
    if (!root) return;

    root.style.display = 'block';
    if (trade) trade.style.display = 'none';

    root.innerHTML = `
        <div class="header-top">
            <div class="profile-section">
                <span class="nickname">Алижан</span>
            </div>
            <button class="top-up-btn">+⭐</button>
        </div>
        <div class="main-balance">
            <span class="stars-val">⭐${state.ngt_stars || 0}</span>
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
                        <span class="coin-price">${coin.price} ★</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

window.openTrade = (symbol) => {
    alert('Нажал на ' + symbol); // Временная проверка
};

// Запуск через небольшую паузу, чтобы всё успело прогрузиться
setTimeout(renderApp, 100);

