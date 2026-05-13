const express = require('express');
const db = require('../db');
const { auth, employerAuth } = require('../middleware/auth');

const router = express.Router();

// Get all jobs (with filters)
router.get('/', async (req, res) => {
  try {
    const { skill, location, min_pay, max_pay, status = 'open' } = req.query;
    let query = `
      SELECT j.*, u.name as employer_name, u.company_name, u.mobile as employer_mobile,
        COALESCE(
          (SELECT json_agg(js.skill) FROM job_skills js WHERE js.job_id = j.id), '[]'
        ) as skills,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as applicant_count
      FROM jobs j
      JOIN users u ON j.employer_id = u.id
      WHERE j.status = $1
    `;
    const params = [status];
    let paramCount = 1;

    if (location) {
      paramCount++;
      query += ` AND LOWER(j.location) LIKE LOWER($${paramCount})`;
      params.push(`%${location}%`);
    }
    if (min_pay) {
      paramCount++;
      query += ` AND j.payment >= $${paramCount}`;
      params.push(min_pay);
    }
    if (max_pay) {
      paramCount++;
      query += ` AND j.payment <= $${paramCount}`;
      params.push(max_pay);
    }
    if (skill) {
      paramCount++;
      query += ` AND j.id IN (SELECT job_id FROM job_skills WHERE LOWER(skill) LIKE LOWER($${paramCount}))`;
      params.push(`%${skill}%`);
    }

    query += ' ORDER BY j.is_boosted DESC, j.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT j.*, u.name as employer_name, u.company_name, u.mobile as employer_mobile, u.email as employer_email,
        COALESCE(
          (SELECT json_agg(js.skill) FROM job_skills js WHERE js.job_id = j.id), '[]'
        ) as skills,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as applicant_count
      FROM jobs j
      JOIN users u ON j.employer_id = u.id
      WHERE j.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get applicants
    const applicants = await db.query(
      `SELECT ja.*, u.name as worker_name, u.mobile as worker_mobile, u.email as worker_email, u.location as worker_location, u.is_verified,
        COALESCE(
          (SELECT json_agg(ws.skill) FROM worker_skills ws WHERE ws.user_id = u.id), '[]'
        ) as worker_skills,
        (SELECT AVG(rating)::NUMERIC(3,2) FROM reviews r WHERE r.reviewee_id = u.id) as avg_rating
      FROM job_applications ja
      JOIN users u ON ja.worker_id = u.id
      WHERE ja.job_id = $1
      ORDER BY ja.applied_at DESC`,
      [req.params.id]
    );

    res.json({ ...result.rows[0], applicants: applicants.rows });
  } catch (err) {
    console.error('Get job error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create job
router.post('/', auth, employerAuth, async (req, res) => {
  try {
    const { title, description, payment, location, workers_needed, duration, skills, image_url } = req.body;

    const result = await db.query(
      `INSERT INTO jobs (employer_id, title, description, payment, location, workers_needed, duration, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, title, description, payment, location, workers_needed || 1, duration, image_url]
    );

    const job = result.rows[0];

    // Add skills
    if (skills && skills.length > 0) {
      for (const skill of skills) {
        await db.query('INSERT INTO job_skills (job_id, skill) VALUES ($1, $2)', [job.id, skill]);
      }
    }

    // Create escrow transaction
    await db.query(
      `INSERT INTO transactions (from_user_id, job_id, amount, type, status, description)
       VALUES ($1, $2, $3, 'escrow', 'completed', 'Payment held in escrow for job')`,
      [req.user.id, job.id, payment * (workers_needed || 1)]
    );

    // Deduct from employer wallet
    await db.query(
      'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2',
      [payment * (workers_needed || 1), req.user.id]
    );

    res.status(201).json(job);
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Apply to job
router.post('/:id/apply', auth, async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ error: 'Only workers can apply' });
    }

    // Check if already applied
    const existing = await db.query(
      'SELECT id FROM job_applications WHERE job_id = $1 AND worker_id = $2',
      [req.params.id, req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }

    await db.query(
      'INSERT INTO job_applications (job_id, worker_id) VALUES ($1, $2)',
      [req.params.id, req.user.id]
    );

    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept/Reject applicant
router.put('/:jobId/applicants/:appId', auth, employerAuth, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    await db.query(
      'UPDATE job_applications SET status = $1 WHERE id = $2',
      [status, req.params.appId]
    );

    if (status === 'accepted') {
      // Check if enough workers accepted
      const job = await db.query('SELECT * FROM jobs WHERE id = $1', [req.params.jobId]);
      const accepted = await db.query(
        "SELECT COUNT(*) FROM job_applications WHERE job_id = $1 AND status = 'accepted'",
        [req.params.jobId]
      );
      if (parseInt(accepted.rows[0].count) >= job.rows[0].workers_needed) {
        await db.query("UPDATE jobs SET status = 'in_progress', updated_at = NOW() WHERE id = $1", [req.params.jobId]);
      }
    }

    res.json({ message: `Application ${status}` });
  } catch (err) {
    console.error('Update applicant error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete job & release payment
router.put('/:id/complete', auth, employerAuth, async (req, res) => {
  try {
    const job = await db.query('SELECT * FROM jobs WHERE id = $1 AND employer_id = $2', [req.params.id, req.user.id]);
    if (job.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Mark job as completed
    await db.query("UPDATE jobs SET status = 'completed', updated_at = NOW() WHERE id = $1", [req.params.id]);

    // Get accepted workers
    const workers = await db.query(
      "SELECT worker_id FROM job_applications WHERE job_id = $1 AND status = 'accepted'",
      [req.params.id]
    );

    const payment = parseFloat(job.rows[0].payment);

    // Release payment to each worker
    for (const worker of workers.rows) {
      await db.query(
        'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
        [payment, worker.worker_id]
      );
      await db.query(
        `INSERT INTO transactions (from_user_id, to_user_id, job_id, amount, type, status, description)
         VALUES ($1, $2, $3, $4, 'release', 'completed', 'Payment released for completed job')`,
        [req.user.id, worker.worker_id, req.params.id, payment]
      );
    }

    res.json({ message: 'Job completed and payments released' });
  } catch (err) {
    console.error('Complete job error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Boost job
router.put('/:id/boost', auth, employerAuth, async (req, res) => {
  try {
    const boostCost = 500;

    // Deduct from wallet
    const wallet = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [req.user.id]);
    if (parseFloat(wallet.rows[0].balance) < boostCost) {
      return res.status(400).json({ error: 'Insufficient wallet balance for boost' });
    }

    await db.query('UPDATE wallets SET balance = balance - $1 WHERE user_id = $2', [boostCost, req.user.id]);
    await db.query(
      "UPDATE jobs SET is_boosted = true, boost_expires_at = NOW() + INTERVAL '7 days' WHERE id = $1",
      [req.params.id]
    );
    await db.query(
      `INSERT INTO transactions (from_user_id, job_id, amount, type, status, description)
       VALUES ($1, $2, $3, 'boost', 'completed', 'Priority hiring boost')`,
      [req.user.id, req.params.id, boostCost]
    );

    res.json({ message: 'Job boosted successfully' });
  } catch (err) {
    console.error('Boost error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get employer's jobs
router.get('/employer/my-jobs', auth, employerAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT j.*,
        COALESCE((SELECT json_agg(js.skill) FROM job_skills js WHERE js.job_id = j.id), '[]') as skills,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as applicant_count,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted') as accepted_count
      FROM jobs j WHERE j.employer_id = $1 ORDER BY j.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get my jobs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
