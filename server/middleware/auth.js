const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const employerAuth = (req, res, next) => {
  if (req.user.role !== 'employer' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Employer access required' });
  }
  next();
};

const workerAuth = (req, res, next) => {
  if (req.user.role !== 'worker' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Worker access required' });
  }
  next();
};

module.exports = { auth, adminAuth, employerAuth, workerAuth };
