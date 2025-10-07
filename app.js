require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const supabase = require('./config/supabase');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // ✅ Allow frontend calls

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to Gur Academy Admin API');
});
app.use('/api/admin', adminRoutes);

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Error handling middleware for malformed JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next(err);
});

module.exports = app;
