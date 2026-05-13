const express = require('express');
const router = express.Router();
const {auth, checkAdmin} = require('../middleware/auth');
const {getAllUsers, updateUserRole, deleteUser} = require('../controller/authController');

// Get all users (Admin only)
router.get('/', auth, checkAdmin, getAllUsers);

// Update user role (Admin only)
router.put('/role', auth, checkAdmin, updateUserRole);

// Delete user (Admin only)
router.delete('/:userId', auth, checkAdmin, deleteUser);

module.exports = router;
