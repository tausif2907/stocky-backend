require('dotenv').config();
const knexConfig = require('../knexfile').development;
const knex = require('knex')(knexConfig);

module.exports = knex;
