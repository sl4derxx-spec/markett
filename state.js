export const state = {
    ngt_stars: 0, 
    coins: 0,
    // Изначально рынок пуст
    currencies: [] 
};

// Функция для добавления новой валюты (будет вызываться ботом или админкой)
export const addCurrency = (symbol, startPrice, initialSupply) => {
    const newCoin = {
        symbol: symbol.toUpperCase(),
        price: startPrice,
        change: 0,
        supply: initialSupply,
        history: [startPrice] // Для будущего графика
    };
    state.currencies.push(newCoin);
};
