const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  try {
    console.log('Seeding database...');
    
    // Clear existing
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    
    // Create schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const pass = await bcrypt.hash('demo123', salt);

    // Insert Users
    const workerRes = await pool.query(`
      INSERT INTO users (name, email, mobile, password, role, location, upi_id, experience, is_verified, profile_photo)
      VALUES ('Rajesh Kumar', 'worker@demo.com', '9876543210', $1, 'worker', 'Mumbai', 'rajesh@upi', '5 Years', true, '')
      RETURNING id
    `, [pass]);
    const workerId = workerRes.rows[0].id;

    const employerRes = await pool.query(`
      INSERT INTO users (name, email, mobile, password, role, location, company_name)
      VALUES ('Priya Sharma', 'employer@demo.com', '9876543211', $1, 'employer', 'Mumbai', 'Sharma Constructions')
      RETURNING id
    `, [pass]);
    const employerId = employerRes.rows[0].id;

    const adminRes = await pool.query(`
      INSERT INTO users (name, email, mobile, password, role)
      VALUES ('Jeevika Admin', 'admin@demo.com', '9876543212', $1, 'admin')
      RETURNING id
    `, [pass]);

    // Insert Wallets
    await pool.query('INSERT INTO wallets (user_id, balance) VALUES ($1, 0)', [workerId]);
    await pool.query('INSERT INTO wallets (user_id, balance) VALUES ($1, 25000)', [employerId]);

    // Insert Worker Skills
    await pool.query("INSERT INTO worker_skills (user_id, skill) VALUES ($1, 'Electrician')", [workerId]);
    await pool.query("INSERT INTO worker_skills (user_id, skill) VALUES ($1, 'Plumber')", [workerId]);

    // Insert Job
    const jobRes = await pool.query(`
      INSERT INTO jobs (employer_id, title, description, payment, location, workers_needed, duration, status)
      VALUES ($1, 'Need Electrician for New Office Setup', 'Looking for an experienced electrician to install wiring, lights, and sockets in a new office space.', 3000, 'Andheri, Mumbai', 1, '2 Days', 'open')
      RETURNING id
    `, [employerId]);
    const jobId = jobRes.rows[0].id;
    await pool.query("INSERT INTO job_skills (job_id, skill) VALUES ($1, 'Electrician')", [jobId]);

    // Apply to job
    await pool.query(`INSERT INTO job_applications (job_id, worker_id, status) VALUES ($1, $2, 'pending')`, [jobId, workerId]);

    // Add Badges and Reviews for Worker
    await pool.query(`INSERT INTO badges (user_id, badge_type) VALUES ($1, 'Verified Worker')`, [workerId]);
    await pool.query(`INSERT INTO badges (user_id, badge_type) VALUES ($1, 'Top Rated')`, [workerId]);
    await pool.query(`INSERT INTO reviews (reviewer_id, reviewee_id, rating, comment) VALUES ($1, $2, 5, 'Great work!')`, [employerId, workerId]);

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
