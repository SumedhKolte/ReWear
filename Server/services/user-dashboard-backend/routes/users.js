const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get user profile
router.get('/profile', auth, userController.getProfile);

// Update user profile
router.put('/profile', auth, upload.single('avatar'), userController.updateProfile);

module.exports = router;
