-- ============================================================================
-- Items Search API Seed Data
-- Production-ready test data for development and testing
-- ============================================================================

BEGIN;

-- ============================================================================
-- USERS DATA
-- ============================================================================

INSERT INTO Users (userId, email, username, firstName, lastName, role, isActive, emailVerified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'johndoe', 'John', 'Doe', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', 'janesmith', 'Jane', 'Smith', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'admin@example.com', 'admin', 'Admin', 'User', 'admin', true, true),
('550e8400-e29b-41d4-a716-446655440004', 'mike.wilson@example.com', 'mikewilson', 'Mike', 'Wilson', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440005', 'sarah.jones@example.com', 'sarahjones', 'Sarah', 'Jones', 'moderator', true, true),
('550e8400-e29b-41d4-a716-446655440006', 'alex.brown@example.com', 'alexbrown', 'Alex', 'Brown', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440007', 'emma.davis@example.com', 'emmadavis', 'Emma', 'Davis', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440008', 'david.miller@example.com', 'davidmiller', 'David', 'Miller', 'user', true, true)
ON CONFLICT (userId) DO NOTHING;

-- ============================================================================
-- CATEGORIES DATA
-- ============================================================================

INSERT INTO Categories (id, name, slug, description, isActive, sortOrder) VALUES
(1, 'Electronics', 'electronics', 'Electronic devices, gadgets, and accessories', true, 1),
(2, 'Clothing & Fashion', 'clothing-fashion', 'Apparel, shoes, and fashion accessories', true, 2),
(3, 'Books & Media', 'books-media', 'Books, magazines, movies, and educational materials', true, 3),
(4, 'Sports & Outdoors', 'sports-outdoors', 'Sports equipment, outdoor gear, and fitness items', true, 4),
(5, 'Home & Garden', 'home-garden', 'Home improvement, furniture, and garden supplies', true, 5),
(6, 'Toys & Games', 'toys-games', 'Toys, board games, video games, and entertainment', true, 6),
(7, 'Automotive', 'automotive', 'Car parts, accessories, and automotive tools', true, 7),
(8, 'Music & Instruments', 'music-instruments', 'Musical instruments, audio equipment, and accessories', true, 8),
(9, 'Art & Crafts', 'art-crafts', 'Art supplies, handmade items, and craft materials', true, 9),
(10, 'Health & Beauty', 'health-beauty', 'Health products, cosmetics, and personal care items', true, 10)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ITEM TYPES DATA
-- ============================================================================

INSERT INTO ItemTypes (id, name, slug, categoryId, description, isActive, sortOrder) VALUES
-- Electronics types
(1, 'Smartphones', 'smartphones', 1, 'Mobile phones and smartphones', true, 1),
(2, 'Laptops', 'laptops', 1, 'Laptops and notebook computers', true, 2),
(3, 'Tablets', 'tablets', 1, 'Tablets and e-readers', true, 3),
(4, 'Headphones', 'headphones', 1, 'Audio headphones and earbuds', true, 4),
(5, 'Cameras', 'cameras', 1, 'Digital cameras and photography equipment', true, 5),
(6, 'Gaming Consoles', 'gaming-consoles', 1, 'Video game consoles and accessories', true, 6),
(7, 'Smart Watches', 'smart-watches', 1, 'Smartwatches and fitness trackers', true, 7),

-- Clothing types
(8, 'T-Shirts', 't-shirts', 2, 'T-shirts and casual tops', true, 1),
(9, 'Jeans', 'jeans', 2, 'Denim jeans and pants', true, 2),
(10, 'Jackets', 'jackets', 2, 'Jackets and outerwear', true, 3),
(11, 'Sneakers', 'sneakers', 2, 'Athletic and casual footwear', true, 4),
(12, 'Dresses', 'dresses', 2, 'Dresses and formal wear', true, 5),
(13, 'Accessories', 'accessories', 2, 'Fashion accessories and jewelry', true, 6),

-- Books types
(14, 'Fiction', 'fiction', 3, 'Fiction books and novels', true, 1),
(15, 'Non-Fiction', 'non-fiction', 3, 'Non-fiction and educational books', true, 2),
(16, 'Textbooks', 'textbooks', 3, 'Academic and educational textbooks', true, 3),
(17, 'Comics', 'comics', 3, 'Comics and graphic novels', true, 4),
(18, 'Magazines', 'magazines', 3, 'Magazines and periodicals', true, 5),

-- Sports types
(19, 'Basketball', 'basketball', 4, 'Basketball equipment and gear', true, 1),
(20, 'Soccer', 'soccer', 4, 'Soccer/football equipment', true, 2),
(21, 'Tennis', 'tennis', 4, 'Tennis equipment and accessories', true, 3),
(22, 'Gym Equipment', 'gym-equipment', 4, 'Fitness and gym equipment', true, 4),
(23, 'Outdoor Gear', 'outdoor-gear', 4, 'Camping and outdoor equipment', true, 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ITEMS DATA
-- ============================================================================

INSERT INTO Items (
    itemId, uploaderId, title, description, categoryId, typeId, category, type, 
    size, condition, tags, images, status, location, priceRange, specifications, 
    metadata, publishedAt, createdAt
) VALUES
-- Electronics Items
(
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'iPhone 14 Pro Max 256GB Space Black',
    'Excellent condition iPhone 14 Pro Max with 256GB storage in Space Black. Includes original box, charger, and unused Lightning cable. Screen protector applied since day one, no scratches or damage. Battery health at 98%. Perfect for photography enthusiasts with its advanced camera system.',
    1, 1, 'Electronics', 'Smartphones',
    '6.7 inch',
    'Like New',
    ARRAY['iPhone', 'Apple', 'smartphone', '5G', 'camera', 'pro-max', 'space-black'],
    ARRAY['https://example.com/iphone14-1.jpg', 'https://example.com/iphone14-2.jpg', 'https://example.com/iphone14-3.jpg'],
    'Available',
    '{"city": "New York", "state": "NY", "zipCode": "10001"}',
    '{"min": 800, "max": 900, "currency": "USD"}',
    '{"storage": "256GB", "color": "Space Black", "carrier": "Unlocked", "batteryHealth": "98%"}',
    '{"originalPrice": 1099, "purchaseDate": "2023-01-15", "warranty": "AppleCare+"}',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 days'
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    'MacBook Air M2 13-inch 512GB Silver',
    'Barely used MacBook Air with M2 chip, 8GB unified memory, and 512GB SSD storage. Perfect for students, professionals, and creative work. Includes original packaging, MagSafe charger, and documentation. No dents, scratches, or signs of wear. Ideal for programming, design, and everyday tasks.',
    1, 2, 'Electronics', 'Laptops',
    '13 inch',
    'Like New',
    ARRAY['MacBook', 'Apple', 'laptop', 'M2', 'portable', 'silver', 'student'],
    ARRAY['https://example.com/macbook-1.jpg', 'https://example.com/macbook-2.jpg'],
    'Available',
    '{"city": "San Francisco", "state": "CA", "zipCode": "94102"}',
    '{"min": 1000, "max": 1100, "currency": "USD"}',
    '{"processor": "Apple M2", "memory": "8GB", "storage": "512GB SSD", "color": "Silver"}',
    '{"originalPrice": 1199, "purchaseDate": "2023-03-20", "cycleCount": 45}',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '5 days'
),
(
    '660e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440003',
    'Sony WH-1000XM5 Noise Canceling Headphones',
    'Premium wireless noise-canceling headphones in excellent condition. Industry-leading noise cancellation technology, exceptional sound quality, and 30-hour battery life. Perfect for travel, work from home, or music enthusiasts. Includes carrying case, cables, and original packaging.',
    1, 4, 'Electronics', 'Headphones',
    'Over-ear',
    'Good',
    ARRAY['Sony', 'headphones', 'noise-canceling', 'wireless', 'bluetooth', 'premium'],
    ARRAY['https://example.com/sony-headphones-1.jpg'],
    'Available',
    '{"city": "Chicago", "state": "IL", "zipCode": "60601"}',
    '{"min": 250, "max": 300, "currency": "USD"}',
    '{"brand": "Sony", "model": "WH-1000XM5", "connectivity": "Bluetooth 5.2", "batteryLife": "30 hours"}',
    '{"originalPrice": 399, "purchaseDate": "2023-02-10", "usageHours": 200}',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '1 day'
),

-- Clothing Items
(
    '660e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440004',
    'Levi\'s 501 Original Fit Jeans Dark Wash',
    'Classic Levi\'s 501 jeans in dark indigo wash. Size 32W x 34L, worn only a few times. These are the original straight-fit jeans that started it all. Perfect condition with no fading, holes, or wear. Great for casual or smart-casual occasions.',
    2, 9, 'Clothing & Fashion', 'Jeans',
    '32x34',
    'Like New',
    ARRAY['Levis', 'jeans', 'denim', 'classic', 'mens', 'dark-wash', '501'],
    ARRAY['https://example.com/levis-jeans-1.jpg', 'https://example.com/levis-jeans-2.jpg'],
    'Available',
    '{"city": "Austin", "state": "TX", "zipCode": "73301"}',
    '{"min": 40, "max": 60, "currency": "USD"}',
    '{"brand": "Levis", "style": "501 Original", "wash": "Dark Indigo", "fit": "Straight"}',
    '{"originalPrice": 89, "purchaseDate": "2023-04-01", "timesWorn": 3}',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '3 days'
),
(
    '660e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440005',
    'Nike Air Jordan 1 Retro High Chicago',
    'Authentic Nike Air Jordan 1 in the iconic Chicago colorway (White/Black/Red). Size 10.5 US, gently worn with original box and extra laces. A must-have for sneaker collectors and basketball fans. Shows minimal wear on the sole, upper in excellent condition.',
    2, 11, 'Clothing & Fashion', 'Sneakers',
    '10.5',
    'Good',
    ARRAY['Nike', 'Jordan', 'sneakers', 'basketball', 'retro', 'chicago', 'authentic'],
    ARRAY['https://example.com/jordan1-1.jpg', 'https://example.com/jordan1-2.jpg', 'https://example.com/jordan1-3.jpg'],
    'Available',
    '{"city": "Miami", "state": "FL", "zipCode": "33101"}',
    '{"min": 150, "max": 200, "currency": "USD"}',
    '{"brand": "Nike", "model": "Air Jordan 1 Retro High", "colorway": "Chicago", "releaseYear": "2022"}',
    '{"originalPrice": 170, "purchaseDate": "2022-12-15", "timesWorn": 8}',
    NOW() - INTERVAL '18 hours',
    NOW() - INTERVAL '4 days'
),

-- Books Items
(
    '660e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440001',
    'The Great Gatsby by F. Scott Fitzgerald',
    'Classic American novel in excellent condition. This paperback edition features the iconic cover design and includes discussion questions. Perfect for literature students, book clubs, or anyone wanting to read this timeless story. No highlighting, notes, or damage.',
    3, 14, 'Books & Media', 'Fiction',
    'Paperback',
    'Good',
    ARRAY['classic', 'literature', 'american', 'novel', 'fitzgerald', 'gatsby'],
    ARRAY['https://example.com/gatsby-book.jpg'],
    'Available',
    '{"city": "Boston", "state": "MA", "zipCode": "02101"}',
    '{"min": 8, "max": 15, "currency": "USD"}',
    '{"author": "F. Scott Fitzgerald", "publisher": "Scribner", "pages": 180, "isbn": "9780743273565"}',
    '{"originalPrice": 16, "purchaseDate": "2023-01-20", "condition": "No markings"}',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '6 days'
),

-- Sports Items
(
    '660e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440002',
    'Wilson Evolution Indoor Basketball',
    'Official size basketball used in many high school and college games. Composite leather construction provides excellent grip and feel. Perfect for indoor courts and serious players. Shows normal wear from use but maintains great bounce and shape.',
    4, 19, 'Sports & Outdoors', 'Basketball',
    'Official',
    'Good',
    ARRAY['Wilson', 'basketball', 'indoor', 'official', 'sports', 'composite'],
    ARRAY['https://example.com/wilson-basketball.jpg'],
    'Available',
    '{"city": "Denver", "state": "CO", "zipCode": "80201"}',
    '{"min": 35, "max": 50, "currency": "USD"}',
    '{"brand": "Wilson", "model": "Evolution", "size": "Official (29.5\")", "material": "Composite Leather"}',
    '{"originalPrice": 65, "purchaseDate": "2022-09-15", "gamesPlayed": 25}',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '7 days'
),

-- Home & Garden Items
(
    '660e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440006',
    'KitchenAid Stand Mixer 5-Quart Artisan',
    'Professional-grade stand mixer in Empire Red color. 5-quart stainless steel bowl, 10-speed control, and includes dough hook, flat beater, and wire whip. Perfect for baking enthusiasts. Barely used, excellent condition with original packaging and manual.',
    5, NULL, 'Home & Garden', 'Kitchen Appliances',
    '5-Quart',
    'Like New',
    ARRAY['KitchenAid', 'mixer', 'baking', 'kitchen', 'appliance', 'red', 'professional'],
    ARRAY['https://example.com/kitchenaid-mixer-1.jpg', 'https://example.com/kitchenaid-mixer-2.jpg'],
    'Available',
    '{"city": "Seattle", "state": "WA", "zipCode": "98101"}',
    '{"min": 200, "max": 250, "currency": "USD"}',
    '{"brand": "KitchenAid", "model": "Artisan", "capacity": "5-Quart", "color": "Empire Red", "speeds": 10}',
    '{"originalPrice": 349, "purchaseDate": "2023-02-28", "timesUsed": 5}',
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '10 days'
),

-- Some items with different statuses for testing
(
    '660e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440003',
    'iPad Pro 11-inch M2 128GB Space Gray',
    'iPad Pro with M2 chip and 128GB storage. Includes Apple Pencil (2nd generation) and Magic Keyboard. Perfect for digital art, note-taking, and productivity. Shows minimal wear, excellent performance.',
    1, 3, 'Electronics', 'Tablets',
    '11 inch',
    'Like New',
    ARRAY['iPad', 'Apple', 'tablet', 'M2', 'pencil', 'keyboard', 'pro'],
    ARRAY['https://example.com/ipad-pro-1.jpg', 'https://example.com/ipad-pro-2.jpg'],
    'Swapped',
    '{"city": "Portland", "state": "OR", "zipCode": "97201"}',
    '{"min": 600, "max": 700, "currency": "USD"}',
    '{"processor": "Apple M2", "storage": "128GB", "accessories": ["Apple Pencil", "Magic Keyboard"]}',
    '{"originalPrice": 799, "purchaseDate": "2023-01-10", "swappedWith": "MacBook Air"}',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '10 days'
),
(
    '660e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440004',
    'Adidas Ultraboost 22 Running Shoes',
    'High-performance running shoes with Boost midsole technology. Size 9 US, worn less than 10 times. Excellent for running and casual wear. Shows minimal wear on outsole, upper in perfect condition.',
    2, 11, 'Clothing & Fashion', 'Sneakers',
    '9',
    'Like New',
    ARRAY['Adidas', 'running', 'shoes', 'ultraboost', 'comfortable', 'boost'],
    ARRAY['https://example.com/adidas-ultraboost.jpg'],
    'Pending',
    '{"city": "Phoenix", "state": "AZ", "zipCode": "85001"}',
    '{"min": 120, "max": 150, "currency": "USD"}',
    '{"brand": "Adidas", "model": "Ultraboost 22", "activity": "Running", "technology": "Boost"}',
    '{"originalPrice": 190, "purchaseDate": "2023-03-15", "milesRun": 50}',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (itemId) DO NOTHING;

-- ============================================================================
-- SEARCH ANALYTICS DATA
-- ============================================================================

INSERT INTO SearchAnalytics (
    query, filters, resultsCount, executionTime, userId, sessionId, userIp, userAgent, referer
) VALUES
('iPhone', '{"categoryId": 1}', 5, 45, '550e8400-e29b-41d4-a716-446655440001', 'sess_001', '192.168.1.100', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', 'https://example.com'),
('laptop', '{}', 3, 67, '550e8400-e29b-41d4-a716-446655440002', 'sess_002', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'https://google.com'),
('Nike shoes', '{"categoryId": 2, "typeId": 11}', 8, 52, '550e8400-e29b-41d4-a716-446655440003', 'sess_003', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'https://example.com'),
('basketball', '{"categoryId": 4}', 2, 38, '550e8400-e29b-41d4-a716-446655440004', 'sess_004', '192.168.1.103', 'Mozilla/5.0 (Android 13; Mobile)', 'https://example.com'),
('MacBook', '{"categoryId": 1}', 4, 71, '550e8400-e29b-41d4-a716-446655440005', 'sess_005', '192.168.1.104', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'https://example.com'),
('jeans', '{"categoryId": 2}', 6, 43, '550e8400-e29b-41d4-a716-446655440001', 'sess_006', '192.168.1.100', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', 'https://example.com'),
('headphones', '{}', 12, 89, '550e8400-e29b-41d4-a716-446655440002', 'sess_007', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'https://example.com'),
('iPad', '{"categoryId": 1, "typeId": 3}', 3, 55, '550e8400-e29b-41d4-a716-446655440003', 'sess_008', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'https://example.com'),
('books', '{"categoryId": 3}', 15, 34, '550e8400-e29b-41d4-a716-446655440006', 'sess_009', '192.168.1.105', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', 'https://example.com'),
('kitchen appliances', '{"categoryId": 5}', 7, 62, '550e8400-e29b-41d4-a716-446655440007', 'sess_010', '192.168.1.106', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'https://example.com');

-- ============================================================================
-- USER INTERACTIONS DATA
-- ============================================================================

INSERT INTO UserInteractions (
    userId, itemId, interactionType, sessionId, userAgent, ipAddress, metadata
) VALUES
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'view', 'sess_010', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '192.168.1.101', '{"duration": 45, "source": "search"}'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'like', 'sess_011', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '192.168.1.102', '{"source": "item_page"}'),
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'view', 'sess_012', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', '192.168.1.100', '{"duration": 120, "source": "search"}'),
('550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', 'contact', 'sess_013', 'Mozilla/5.0 (Android 13; Mobile)', '192.168.1.103', '{"method": "message", "source": "item_page"}'),
('550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440004', 'share', 'sess_014', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '192.168.1.104', '{"platform": "social", "source": "item_page"}'),
('550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440005', 'view', 'sess_015', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', '192.168.1.105', '{"duration": 75, "source": "category_browse"}'),
('550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440006', 'like', 'sess_016', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '192.168.1.106', '{"source": "search"}'),
('550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440007', 'view', 'sess_017', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '192.168.1.107', '{"duration": 30, "source": "trending"}');

-- ============================================================================
-- SUGGESTION INTERACTIONS DATA
-- ============================================================================

INSERT INTO SuggestionInteractions (
    query, suggestion, action, position, userId, sessionId, userAgent, ipAddress
) VALUES
('iph', 'iPhone 14 Pro Max', 'click', 1, '550e8400-e29b-41d4-a716-446655440001', 'sess_001', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', '192.168.1.100'),
('lap', 'MacBook Air M2', 'select', 2, '550e8400-e29b-41d4-a716-446655440002', 'sess_002', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '192.168.1.101'),
('sho', 'Nike Air Jordan 1', 'view', 1, '550e8400-e29b-41d4-a716-446655440003', 'sess_003', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '192.168.1.102'),
('bas', 'Wilson Evolution Basketball', 'click', 1, '550e8400-e29b-41d4-a716-446655440004', 'sess_004', 'Mozilla/5.0 (Android 13; Mobile)', '192.168.1.103'),
('hea', 'Sony WH-1000XM5', 'select', 3, '550e8400-e29b-41d4-a716-446655440005', 'sess_005', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '192.168.1.104'),
('jea', 'Levis 501 Original', 'click', 2, '550e8400-e29b-41d4-a716-446655440006', 'sess_006', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', '192.168.1.105');

-- Reset sequences to ensure proper auto-increment
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM Categories));
SELECT setval('itemtypes_id_seq', (SELECT MAX(id) FROM ItemTypes));

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify data insertion
SELECT 'Users' as table_name, COUNT(*) as count FROM Users
UNION ALL
SELECT 'Categories', COUNT(*) FROM Categories
UNION ALL
SELECT 'ItemTypes', COUNT(*) FROM ItemTypes
UNION ALL
SELECT 'Items', COUNT(*) FROM Items
UNION ALL
SELECT 'SearchAnalytics', COUNT(*) FROM SearchAnalytics
UNION ALL
SELECT 'UserInteractions', COUNT(*) FROM UserInteractions
UNION ALL
SELECT 'SuggestionInteractions', COUNT(*) FROM SuggestionInteractions;

-- Test search functionality
SELECT 
    itemId, 
    title, 
    category, 
    type, 
    status,
    ts_rank(searchVector, plainto_tsquery('english', 'iPhone')) as rank
FROM Items 
WHERE searchVector @@ plainto_tsquery('english', 'iPhone')
ORDER BY rank DESC;
