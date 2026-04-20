import { state } from './state.js';

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.setHeaderColor('#0b0e11');

const renderApp = () => {
    const user = tg.initDataUnsafe?.user;
    const root = document.getElementById('app-root');

    root.innerHTML = `
        <div class="header-top">
            <div class="profile-section">
                <img src="${user?.photo_url || 'https://via.placeholder.com/35'}" class="avatar">
                <span class="nickname">${user?.first_name || 'Алижан'}</span>
            </div>
            <button class="top-up-btn" onclick="alert('Пополнение Stars')">+⭐</button>
        </div>

        <div class="main-balance">
            <span class="stars-val">⭐${state.ngt_stars}</span>
            <span class="divider">|</span>
            <span class="coins-val">${state.coins} Coins</span>
        </div>

        <div class="market-section">
            <p class="market-title">Рынок активов</p>
            ${state.currencies.length === 0 ? `
                <div class="empty-market">
                    <p>➖➖➖➖➖➖➖</p>
                    <p>Валют пока что нет, ждите добавления</p>
                </div>
            ` : `
                ${renderMarketList()}
            `}
        </div>
    `;
};

function renderMarketList() {
    return state.currencies.map(coin => `
        <div class="coin-card" style="display:flex; justify-content:space-between; background:#1e2329; padding:15px; margin-bottom:8px; border-radius:4px;">
            <span style="font-weight:bold;">${coin.symbol}</span>
            <span style="color:#f3ba2f;">${coin.price} ★</span>
        </div>
    `).join('');
}

renderApp();
