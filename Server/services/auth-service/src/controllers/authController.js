const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { getUserByEmail, createUser } = require('../models/user');
const { generateToken } = require('../utils/jwt');

// Signup
exports.signup = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    // Validate input
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = {
      userId: uuidv4(), // Keep as UUID string
      email: email.toLowerCase().trim(),
      passwordHash, // This should match your database column name
      displayName: displayName.trim(),
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };

    const createdUser = await createUser(user);
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        userId: createdUser.userId,
        email: createdUser.email,
        displayName: createdUser.displayName
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Could not create user', details: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ 
      userId: user.userId,
      email: user.email, 
      isAdmin: user.isAdmin 
    });
    
    // Return both token and user data
    res.json({ 
      success: true,
      token,
      user: {
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};
