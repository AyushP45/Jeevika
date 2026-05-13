const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/balance', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [req.user.id]);
    res.json({ balance: parseFloat(result.rows[0]?.balance || 0) });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/transactions', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, j.title as job_title, fu.name as from_name, tu.name as to_name
      FROM transactions t
      LEFT JOIN jobs j ON t.job_id = j.id
      LEFT JOIN users fu ON t.from_user_id = fu.id
      LEFT JOIN users tu ON t.to_user_id = tu.id
      WHERE t.from_user_id = $1 OR t.to_user_id = $1
      ORDER BY t.created_at DESC`, [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    await db.query('UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2', [amount, req.user.id]);
    await db.query(`INSERT INTO transactions (to_user_id, amount, type, status, description) VALUES ($1, $2, 'deposit', 'completed', 'Wallet deposit')`, [req.user.id, amount]);
    const wallet = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Deposit successful', balance: parseFloat(wallet.rows[0].balance) });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/withdraw', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    const wallet = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [req.user.id]);
    if (parseFloat(wallet.rows[0].balance) < amount) return res.status(400).json({ error: 'Insufficient balance' });
    await db.query('UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2', [amount, req.user.id]);
    await db.query(`INSERT INTO transactions (from_user_id, amount, type, status, description) VALUES ($1, $2, 'withdraw', 'completed', 'Wallet withdrawal to UPI')`, [req.user.id, amount]);
    const updated = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Withdrawal successful', balance: parseFloat(updated.rows[0].balance) });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
