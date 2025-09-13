const express = require('express');
const router = express.Router();
const knex = require('../db');

// GET /portfolio/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const holdings = await knex('holdings').where('user_id', userId);

    const result = [];
    for (let h of holdings) {
      const latestPrice = await knex('stock_prices')
        .where('symbol', h.symbol)
        .orderBy('fetched_at', 'desc')
        .first();

      if (latestPrice) {
        const currentValue = h.quantity * latestPrice.price_inr;
        result.push({
          symbol: h.symbol,
          quantity: h.quantity,
          avg_price_inr: h.avg_price_inr,
          current_price_inr: latestPrice.price_inr,
          current_value_inr: currentValue.toFixed(4)
        });
      }
    }

    res.json({
      user_id: userId,
      holdings: result
    });
  } catch (err) {
    console.error('❌ Error fetching portfolio:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
