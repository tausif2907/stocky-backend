const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const knex = require('../db');

// 1) Define payload schema
const rewardSchema = Joi.object({
  user_id: Joi.string().required(),
  symbol: Joi.string().uppercase().required(),
  quantity: Joi.number().precision(6).positive().required(),
  price_per_share: Joi.number().precision(4).positive().required(),
  fees: Joi.object({
    brokerage: Joi.number().precision(4).min(0).default(0),
    stt: Joi.number().precision(4).min(0).default(0),
    gst: Joi.number().precision(4).min(0).default(0),
    other: Joi.number().precision(4).min(0).default(0)
  }).default({}),
  external_id: Joi.string().optional(),
  rewarded_at: Joi.date().iso().default(() => new Date()) // ✅ fixed
});

router.post('/', async (req, res) => {
  const idempotencyKey = req.header('Idempotency-Key');

  // 2) Validate payload
  const { error, value } = rewardSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { user_id, symbol, quantity, price_per_share, fees, external_id, rewarded_at } = value;
  const fees_total = Object.values(fees).reduce((sum, n) => sum + n, 0);
  const total_cash_outflow = (quantity * price_per_share) + fees_total;

  const trx = await knex.transaction();

  try {
    // 3) Check idempotency (if key provided)
    if (idempotencyKey) {
      const existing = await trx('idempotency_keys').where({ idempotency_key: idempotencyKey }).first();
      if (existing) {
        await trx.commit();
        return res.status(200).json(existing.result_json); // return cached result
      }
    }

    // 4) Insert reward event
    const [reward] = await trx('reward_events')
      .insert({
        user_id,
        symbol,
        quantity,
        price_per_share,
        fees_total,
        fees,
        total_cash_outflow,
        rewarded_at
      })
      .returning(['id', 'created_at']);

    const reward_id = reward.id;

    // 5) Create ledger transaction
    const [ledgerTxn] = await trx('ledger_txns')
      .insert({
        reference_type: 'reward_event',
        reference_id: reward_id,
        description: `Reward of ${quantity} shares of ${symbol}`
      })
      .returning(['id']);

    const ledger_txn_id = ledgerTxn.id;

    // 6) Ledger entries (debit stock asset, credit cash)
    await trx('ledger_entries').insert([
      {
        ledger_txn_id,
        account: `asset:stock:${symbol}:user:${user_id}`,
        amount_inr: quantity * price_per_share,
        amount_shares: quantity,
        symbol
      },
      {
        ledger_txn_id,
        account: `liability:cash:user:${user_id}`,
        amount_inr: -total_cash_outflow,
        symbol
      }
    ]);

    // 7) Update holdings (upsert)
    await trx.raw(`
      INSERT INTO holdings (user_id, symbol, quantity, avg_price_inr, updated_at)
      VALUES (?, ?, ?, ?, now())
      ON CONFLICT (user_id, symbol)
      DO UPDATE
      SET quantity = holdings.quantity + EXCLUDED.quantity,
          avg_price_inr = 
            CASE 
              WHEN holdings.quantity + EXCLUDED.quantity = 0 THEN 0
              ELSE ROUND(((holdings.avg_price_inr * holdings.quantity) + (EXCLUDED.avg_price_inr * EXCLUDED.quantity)) / (holdings.quantity + EXCLUDED.quantity), 4)
            END,
          updated_at = now()
    `, [user_id, symbol, quantity, price_per_share]);

    const result = {
      reward_id,
      user_id,
      symbol,
      quantity,
      price_per_share,
      fees_total,
      total_cash_outflow,
      rewarded_at,
      created_at: reward.created_at
    };

    // 8) Store idempotency result
    if (idempotencyKey) {
      await trx('idempotency_keys').insert({
        idempotency_key: idempotencyKey,
        user_id,
        result_json: result
      });
    }

    await trx.commit();

    res.status(201).json(result);
  } catch (err) {
    await trx.rollback();
    console.error('❌ Error creating reward:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
