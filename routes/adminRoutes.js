// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { createAdminProfile, getAdminById } = require('../controller/adminController');

// POST /api/users/admins/createAdminProfile
router.post('/createAdminProfile', createAdminProfile);

// GET /api/users/admins/:adminId
router.get('/:adminId', getAdminById);

module.exports = router;
