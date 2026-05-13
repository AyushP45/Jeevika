const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get workers with filters
router.get('/', async (req, res) => {
  try {
    const { skill, location, verified } = req.query;
    let query = `SELECT u.id, u.name, u.email, u.mobile, u.location, u.experience, u.profile_photo, u.is_verified, u.created_at,
      COALESCE((SELECT json_agg(ws.skill) FROM worker_skills ws WHERE ws.user_id = u.id), '[]') as skills,
      (SELECT AVG(rating)::NUMERIC(3,2) FROM reviews r WHERE r.reviewee_id = u.id) as avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = u.id) as review_count,
      (SELECT COUNT(*) FROM job_applications ja WHERE ja.worker_id = u.id AND ja.status = 'accepted') as completed_jobs,
      COALESCE((SELECT json_agg(json_build_object('badge_type', b.badge_type, 'earned_at', b.earned_at)) FROM badges b WHERE b.user_id = u.id), '[]') as badges
      FROM users u WHERE u.role = 'worker'`;
    const params = [];
    let pc = 0;
    if (location) { pc++; query += ` AND LOWER(u.location) LIKE LOWER($${pc})`; params.push(`%${location}%`); }
    if (verified === 'true') { query += ' AND u.is_verified = true'; }
    if (skill) { pc++; query += ` AND u.id IN (SELECT user_id FROM worker_skills WHERE LOWER(skill) LIKE LOWER($${pc}))`; params.push(`%${skill}%`); }
    query += ' ORDER BY u.is_verified DESC, u.created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Review a worker
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment, job_id } = req.body;
    await db.query('INSERT INTO reviews (reviewer_id, reviewee_id, job_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, req.params.id, job_id, rating, comment]);
    // Auto-badge logic
    const stats = await db.query('SELECT AVG(rating)::NUMERIC(3,2) as avg, COUNT(*) as cnt FROM reviews WHERE reviewee_id = $1', [req.params.id]);
    const avg = parseFloat(stats.rows[0].avg); const cnt = parseInt(stats.rows[0].cnt);
    if (cnt >= 5 && avg >= 4.5) {
      const exists = await db.query("SELECT id FROM badges WHERE user_id = $1 AND badge_type = 'Top Rated'", [req.params.id]);
      if (exists.rows.length === 0) await db.query("INSERT INTO badges (user_id, badge_type) VALUES ($1, 'Top Rated')", [req.params.id]);
    }
    if (cnt >= 10) {
      const exists = await db.query("SELECT id FROM badges WHERE user_id = $1 AND badge_type = 'Gold Worker'", [req.params.id]);
      if (exists.rows.length === 0) await db.query("INSERT INTO badges (user_id, badge_type) VALUES ($1, 'Gold Worker')", [req.params.id]);
    }
    res.status(201).json({ message: 'Review submitted' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
