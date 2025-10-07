// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { createAdminProfile, getAdminById, login } = require('../controller/adminController');

// POST /api/users/admin/login - Admin login with Supabase JWT
router.post('/login', login);

// POST /api/users/admin/createAdminProfile - No auth required for initial admin setup
router.post('/createAdminProfile', createAdminProfile);

// GET /api/users/admin/:adminId
router.get('/:adminId', getAdminById);

module.exports = router;
