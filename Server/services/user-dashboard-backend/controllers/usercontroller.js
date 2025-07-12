const User = require('../models/User');

const userController = {
  async getProfile(req, res) {
    try {
      const user = await User.getUserStats(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove sensitive data
      delete user.password_hash;
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { name, email } = req.body;
      let avatarUrl = null;

      if (req.file) {
        avatarUrl = `/uploads/${req.file.filename}`;
      }

      const updatedUser = await User.update(req.user.id, {
        name,
        email,
        avatarUrl
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
};

module.exports = userController;
