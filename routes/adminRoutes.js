// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { createAdminProfile } = require('../controller/adminController');

// POST /api/users/admins/createAdminProfile
router.post('/createAdminProfile', createAdminProfile);

module.exports = router;
