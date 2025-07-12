const jwt = require('jsonwebtoken');

function generateToken(payload) {
  // Generate a random 7-digit integer as token
  const token = Math.floor(Math.random() * 9e6) + 1e6; // ensures 7 digits
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('authToken', token.toString());
    document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
  }
  return token.toString();
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
