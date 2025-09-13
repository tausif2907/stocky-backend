const express = require('express');
const router = express.Router();
const knex = require('../db');

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const rewards = await knex('reward_events')
      .where('user_id', userId)
      .andWhereRaw('DATE(rewarded_at) = CURRENT_DATE')
      .select('id as reward_id', 'symbol', 'quantity', 'price_per_share', 'fees_total', 'rewarded_at', 'created_at')
      .orderBy('rewarded_at', 'desc');

    res.json({
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      events: rewards
    });
  } catch (err) {
    console.error('❌ Error fetching today stocks:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
