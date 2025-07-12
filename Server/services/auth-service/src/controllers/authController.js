const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { getUserByEmail, createUser } = require('../models/user');
const { generateToken } = require('../utils/jwt');

// Signup
exports.signup = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);

    const userIdStr = uuidv4().replace(/-/g, '').slice(0, 7);
    const user = {
      userId: Number.parseInt(userIdStr, 16),
      email,
      passwordHash,
      displayName,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };

    await createUser(user);
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: 'Could not create user', details: err.message });
  }
}; // ← This closing brace was missing

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ userId: user.userId,email: user.email, isAdmin: user.isAdmin });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};
