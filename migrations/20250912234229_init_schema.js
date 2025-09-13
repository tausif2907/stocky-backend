exports.up = async function (knex) {
  // Enable uuid extension if needed
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // USERS
  await knex.schema.createTable('users', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name');
    t.string('email').unique();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // IDEMPOTENCY KEYS
  await knex.schema.createTable('idempotency_keys', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('idempotency_key').unique().notNullable();
    t.uuid('user_id').references('id').inTable('users');
    t.jsonb('result_json');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // REWARD EVENTS
  await knex.schema.createTable('reward_events', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').references('id').inTable('users').notNullable();
    t.string('symbol').notNullable();
    t.decimal('quantity', 18, 6).notNullable();
    t.decimal('price_per_share', 18, 4).notNullable();
    t.decimal('fees_total', 18, 4).notNullable();
    t.jsonb('fees');
    t.decimal('total_cash_outflow', 18, 4).notNullable();
    t.timestamp('rewarded_at').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // HOLDINGS
  await knex.schema.createTable('holdings', t => {
    t.uuid('user_id').references('id').inTable('users');
    t.string('symbol').notNullable();
    t.decimal('quantity', 18, 6).defaultTo(0);
    t.decimal('avg_price_inr', 18, 4).defaultTo(0);
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.primary(['user_id', 'symbol']);
  });

  // STOCK PRICES
  await knex.schema.createTable('stock_prices', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('symbol').notNullable();
    t.decimal('price_inr', 18, 4).notNullable();
    t.timestamp('fetched_at').defaultTo(knex.fn.now());
  });

  // DAILY PORTFOLIO SNAPSHOTS
  await knex.schema.createTable('daily_portfolio_snapshots', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').references('id').inTable('users');
    t.date('snapshot_date').notNullable();
    t.decimal('total_inr', 18, 4).notNullable();
    t.jsonb('details');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'snapshot_date']);
  });

  // LEDGER TRANSACTIONS
  await knex.schema.createTable('ledger_txns', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('reference_type');
    t.uuid('reference_id');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.text('description');
  });

  // LEDGER ENTRIES
  await knex.schema.createTable('ledger_entries', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('ledger_txn_id').references('id').inTable('ledger_txns');
    t.string('account').notNullable();
    t.decimal('amount_inr', 18, 4).notNullable();
    t.decimal('amount_shares', 18, 6);
    t.string('symbol');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema
    .dropTableIfExists('ledger_entries')
    .dropTableIfExists('ledger_txns')
    .dropTableIfExists('daily_portfolio_snapshots')
    .dropTableIfExists('stock_prices')
    .dropTableIfExists('holdings')
    .dropTableIfExists('reward_events')
    .dropTableIfExists('idempotency_keys')
    .dropTableIfExists('users');
};
