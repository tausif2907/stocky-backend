const express = require('express');
const router = express.Router();
const knex = require('../db');

// GET /historical-inr/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const snapshots = await knex('daily_portfolio_snapshots')
      .where('user_id', userId)
      .andWhere('snapshot_date', '<', knex.fn.now()) // up to yesterday
      .orderBy('snapshot_date', 'desc')
      .select('snapshot_date as date', 'total_inr as portfolio_inr', 'details');

    res.json({
      user_id: userId,
      historical: snapshots.map(row => ({
        date: row.date,
        portfolio_inr: row.portfolio_inr,
        stale: false // optional flag if you want to mark old data
      }))
    });
  } catch (err) {
    console.error('❌ Error fetching historical INR:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
