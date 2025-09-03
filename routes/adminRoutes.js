// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { createAdminProfile, getAdminById, login } = require('../controller/adminController');
const { verifyJWT, requireAdmin } = require('../middleware/authMiddleware');

// POST /api/users/admin/login - Admin login with Supabase JWT
router.post('/login', login);

// GET /api/users/admin/login - Should return 401 (protected route)
router.get('/login', verifyJWT, requireAdmin, (req, res) => {
  res.status(200).json({ message: 'Login endpoint - use POST method' });
});

// POST /api/users/admin/createAdminProfile - No auth required for initial admin setup
router.post('/createAdminProfile', createAdminProfile);

// Test endpoint to verify no auth issues
router.post('/test', (req, res) => {
  res.json({ message: 'Test endpoint working', body: req.body });
});

// GET /api/users/admin/:adminId
// router.get('/:adminId', verifyJWT, requireAdmin, getAdminById);
router.get('/:adminId', getAdminById);


module.exports = router;
