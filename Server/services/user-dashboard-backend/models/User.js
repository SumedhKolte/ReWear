const pool = require('../config/database');

class User {
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async create(userData) {
    const { name, email, passwordHash, avatarUrl } = userData;
    const query = `
      INSERT INTO users (name, email, password_hash, avatar_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, avatar_url, member_since, points, wallet_balance, created_at
    `;
    const result = await pool.query(query, [name, email, passwordHash, avatarUrl]);
    return result.rows[0];
  }

  static async update(id, userData) {
    const { name, email, avatarUrl } = userData;
    const query = `
      UPDATE users 
      SET name = $1, email = $2, avatar_url = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, email, avatar_url, member_since, points, wallet_balance
    `;
    const result = await pool.query(query, [name, email, avatarUrl, id]);
    return result.rows[0];
  }

  static async updateWalletBalance(id, amount) {
    const query = 'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance';
    const result = await pool.query(query, [amount, id]);
    return result.rows[0];
  }

  static async getUserStats(id) {
    const query = `
      SELECT 
        u.*,
        COUNT(DISTINCT l.id) as total_listings,
        COUNT(DISTINCT CASE WHEN l.status = 'Active' THEN l.id END) as active_listings,
        COUNT(DISTINCT CASE WHEN s1.id IS NOT NULL OR s2.id IS NOT NULL THEN s1.id END) as total_swaps
      FROM users u
      LEFT JOIN listings l ON u.id = l.user_id
      LEFT JOIN swaps s1 ON u.id = s1.initiator_id
      LEFT JOIN swaps s2 ON u.id = s2.receiver_id
      WHERE u.id = $1
      GROUP BY u.id
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;
