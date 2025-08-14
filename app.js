require('dotenv').config();
const express = require('express');
const pool = require('./config/db');
const supabase = require('./config/supabase');
const app = express();
const adminRoutes = require('./routes/adminRoutes');
// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to Gur Academy Admin API');
});
app.use('/api/users/admins', adminRoutes);

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

// Admin Signup API
app.post('/admin/signup', async (req, res) => {
  const { name, email_id, phone, password } = req.body;

  try {
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email_id,
      password: password,
      email_confirm: true,
      phone: phone
    });

    if (authError) {
      console.error(authError);
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // Step 2: Insert into admin table
    const insertQuery = `
      INSERT INTO admin (admin_name, admin_email, user_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [name, email_id, userId]);

    res.status(201).json({
      message: 'Admin created successfully',
      auth_user: authData.user,
      admin_record: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Export app for testing
module.exports = app;
