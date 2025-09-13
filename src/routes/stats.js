const express = require('express');
const router = express.Router();
const knex = require('../db');

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // 1) Get total shares rewarded today, grouped by symbol
    const todayTotals = await knex('reward_events')
      .select('symbol')
      .sum('quantity as total_quantity')
      .where('user_id', userId)
      .andWhereRaw('DATE(rewarded_at) = CURRENT_DATE')
      .groupBy('symbol');

    // 2) Get current portfolio value
    // Fetch holdings first
    const holdings = await knex('holdings')
      .select('symbol', 'quantity')
      .where('user_id', userId);

    if (holdings.length === 0) {
      return res.json({
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        total_shares_today: todayTotals,
        current_portfolio_inr: 0,
        valuation_timestamp: null,
        price_stale: true
      });
    }

    // Fetch latest price per symbol from stock_prices
    const symbols = holdings.map(h => h.symbol);
    const latestPrices = await knex.raw(`
      SELECT DISTINCT ON (symbol) symbol, price_inr, fetched_at
      FROM stock_prices
      WHERE symbol = ANY(?)
      ORDER BY symbol, fetched_at DESC
    `, [symbols]);

    // Build a map of symbol -> latest price
    const priceMap = {};
    latestPrices.rows.forEach(row => {
      priceMap[row.symbol] = { price: parseFloat(row.price_inr), fetched_at: row.fetched_at };
    });

    // Calculate total portfolio INR
    let portfolioValue = 0;
    let latestTimestamp = null;
    for (const h of holdings) {
      if (priceMap[h.symbol]) {
        portfolioValue += parseFloat(h.quantity) * priceMap[h.symbol].price;
        if (!latestTimestamp || new Date(priceMap[h.symbol].fetched_at) > new Date(latestTimestamp)) {
          latestTimestamp = priceMap[h.symbol].fetched_at;
        }
      }
    }

    res.json({
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      total_shares_today: todayTotals,
      current_portfolio_inr: Number(portfolioValue.toFixed(4)),
      valuation_timestamp: latestTimestamp,
      price_stale: latestTimestamp ? (new Date() - new Date(latestTimestamp)) > 3600000 : true // stale if > 1h old
    });

  } catch (err) {
    console.error('❌ Error fetching stats:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
