-- ============================================================================
-- Items Search API Database Schema - Optimized for Performance
-- PostgreSQL Production Schema with Full-Text Search
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Set timezone and encoding
SET timezone = 'UTC';
SET client_encoding = 'UTF8';

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- Item status enum
DO $$ BEGIN
    CREATE TYPE item_status AS ENUM ('Available', 'Swapped', 'Pending', 'Inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Item condition enum
DO $$ BEGIN
    CREATE TYPE item_condition AS ENUM ('New', 'Like New', 'Good', 'Fair', 'Poor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS Users (
    userId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    role user_role DEFAULT 'user',
    isActive BOOLEAN DEFAULT true,
    emailVerified BOOLEAN DEFAULT false,
    lastLoginAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_username CHECK (length(username) >= 3 AND username ~ '^[a-zA-Z0-9_]+$')
);

-- Categories table for better data organization
CREATE TABLE IF NOT EXISTS Categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parentId INTEGER REFERENCES Categories(id),
    isActive BOOLEAN DEFAULT true,
    sortOrder INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

-- Item types table
CREATE TABLE IF NOT EXISTS ItemTypes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    categoryId INTEGER REFERENCES Categories(id) ON DELETE SET NULL,
    description TEXT,
    isActive BOOLEAN DEFAULT true,
    sortOrder INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(slug, categoryId),
    CONSTRAINT valid_type_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT valid_type_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

-- Main Items table (optimized structure)
CREATE TABLE IF NOT EXISTS Items (
    itemId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaderId UUID NOT NULL REFERENCES Users(userId) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    categoryId INTEGER REFERENCES Categories(id) ON DELETE SET NULL,
    typeId INTEGER REFERENCES ItemTypes(id) ON DELETE SET NULL,
    
    -- Legacy fields for backward compatibility
    category TEXT,
    type TEXT,
    
    size TEXT,
    condition item_condition,
    tags TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    status item_status DEFAULT 'Available',
    
    -- Enhanced fields
    location JSONB DEFAULT '{}',
    priceRange JSONB DEFAULT '{}',
    specifications JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- SEO and search
    slug VARCHAR(255) UNIQUE,
    searchVector tsvector,
    
    -- Timestamps
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    publishedAt TIMESTAMP,
    expiresAt TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_title CHECK (length(title) >= 3 AND length(title) <= 200),
    CONSTRAINT valid_description CHECK (description IS NULL OR length(description) <= 2000),
    CONSTRAINT valid_size CHECK (size IS NULL OR length(size) <= 50),
    CONSTRAINT valid_tags CHECK (
        tags IS NULL OR 
        (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 20)
    ),
    CONSTRAINT valid_images CHECK (
        images IS NULL OR 
        (array_length(images, 1) IS NULL OR array_length(images, 1) <= 10)
    ),
    CONSTRAINT valid_location CHECK (jsonb_typeof(location) = 'object'),
    CONSTRAINT valid_price_range CHECK (jsonb_typeof(priceRange) = 'object'),
    CONSTRAINT valid_specifications CHECK (jsonb_typeof(specifications) = 'object'),
    CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object'),
    CONSTRAINT valid_slug CHECK (slug IS NULL OR slug ~ '^[a-z0-9-]+$')
);

-- ============================================================================
-- ANALYTICS AND TRACKING TABLES
-- ============================================================================

-- Search analytics table
CREATE TABLE IF NOT EXISTS SearchAnalytics (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    resultsCount INTEGER DEFAULT 0,
    executionTime INTEGER,
    userId UUID REFERENCES Users(userId) ON DELETE SET NULL,
    sessionId VARCHAR(255),
    userIp INET,
    userAgent TEXT,
    referer TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_filters CHECK (jsonb_typeof(filters) = 'object'),
    CONSTRAINT valid_results_count CHECK (resultsCount >= 0),
    CONSTRAINT valid_execution_time CHECK (executionTime IS NULL OR executionTime >= 0)
);

-- User interactions table
CREATE TABLE IF NOT EXISTS UserInteractions (
    id SERIAL PRIMARY KEY,
    userId UUID REFERENCES Users(userId) ON DELETE SET NULL,
    itemId UUID REFERENCES Items(itemId) ON DELETE CASCADE,
    interactionType VARCHAR(50) NOT NULL,
    sessionId VARCHAR(255),
    userAgent TEXT,
    ipAddress INET,
    metadata JSONB DEFAULT '{}',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_interaction_type CHECK (
        interactionType IN ('view', 'like', 'share', 'contact', 'report', 'click', 'impression')
    ),
    CONSTRAINT valid_interaction_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

-- Search suggestions tracking
CREATE TABLE IF NOT EXISTS SuggestionInteractions (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    action VARCHAR(50) NOT NULL,
    position INTEGER,
    userId UUID REFERENCES Users(userId) ON DELETE SET NULL,
    sessionId VARCHAR(255),
    userAgent TEXT,
    ipAddress INET,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_suggestion_action CHECK (action IN ('click', 'select', 'dismiss', 'view')),
    CONSTRAINT valid_position CHECK (position IS NULL OR position >= 0)
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON Users(isActive);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON Users(createdAt);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_name ON Categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON Categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON Categories(parentId) WHERE parentId IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON Categories(isActive);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON Categories(sortOrder);

-- Item types indexes
CREATE INDEX IF NOT EXISTS idx_item_types_name ON ItemTypes(name);
CREATE INDEX IF NOT EXISTS idx_item_types_slug ON ItemTypes(slug);
CREATE INDEX IF NOT EXISTS idx_item_types_category_id ON ItemTypes(categoryId);
CREATE INDEX IF NOT EXISTS idx_item_types_is_active ON ItemTypes(isActive);

-- Items primary indexes
CREATE INDEX IF NOT EXISTS idx_items_search_vector ON Items USING GIN(searchVector);
CREATE INDEX IF NOT EXISTS idx_items_title_trgm ON Items USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_items_description_trgm ON Items USING GIN(description gin_trgm_ops);

-- Items filtering indexes
CREATE INDEX IF NOT EXISTS idx_items_uploader_id ON Items(uploaderId);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON Items(categoryId);
CREATE INDEX IF NOT EXISTS idx_items_type_id ON Items(typeId);
CREATE INDEX IF NOT EXISTS idx_items_status ON Items(status);
CREATE INDEX IF NOT EXISTS idx_items_condition ON Items(condition) WHERE condition IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_created_at ON Items(createdAt);
CREATE INDEX IF NOT EXISTS idx_items_updated_at ON Items(updatedAt);
CREATE INDEX IF NOT EXISTS idx_items_published_at ON Items(publishedAt) WHERE publishedAt IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_expires_at ON Items(expiresAt) WHERE expiresAt IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_slug ON Items(slug) WHERE slug IS NOT NULL;

-- Items array indexes
CREATE INDEX IF NOT EXISTS idx_items_tags ON Items USING GIN(tags) WHERE tags IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_images ON Items USING GIN(images) WHERE images IS NOT NULL;

-- Items JSONB indexes
CREATE INDEX IF NOT EXISTS idx_items_location ON Items USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_items_price_range ON Items USING GIN(priceRange);
CREATE INDEX IF NOT EXISTS idx_items_specifications ON Items USING GIN(specifications);
CREATE INDEX IF NOT EXISTS idx_items_metadata ON Items USING GIN(metadata);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_items_status_created_at ON Items(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_items_uploader_status ON Items(uploaderId, status);
CREATE INDEX IF NOT EXISTS idx_items_category_status ON Items(categoryId, status) WHERE categoryId IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_type_status ON Items(typeId, status) WHERE typeId IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_category_type_status ON Items(categoryId, typeId, status) 
    WHERE categoryId IS NOT NULL AND typeId IS NOT NULL;

-- Legacy compatibility indexes
CREATE INDEX IF NOT EXISTS idx_items_legacy_category ON Items(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_legacy_type ON Items(type) WHERE type IS NOT NULL;

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON SearchAnalytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON SearchAnalytics(createdAt);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON SearchAnalytics(userId) WHERE userId IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_search_analytics_session_id ON SearchAnalytics(sessionId) WHERE sessionId IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_search_analytics_filters ON SearchAnalytics USING GIN(filters);

-- User interactions indexes
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON UserInteractions(userId) WHERE userId IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_interactions_item_id ON UserInteractions(itemId);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON UserInteractions(interactionType);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON UserInteractions(createdAt);
CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON UserInteractions(sessionId) WHERE sessionId IS NOT NULL;

-- Suggestion interactions indexes
CREATE INDEX IF NOT EXISTS idx_suggestion_interactions_query ON SuggestionInteractions(query);
CREATE INDEX IF NOT EXISTS idx_suggestion_interactions_created_at ON SuggestionInteractions(createdAt);
CREATE INDEX IF NOT EXISTS idx_suggestion_interactions_user_id ON SuggestionInteractions(userId) WHERE userId IS NOT NULL;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_items_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    -- Build search vector with weights
    NEW.searchVector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.type, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.condition::text, '')), 'D') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
    
    -- Auto-generate slug if not provided
    IF NEW.slug IS NULL AND NEW.title IS NOT NULL THEN
        NEW.slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM Items WHERE slug = NEW.slug AND itemId != NEW.itemId) LOOP
            NEW.slug := NEW.slug || '-' || floor(random() * 1000)::text;
        END LOOP;
    END IF;
    
    -- Update timestamp
    NEW.updatedAt := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate category slug
CREATE OR REPLACE FUNCTION update_category_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL AND NEW.name IS NOT NULL THEN
        NEW.slug := lower(regexp_replace(regexp_replace(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
    END IF;
    NEW.updatedAt := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate item type slug
CREATE OR REPLACE FUNCTION update_item_type_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL AND NEW.name IS NOT NULL THEN
        NEW.slug := lower(regexp_replace(regexp_replace(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
    END IF;
    NEW.updatedAt := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Items triggers
DROP TRIGGER IF EXISTS trigger_update_items_search_vector ON Items;
CREATE TRIGGER trigger_update_items_search_vector
    BEFORE INSERT OR UPDATE ON Items
    FOR EACH ROW EXECUTE FUNCTION update_items_search_vector();

-- Users trigger
DROP TRIGGER IF EXISTS trigger_users_updated_at ON Users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON Users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Categories triggers
DROP TRIGGER IF EXISTS trigger_categories_slug ON Categories;
CREATE TRIGGER trigger_categories_slug
    BEFORE INSERT OR UPDATE ON Categories
    FOR EACH ROW EXECUTE FUNCTION update_category_slug();

-- Item types triggers
DROP TRIGGER IF EXISTS trigger_item_types_slug ON ItemTypes;
CREATE TRIGGER trigger_item_types_slug
    BEFORE INSERT OR UPDATE ON ItemTypes
    FOR EACH ROW EXECUTE FUNCTION update_item_type_slug();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Available items view with enhanced data
CREATE OR REPLACE VIEW AvailableItems AS
SELECT 
    i.itemId,
    i.uploaderId,
    i.title,
    i.description,
    i.categoryId,
    i.typeId,
    i.category,
    i.type,
    i.size,
    i.condition,
    i.tags,
    i.images,
    i.status,
    i.location,
    i.priceRange,
    i.specifications,
    i.metadata,
    i.slug,
    i.createdAt,
    i.updatedAt,
    i.publishedAt,
    c.name as categoryName,
    c.slug as categorySlug,
    it.name as typeName,
    it.slug as typeSlug,
    u.username as uploaderUsername,
    u.firstName as uploaderFirstName,
    u.lastName as uploaderLastName
FROM Items i
LEFT JOIN Categories c ON i.categoryId = c.id AND c.isActive = true
LEFT JOIN ItemTypes it ON i.typeId = it.id AND it.isActive = true
LEFT JOIN Users u ON i.uploaderId = u.userId AND u.isActive = true
WHERE i.status = 'Available'
AND (i.expiresAt IS NULL OR i.expiresAt > CURRENT_TIMESTAMP);

-- Search analytics summary view
CREATE OR REPLACE VIEW SearchAnalyticsSummary AS
SELECT 
    DATE_TRUNC('day', createdAt) as date,
    COUNT(*) as totalSearches,
    COUNT(DISTINCT query) as uniqueQueries,
    COUNT(DISTINCT userId) as uniqueUsers,
    AVG(resultsCount) as avgResults,
    AVG(executionTime) as avgExecutionTime,
    COUNT(*) FILTER (WHERE resultsCount = 0) as zeroResultSearches,
    COUNT(*) FILTER (WHERE resultsCount > 0) as successfulSearches
FROM SearchAnalytics
GROUP BY DATE_TRUNC('day', createdAt)
ORDER BY date DESC;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Get trending searches
CREATE OR REPLACE FUNCTION get_trending_searches(
    time_period INTERVAL DEFAULT INTERVAL '24 hours',
    result_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    query TEXT,
    searchCount BIGINT,
    avgResults NUMERIC,
    lastSearched TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.query,
        COUNT(*) as searchCount,
        AVG(sa.resultsCount) as avgResults,
        MAX(sa.createdAt) as lastSearched
    FROM SearchAnalytics sa
    WHERE sa.createdAt >= NOW() - time_period
    AND sa.resultsCount > 0
    AND LENGTH(sa.query) > 2
    GROUP BY sa.query
    HAVING COUNT(*) > 1
    ORDER BY searchCount DESC, avgResults DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Get category statistics
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE(
    categoryId INTEGER,
    categoryName TEXT,
    totalItems BIGINT,
    availableItems BIGINT,
    avgAgeDays NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as categoryId,
        c.name as categoryName,
        COUNT(i.itemId) as totalItems,
        COUNT(i.itemId) FILTER (WHERE i.status = 'Available') as availableItems,
        AVG(EXTRACT(EPOCH FROM (NOW() - i.createdAt)) / 86400) as avgAgeDays
    FROM Categories c
    LEFT JOIN Items i ON c.id = i.categoryId
    WHERE c.isActive = true
    GROUP BY c.id, c.name
    ORDER BY availableItems DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Update table statistics
ANALYZE Users;
ANALYZE Categories;
ANALYZE ItemTypes;
ANALYZE Items;
ANALYZE SearchAnalytics;
ANALYZE UserInteractions;
ANALYZE SuggestionInteractions;

-- Set autovacuum settings for high-traffic tables
ALTER TABLE Items SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE SearchAnalytics SET (
    autovacuum_vacuum_scale_factor = 0.2,
    autovacuum_analyze_scale_factor = 0.1
);

ALTER TABLE UserInteractions SET (
    autovacuum_vacuum_scale_factor = 0.2,
    autovacuum_analyze_scale_factor = 0.1
);

-- ============================================================================
-- SECURITY
-- ============================================================================

-- Row Level Security (optional - uncomment if needed)
-- ALTER TABLE Items ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY items_owner_policy ON Items FOR ALL TO api_user USING (uploaderId = current_setting('app.current_user_id')::UUID);

COMMIT;
