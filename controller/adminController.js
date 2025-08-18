// controllers/adminController.js
const pool = require('../config/db');
const supabase = require('../config/supabase');

exports.createAdminProfile = async (req, res) => {
  const { name, email_id, phone, password } = req.body;

  try {
    // 1️⃣ Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email_id,
      password: password,
      email_confirm: true,
    });

    if (authError) {
      console.error(authError);
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // 2️⃣ Insert role into public.user_role
    await pool.query(
      `INSERT INTO user_role (user_id, role) VALUES ($1, 'ADMIN')`,
      [userId]
    );

    // 3️⃣ Insert into public.admins
    const adminResult = await pool.query(
      `INSERT INTO admins (admin_id, admin_name, admin_email)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, name, email_id]
    );

    res.status(201).json({
      message: 'Admin profile created successfully',
      auth_user: authData.user,
      admin_record: adminResult.rows[0]
    });

  } catch (err) {
    console.error('Error creating admin profile:', err);
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
    console.error("Error fetching admin by ID:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
