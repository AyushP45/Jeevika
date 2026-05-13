const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const walletRoutes = require('./routes/wallet');
const workerRoutes = require('./routes/workers');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Jeevika API is running' });
});

// Initialize database tables
const initDB = async () => {
  try {
    const fs = require('fs');
    const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    await db.query(schema);
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('⚠️  Database init error (may need to create DB manually):', err.message);
  }
};

app.listen(PORT, async () => {
  console.log(`🚀 Jeevika server running on port ${PORT}`);
  await initDB();
});

module.exports = app;
