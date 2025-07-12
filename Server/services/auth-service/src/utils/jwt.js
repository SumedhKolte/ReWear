const jwt = require('jsonwebtoken');

function generateToken(payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('authToken', token);
  }
  return token;
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
