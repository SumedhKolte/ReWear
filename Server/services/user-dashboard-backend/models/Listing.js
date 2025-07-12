const pool = require('../config/database');

class Listing {
  static async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT *, 
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - purchase_date))/2592000 as age_months
      FROM listings 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows.map(row => ({
      ...row,
      price_factors: typeof row.price_factors === 'string' 
        ? JSON.parse(row.price_factors) 
        : row.price_factors
    }));
  }

  static async findById(id) {
    const query = 'SELECT * FROM listings WHERE id = $1';
    const result = await pool.query(query, [id]);
    const listing = result.rows[0];
    if (listing && listing.price_factors) {
      listing.price_factors = typeof listing.price_factors === 'string' 
        ? JSON.parse(listing.price_factors) 
        : listing.price_factors;
    }
    return listing;
  }

  static async findAvailableForSwap(excludeUserId, category = null, limit = 20) {
    let query = `
      SELECT l.*, u.name as owner_name, u.avatar_url as owner_avatar
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.user_id != $1 AND l.status = 'Active'
    `;
    const params = [excludeUserId];
    
    if (category) {
      query += ' AND l.category = $2';
      params.push(category);
    }
    
    query += ' ORDER BY l.created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getOverview(userId) {
    const query = `
      SELECT 
        id, title, status, views, 
        TO_CHAR(created_at, 'YYYY-MM-DD') as created,
        image_url, final_price as price, category, condition
      FROM listings 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async create(listingData) {
    const {
      userId, title, description, category, subcategory, brand, type, size,
      condition, tags, imageUrl, status, originalPrice, purchaseDate,
      calculatedPrice, finalPrice, priceFactors
    } = listingData;
    
    const query = `
      INSERT INTO listings (
        user_id, title, description, category, subcategory, brand, type, size,
        condition, tags, image_url, status, original_price, purchase_date,
        calculated_price, final_price, price_factors
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      userId, title, description, category, subcategory, brand, type, size,
      condition, tags, imageUrl, status, originalPrice, purchaseDate,
      calculatedPrice, finalPrice, JSON.stringify(priceFactors)
    ]);
    
    return result.rows[0];
  }

  static async update(id, listingData) {
    const {
      title, description, category, subcategory, brand, type, size,
      condition, tags, imageUrl, status, originalPrice, purchaseDate,
      calculatedPrice, finalPrice, priceFactors
    } = listingData;
    
    const query = `
      UPDATE listings 
      SET title = $1, description = $2, category = $3, subcategory = $4, 
          brand = $5, type = $6, size = $7, condition = $8, tags = $9, 
          image_url = $10, status = $11, original_price = $12, purchase_date = $13,
          calculated_price = $14, final_price = $15, price_factors = $16,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      title, description, category, subcategory, brand, type, size,
      condition, tags, imageUrl, status, originalPrice, purchaseDate,
      calculatedPrice, finalPrice, JSON.stringify(priceFactors), id
    ]);
    
    return result.rows[0];
  }

  static async delete(id, userId) {
    const query = 'DELETE FROM listings WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  static async incrementViews(id) {
    const query = 'UPDATE listings SET views = views + 1 WHERE id = $1 RETURNING views, id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Listing;
