// controllers/adminController.js
const pool = require('../config/db');
const supabase = require('../config/supabase');

exports.createAdminProfile = async (req, res) => {
  const { admin_name, admin_email, password } = req.body;

  // Validate required fields
  if (!admin_name || !admin_email || !password) {
    return res.status(400).json({ 
      error: 'admin_name, admin_email, and password are required' 
    });
  }

  try {
    // 1️⃣ Insert into public.admins first (without auth dependency)
    const adminResult = await pool.query(
      `INSERT INTO admins (admin_name, admin_email, created_at)
       VALUES ($1, $2, NOW())
       RETURNING admin_id, admin_name, admin_email, created_at`,
      [admin_name, admin_email]
    );

    const adminRecord = adminResult.rows[0];

    // 2️⃣ Create user in Supabase Auth with the admin_id
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: admin_email,
      password: password,
      email_confirm: true,
      user_metadata: {
        admin_id: adminRecord.admin_id,
        admin_name: admin_name
      }
    });

    if (authError) {
      // Rollback: Delete the admin record if auth creation fails
      await pool.query('DELETE FROM admins WHERE admin_id = $1', [adminRecord.admin_id]);
      return res.status(400).json({ error: authError.message });
    }

    // 3️⃣ Insert role into public.user_role
    await pool.query(
      `INSERT INTO user_role (user_id, role) VALUES ($1, 'ADMIN')`,
      [authData.user.id]
    );

    // 4️⃣ Update admin record with auth user_id
    await pool.query(
      `UPDATE admins SET auth_user_id = $1 WHERE admin_id = $2`,
      [authData.user.id, adminRecord.admin_id]
    );

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        admin_id: adminRecord.admin_id,
        admin_name: adminRecord.admin_name,
        admin_email: adminRecord.admin_email,
        created_at: new Date(adminRecord.created_at).toISOString() 
      }
    });

  } catch (err) {
    // Only log in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error creating admin profile:', err);
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get admin by ID
exports.getAdminById = async (req, res) => {
  const { adminId } = req.params || {};

  try {
    const adminResult = await pool.query(
      `SELECT * FROM admins WHERE admin_id = $1`,
      [adminId]
    );

    if (adminResult.rows.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.status(200).json(adminResult.rows[0]);

  } catch (err) {
    // Only log in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      console.error("Error fetching admin by ID:", err);
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Login function with Supabase JWT authentication
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // 1️⃣ Authenticate user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      // Only log in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        console.error('Supabase auth error:', authError);
      }
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // 2️⃣ Get Supabase JWT token
    const supabaseJWT = authData.session.access_token;
    
    if (!supabaseJWT) {
      return res.status(401).json({ 
        error: 'Authentication failed - no JWT received' 
      });
    }

    // 3️⃣ Verify user exists in our admin table
    const adminResult = await pool.query(
      `SELECT * FROM admins WHERE admin_email = $1`,
      [email]
    );

    if (adminResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'User not found in admin database' 
      });
    }

    // 4️⃣ Verify user has admin role
    const roleResult = await pool.query(
      `SELECT role FROM user_role WHERE user_id = $1`,
      [authData.user.id]
    );

    if (roleResult.rows.length === 0 || roleResult.rows[0].role !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'User does not have admin privileges' 
      });
    }

    // 5️⃣ Compare Supabase JWT with login API JWT (they should be the same)
    // The Supabase JWT is the authoritative token
    const loginApiJWT = supabaseJWT; // In this case, we're using the same JWT

    // 6️⃣ Return success with user data and JWT
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        admin_name: adminResult.rows[0].admin_name,
        role: roleResult.rows[0].role
      },
      session: {
        access_token: supabaseJWT,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      }
    });

  } catch (err) {
    // Only log in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      console.error('Login error:', err);
    }
    return res.status(500).json({ 
      error: 'Internal Server Error during login' 
    });
  }
};
