const express = require('express');
const db = require('../db');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all users
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, mobile, role, location, is_verified, created_at FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Verify worker
router.put('/verify/:id', auth, adminAuth, async (req, res) => {
  try {
    await db.query('UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = $1', [req.params.id]);
    const exists = await db.query("SELECT id FROM badges WHERE user_id = $1 AND badge_type = 'Verified Worker'", [req.params.id]);
    if (exists.rows.length === 0) await db.query("INSERT INTO badges (user_id, badge_type) VALUES ($1, 'Verified Worker')", [req.params.id]);
    res.json({ message: 'Worker verified' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Delete user
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Get all jobs for moderation
router.get('/jobs', auth, adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT j.*, u.name as employer_name FROM jobs j JOIN users u ON j.employer_id = u.id ORDER BY j.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Delete job
router.delete('/jobs/:id', auth, adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM jobs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Job deleted' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Get reports
router.get('/reports', auth, adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, u1.name as reporter_name, u2.name as reported_name
       FROM reports r LEFT JOIN users u1 ON r.reporter_id = u1.id LEFT JOIN users u2 ON r.reported_user_id = u2.id
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Resolve report
router.put('/reports/:id', auth, adminAuth, async (req, res) => {
  try {
    await db.query('UPDATE reports SET status = $1 WHERE id = $2', [req.body.status, req.params.id]);
    res.json({ message: 'Report updated' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Platform analytics
router.get('/analytics', auth, adminAuth, async (req, res) => {
  try {
    const workers = await db.query("SELECT COUNT(*) FROM users WHERE role = 'worker'");
    const employers = await db.query("SELECT COUNT(*) FROM users WHERE role = 'employer'");
    const totalJobs = await db.query('SELECT COUNT(*) FROM jobs');
    const openJobs = await db.query("SELECT COUNT(*) FROM jobs WHERE status = 'open'");
    const completedJobs = await db.query("SELECT COUNT(*) FROM jobs WHERE status = 'completed'");
    const totalTransactions = await db.query('SELECT COALESCE(SUM(amount), 0) as total FROM transactions');
    const pendingVerifications = await db.query("SELECT COUNT(*) FROM users WHERE role = 'worker' AND is_verified = false");
    const pendingReports = await db.query("SELECT COUNT(*) FROM reports WHERE status = 'pending'");
    res.json({
      workers: parseInt(workers.rows[0].count),
      employers: parseInt(employers.rows[0].count),
      totalJobs: parseInt(totalJobs.rows[0].count),
      openJobs: parseInt(openJobs.rows[0].count),
      completedJobs: parseInt(completedJobs.rows[0].count),
      totalTransactionVolume: parseFloat(totalTransactions.rows[0].total),
      pendingVerifications: parseInt(pendingVerifications.rows[0].count),
      pendingReports: parseInt(pendingReports.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
