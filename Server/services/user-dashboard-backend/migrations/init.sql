-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    member_since DATE DEFAULT CURRENT_DATE,
    points INTEGER DEFAULT 0,
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Listings table with enhanced pricing
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    brand VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    size VARCHAR(20) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    tags TEXT[],
    image_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'Active',
    
    -- Pricing information
    original_price DECIMAL(10,2) NOT NULL,
    purchase_date DATE NOT NULL,
    calculated_price DECIMAL(10,2),
    final_price DECIMAL(10,2) NOT NULL,
    price_factors JSONB,
    
    -- Analytics
    views INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced swaps table with payment logic
CREATE TABLE IF NOT EXISTS swaps (
    id SERIAL PRIMARY KEY,
    initiator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    initiator_listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    receiver_listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Price comparison and payment
    initiator_item_value DECIMAL(10,2) NOT NULL,
    receiver_item_value DECIMAL(10,2) NOT NULL,
    price_difference DECIMAL(10,2) NOT NULL,
    extra_payment_required DECIMAL(10,2) DEFAULT 0.00,
    payment_direction VARCHAR(20), -- 'initiator_pays' or 'receiver_pays'
    
    -- Swap details
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, completed, cancelled
    initiator_message TEXT,
    receiver_response TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Payment transactions for swaps
CREATE TABLE IF NOT EXISTS swap_payments (
    id SERIAL PRIMARY KEY,
    swap_id INTEGER REFERENCES swaps(id) ON DELETE CASCADE,
    payer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
    payment_method VARCHAR(50) DEFAULT 'wallet',
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_swaps_initiator ON swaps(initiator_id);
CREATE INDEX IF NOT EXISTS idx_swaps_receiver ON swaps(receiver_id);
CREATE INDEX IF NOT EXISTS idx_swaps_status ON swaps(status);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_swaps_updated_at BEFORE UPDATE ON swaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
