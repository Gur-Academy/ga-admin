// controllers/adminController.js
const pool = require('../config/db');
const supabase = require('../config/supabase');

exports.createAdminProfile = async (req, res) => {
  const { admin_name, admin_email, admin_password, admin_profile_picture_key } = req.body;

  // Validate required fields
  if (!admin_name || !admin_email || !admin_password) {
    return res.status(400).json({
      error: 'admin_name, admin_email, and admin_password are required'
    });
  }

  try {
    // 1️⃣ Create user via Supabase Admin API with email confirmed immediately.
    const { data: adminCreateData, error: adminCreateError } = await supabase.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: {
        display_name: admin_name
      }
    });

    if (adminCreateError) {
      return res.status(400).json({ error: adminCreateError.message });
    }

    const userId = adminCreateData?.user?.id;
    if (!userId) {
      return res.status(400).json({ error: 'Failed to retrieve user id from Supabase sign up' });
    }

    // 2️⃣ Insert role into public.user_role
    await pool.query(
      `INSERT INTO user_role (user_id, role) VALUES ($1, 'ADMIN')`,
      [userId]
    );

    // 3️⃣ Insert admin profile into public.admins with admin_id = user_id
    const adminResult = await pool.query(
      `INSERT INTO admins (admin_id, admin_name, admin_email, admin_profile_picture_key, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING admin_id, admin_name, admin_email, admin_profile_picture_key, created_at`,
      [userId, admin_name, admin_email, admin_profile_picture_key || null]
    );

    const adminRecord = adminResult.rows[0];

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        admin_id: adminRecord.admin_id,
        admin_name: adminRecord.admin_name,
        admin_email: adminRecord.admin_email,
        admin_profile_picture_key: adminRecord.admin_profile_picture_key,
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

// Login function using Supabase sign-in only
exports.login = async (req, res) => {
  const { email, password, user_session_id, user_agent } = req.body;

  try {
    if (!email || !password || !user_session_id || !user_agent) {
      return res.status(400).json({ error: 'Email, password, user_session_id, and user_agent are required' });
    }

    // Validate that user_session_id is a UUID
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (typeof user_session_id !== 'string' || !uuidRegex.test(user_session_id)) {
      return res.status(400).json({ error: 'Invalid user_session_id format (expected UUID)' });
    }

    // 1) Check if the provided user_session_id already exists
    try {
      const existingSession = await pool.query(
        `SELECT 1 FROM user_session WHERE user_session_id = $1 LIMIT 1`,
        [user_session_id]
      );
      if (existingSession.rows.length > 0) {
        return res.status(409).json({ error: 'USER_EXISTS' });
      }
    } catch (dbErr) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error checking existing user_session:', dbErr);
      }
      return res.status(500).json({ error: 'Internal Server Error during session check' });
    }

    // 2) Proceed with Supabase sign-in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Supabase sign-in error:', authError);
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3) On success, save a record in user_session
    try {
      const supaUserId = authData?.user?.id;

      // Optional: ensure there is a corresponding entry in user_role and use its user_id
      // If not present, fallback to Supabase user id
      let effectiveUserId = supaUserId;
      try {
        const roleRes = await pool.query(
          `SELECT user_id FROM user_role WHERE user_id = $1 LIMIT 1`,
          [supaUserId]
        );
        if (roleRes.rows.length > 0) {
          effectiveUserId = roleRes.rows[0].user_id;
        }
      } catch (roleErr) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn('Warning: error fetching user_role for session insert:', roleErr);
        }
        // continue with fallback
      }

      await pool.query(
        `INSERT INTO user_session (user_session_id, user_id, user_agent) VALUES ($1, $2, $3)`,
        [user_session_id, effectiveUserId, user_agent]
      );
    } catch (insertErr) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error inserting user_session:', insertErr);
      }
      return res.status(500).json({ error: 'Internal Server Error during session creation' });
    }

    return res.status(200).json({
      message: 'Login successful',
      user: authData.user,
      session: authData.session
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Login error:', err);
    }
    return res.status(500).json({ error: 'Internal Server Error during login' });
  }
};
