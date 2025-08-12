require('dotenv').config();
const express = require('express');
const pool = require('./config/db');
const supabase = require('./config/supabase');
const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to Gur Academy Admin API');
});

// Direct DB query (fast, IPv4)
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

// Export app for testing
module.exports = app;
