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

// Error handling middleware for malformed JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next(err);
});

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to Gur Academy Admin API');
});
app.use('/api/users/admin', adminRoutes);

// Direct DB query (test route)
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM auth.users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Example Supabase Auth usage
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
