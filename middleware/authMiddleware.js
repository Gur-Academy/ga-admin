// middleware/authMiddleware.js
const supabase = require('../config/supabase');

// Middleware to verify Supabase JWT token
const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access token required' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      });
    }

    // Add user info to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(500).json({ 
      error: 'Token verification failed' 
    });
  }
};

// Middleware to check if user has admin role
const requireAdmin = async (req, res, next) => {
  try {
    const pool = require('../config/db');
    
    // Check if user has admin role in database
    const roleResult = await pool.query(
      `SELECT role FROM user_role WHERE user_id = $1`,
      [req.user.id]
    );

    if (roleResult.rows.length === 0 || roleResult.rows[0].role !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Admin privileges required' 
      });
    }

    next();
  } catch (err) {
    console.error('Admin role check error:', err);
    return res.status(500).json({ 
      error: 'Role verification failed' 
    });
  }
};

module.exports = {
  verifyJWT,
  requireAdmin
};
