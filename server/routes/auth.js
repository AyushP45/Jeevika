const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { auth } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, mobile, password, role, location, upi_id, company_name, experience, skills } = req.body;

    // Check if user exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await db.query(
      `INSERT INTO users (name, email, mobile, password, role, location, upi_id, company_name, experience)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, name, email, role`,
      [name, email, mobile, hashedPassword, role, location, upi_id, company_name, experience]
    );

    const user = result.rows[0];

    // Create wallet
    await db.query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', [user.id, role === 'employer' ? 10000 : 0]);

    // Add skills for workers
    if (role === 'worker' && skills && skills.length > 0) {
      for (const skill of skills) {
        await db.query('INSERT INTO worker_skills (user_id, skill) VALUES ($1, $2)', [user.id, skill]);
      }
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Get skills if worker
    let skills = [];
    if (user.role === 'worker') {
      const skillsResult = await db.query('SELECT skill FROM worker_skills WHERE user_id = $1', [user.id]);
      skills = skillsResult.rows.map(r => r.skill);
    }

    // Get wallet
    const walletResult = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [user.id]);
    const wallet_balance = walletResult.rows[0]?.balance || 0;

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        location: user.location,
        upi_id: user.upi_id,
        company_name: user.company_name,
        experience: user.experience,
        profile_photo: user.profile_photo,
        is_verified: user.is_verified,
        skills,
        wallet_balance: parseFloat(wallet_balance),
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, mobile, role, location, upi_id, company_name, experience, profile_photo, is_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get skills
    const skillsResult = await db.query('SELECT skill FROM worker_skills WHERE user_id = $1', [user.id]);
    user.skills = skillsResult.rows.map(r => r.skill);

    // Get wallet
    const walletResult = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [user.id]);
    user.wallet_balance = parseFloat(walletResult.rows[0]?.balance || 0);

    // Get badges
    const badgesResult = await db.query('SELECT badge_type, earned_at FROM badges WHERE user_id = $1', [user.id]);
    user.badges = badgesResult.rows;

    // Get stats
    if (user.role === 'worker') {
      const completedJobs = await db.query(
        "SELECT COUNT(*) FROM job_applications WHERE worker_id = $1 AND status = 'accepted'",
        [user.id]
      );
      const avgRating = await db.query(
        'SELECT AVG(rating)::NUMERIC(3,2) as avg_rating, COUNT(*) as count FROM reviews WHERE reviewee_id = $1',
        [user.id]
      );
      user.completed_jobs = parseInt(completedJobs.rows[0].count);
      user.avg_rating = parseFloat(avgRating.rows[0].avg_rating) || 0;
      user.review_count = parseInt(avgRating.rows[0].count);
    }

    res.json(user);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, mobile, location, upi_id, experience, skills } = req.body;
    await db.query(
      'UPDATE users SET name=$1, mobile=$2, location=$3, upi_id=$4, experience=$5, updated_at=NOW() WHERE id=$6',
      [name, mobile, location, upi_id, experience, req.user.id]
    );

    // Update skills
    if (skills) {
      await db.query('DELETE FROM worker_skills WHERE user_id = $1', [req.user.id]);
      for (const skill of skills) {
        await db.query('INSERT INTO worker_skills (user_id, skill) VALUES ($1, $2)', [req.user.id, skill]);
      }
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
