const pool = require('../config/database');

class Swap {
  static async create(swapData) {
    const {
      initiatorId, receiverId, initiatorListingId, receiverListingId,
      initiatorItemValue, receiverItemValue, priceDifference,
      extraPaymentRequired, paymentDirection, initiatorMessage
    } = swapData;
    
    const query = `
      INSERT INTO swaps (
        initiator_id, receiver_id, initiator_listing_id, receiver_listing_id,
        initiator_item_value, receiver_item_value, price_difference,
        extra_payment_required, payment_direction, initiator_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      initiatorId, receiverId, initiatorListingId, receiverListingId,
      initiatorItemValue, receiverItemValue, priceDifference,
      extraPaymentRequired, paymentDirection, initiatorMessage
    ]);
    
    return result.rows[0];
  }

  static async findByUserId(userId, type = 'all') {
    let query = `
      SELECT s.*, 
        il.title as initiator_item_title, il.image_url as initiator_item_image,
        rl.title as receiver_item_title, rl.image_url as receiver_item_image,
        iu.name as initiator_name, iu.avatar_url as initiator_avatar,
        ru.name as receiver_name, ru.avatar_url as receiver_avatar
      FROM swaps s
      JOIN listings il ON s.initiator_listing_id = il.id
      JOIN listings rl ON s.receiver_listing_id = rl.id
      JOIN users iu ON s.initiator_id = iu.id
      JOIN users ru ON s.receiver_id = ru.id
      WHERE (s.initiator_id = $1 OR s.receiver_id = $1)
    `;
    
    const params = [userId];
    
    if (type === 'initiated') {
      query += ' AND s.initiator_id = $1';
    } else if (type === 'received') {
      query += ' AND s.receiver_id = $1';
    }
    
    query += ' ORDER BY s.created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT s.*, 
        il.title as initiator_item_title, il.image_url as initiator_item_image,
        rl.title as receiver_item_title, rl.image_url as receiver_item_image,
        iu.name as initiator_name, iu.avatar_url as initiator_avatar,
        ru.name as receiver_name, ru.avatar_url as receiver_avatar
      FROM swaps s
      JOIN listings il ON s.initiator_listing_id = il.id
      JOIN listings rl ON s.receiver_listing_id = rl.id
      JOIN users iu ON s.initiator_id = iu.id
      JOIN users ru ON s.receiver_id = ru.id
      WHERE s.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateStatus(id, status, receiverResponse = null) {
    let query = 'UPDATE swaps SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const params = [status, id];
    
    if (receiverResponse) {
      query += ', receiver_response = $3';
      params.splice(2, 0, receiverResponse);
    }
    
    if (status === 'accepted') {
      query += ', accepted_at = CURRENT_TIMESTAMP';
    } else if (status === 'completed') {
      query += ', completed_at = CURRENT_TIMESTAMP';
    }
    
    query += ' WHERE id = $' + params.length + ' RETURNING *';
    
    const result = await pool.query(query, params);
    return result.rows[0];
  }

  static async createPayment(paymentData) {
    const { swapId, payerId, receiverId, amount, paymentMethod } = paymentData;
    
    const query = `
      INSERT INTO swap_payments (swap_id, payer_id, receiver_id, amount, payment_method)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await pool.query(query, [swapId, payerId, receiverId, amount, paymentMethod]);
    return result.rows[0];
  }
}

module.exports = Swap;
