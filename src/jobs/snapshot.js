const knex = require('../db');

async function createDailySnapshots() {
  const users = await knex('users').select('id');

  for (let user of users) {
    // get holdings for this user
    const holdings = await knex('holdings').where('user_id', user.id);

    let total_inr = 0;
    const details = {};

    for (let h of holdings) {
      const latestPrice = await knex('stock_prices')
        .where('symbol', h.symbol)
        .orderBy('fetched_at', 'desc')
        .first();

      if (latestPrice) {
        const value = h.quantity * latestPrice.price_inr;
        total_inr += value;
        details[h.symbol] = value.toFixed(4);
      }
    }

    // insert snapshot
    await knex('daily_portfolio_snapshots')
      .insert({
        id: knex.raw('uuid_generate_v4()'),
        user_id: user.id,
        snapshot_date: new Date().toISOString().split('T')[0],
        total_inr: total_inr.toFixed(4),
        details
      })
      .onConflict(['user_id', 'snapshot_date'])
      .ignore();

    console.log(`✅ Snapshot saved for user ${user.id} - Total INR: ${total_inr.toFixed(4)}`);
  }

  process.exit(0);
}

createDailySnapshots();
