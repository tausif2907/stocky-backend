const knex = require('../db');

async function fetchMockPrices() {
  const symbols = ['RELIANCE', 'TCS', 'INFY']; // add more if you like

  for (let symbol of symbols) {
    const randomPrice = (2000 + Math.random() * 1000).toFixed(4); // mock INR price
    await knex('stock_prices').insert({
      symbol,
      price_inr: randomPrice,
      fetched_at: new Date()
    });
    console.log(`✅ Inserted mock price for ${symbol}: ₹${randomPrice}`);
  }

  process.exit(0);
}

fetchMockPrices();
