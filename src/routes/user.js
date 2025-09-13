const express = require('express');
const router = express.Router();
const knex = require('../db');
const { v4: uuidv4 } = require('uuid');

router.post('/', async (req, res) => {
  try {
    const id = uuidv4();
    const [user] = await knex('users')
      .insert({ id, name: req.body.name, email: req.body.email })
      .returning(['id', 'name', 'email', 'created_at']);

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
