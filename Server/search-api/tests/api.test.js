const request = require('supertest');
const { expect } = require('chai');
const Application = require('../src/app');
const fixtures = require('./fixtures.json');

describe('Items Search API', () => {
  let app;
  let server;
  let authToken;

  before(async () => {
    // Initialize application
    const application = new Application();
    app = await application.initialize();
    server = await application.start(0); // Use random port for testing
    
    // Get auth token for protected endpoints
    authToken = fixtures.auth.validToken;
  });

  after(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Health Endpoints', () => {
    it('GET /health should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).to.have.property('status', 'healthy');
      expect(response.body).to.have.property('uptime');
    });

    it('GET /api/health should return detailed health info', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('status');
      expect(response.body.data).to.have.property('services');
      expect(response.body.data.services).to.have.property('database');
      expect(response.body.data.services).to.have.property('cache');
    });

    it('GET /api/health/ready should return readiness status', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body).to.have.property('ready');
      expect(response.body).to.have.property('checks');
    });

    it('GET /api/health/live should return liveness status', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body).to.have.property('alive', true);
      expect(response.body).to.have.property('uptime');
    });
  });

  describe('Search Endpoints', () => {
    it('GET /api/search should return search results', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({
          q: 'iPhone',
          limit: 10,
          page: 1
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('items');
      expect(response.body.data).to.have.property('pagination');
      expect(response.body.data.pagination).to.have.property('total');
      expect(response.body.data.pagination).to.have.property('page', 1);
      expect(response.body.data.pagination).to.have.property('limit', 10);
    });

    it('GET /api/search should validate query parameter', async () => {
      const response = await request(app)
        .get('/api/search')
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.error).to.include('Query parameter is required');
    });

    it('GET /api/search should handle filtering', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({
          q: 'laptop',
          category: 'Electronics',
          status: 'Available',
          limit: 5
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.items).to.be.an('array');
      
      // Check if filtering is applied
      response.body.data.items.forEach(item => {
        expect(item.category).to.equal('Electronics');
        expect(item.status).to.equal('Available');
      });
    });

    it('GET /api/search should handle sorting', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({
          q: 'phone',
          sort: 'newest',
          limit: 10
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.items).to.be.an('array');
      
      // Check if items are sorted by newest
      if (response.body.data.items.length > 1) {
        const dates = response.body.data.items.map(item => new Date(item.createdAt));
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i-1]).to.be.at.least(dates[i]);
        }
      }
    });

    it('POST /api/search/advanced should handle complex search', async () => {
      const response = await request(app)
        .post('/api/search/advanced')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'smartphone',
          filters: {
            category: 'Electronics',
            condition: 'Like New',
            tags: ['iPhone', 'Apple']
          },
          sort: { field: 'relevance', order: 'desc' },
          pagination: { page: 1, limit: 5 },
          options: {
            includeFacets: true,
            includeHighlight: true
          }
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('items');
      expect(response.body.data).to.have.property('pagination');
    });
  });

  describe('Suggestion Endpoints', () => {
    it('GET /api/suggestions should return suggestions', async () => {
      const response = await request(app)
        .get('/api/suggestions')
        .query({
          q: 'iph',
          limit: 5
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('suggestions');
      expect(response.body.data.suggestions).to.be.an('array');
      expect(response.body.data.suggestions.length).to.be.at.most(5);
    });

    it('GET /api/suggestions should validate query length', async () => {
      const response = await request(app)
        .get('/api/suggestions')
        .query({ q: 'a' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.suggestions).to.be.an('array').that.is.empty;
    });

    it('GET /api/suggestions/trending should return trending terms', async () => {
      const response = await request(app)
        .get('/api/suggestions/trending')
        .query({
          limit: 10,
          period: '24h'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('trending_queries');
      expect(response.body.data.trending_queries).to.be.an('array');
    });

    it('GET /api/suggestions/popular should return popular terms', async () => {
      const response = await request(app)
        .get('/api/suggestions/popular')
        .query({
          limit: 10,
          timeframe: '7d'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('popular');
      expect(response.body.data.popular).to.be.an('array');
    });
  });

  describe('Category Endpoints', () => {
    it('GET /api/categories should return categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('categories');
      expect(response.body.data.categories).to.be.an('array');
      
      if (response.body.data.categories.length > 0) {
        expect(response.body.data.categories[0]).to.have.property('category');
        expect(response.body.data.categories[0]).to.have.property('count');
      }
    });

    it('GET /api/types should return types', async () => {
      const response = await request(app)
        .get('/api/types')
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('types');
      expect(response.body.data.types).to.be.an('array');
    });

    it('GET /api/types should filter by category', async () => {
      const response = await request(app)
        .get('/api/types')
        .query({ category: 'Electronics' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('types');
      expect(response.body.data).to.have.property('category', 'Electronics');
    });
  });

  describe('Item Management Endpoints', () => {
    it('POST /api/items should create item with authentication', async () => {
      const newItem = {
        title: 'Test Item for API',
        description: 'This is a test item created via API',
        category: 'Electronics',
        type: 'Smartphone',
        condition: 'Good',
        tags: ['test', 'api', 'smartphone'],
        images: ['https://example.com/test.jpg']
      };

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newItem)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('uploaderId');
      expect(response.body.data.title).to.equal(newItem.title);
    });

    it('POST /api/items should require authentication', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          title: 'Test Item',
          description: 'Test description'
        })
        .expect(401);

      expect(response.body.success).to.be.false;
      expect(response.body.error).to.include('Authorization header is required');
    });

    it('GET /api/items/:itemId should return item details', async () => {
      const itemId = fixtures.items.validItemId;
      
      const response = await request(app)
        .get(`/api/items/${itemId}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('itemId', itemId);
    });

    it('GET /api/items/:itemId should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/items/invalid-uuid')
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.error).to.include('must be a valid UUID');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on search endpoints', async function() {
      this.timeout(10000); // Increase timeout for rate limit tests
      
      const promises = [];
      for (let i = 0; i < 55; i++) { // Exceed the 50 request limit
        promises.push(
          request(app)
            .get('/api/search')
            .query({ q: `test${i}` })
        );
      }

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).to.be.greaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent API endpoints', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).to.be.false;
      expect(response.body.error).to.include('not found');
    });

    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body.success).to.be.false;
      expect(response.body.error).to.include('not found');
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/search/advanced')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).to.be.false;
    });
  });

  describe('Security', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).to.have.property('x-content-type-options');
      expect(response.headers).to.have.property('x-frame-options');
    });

    it('should sanitize input in search queries', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({
          q: '<script>alert("xss")</script>iPhone'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      // Query should be sanitized
      expect(response.body.data.query).to.not.include('<script>');
    });
  });

  describe('Performance', () => {
    it('search requests should complete within reasonable time', async function() {
      this.timeout(5000);
      
      const start = Date.now();
      const response = await request(app)
        .get('/api/search')
        .query({
          q: 'smartphone',
          limit: 20
        })
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).to.be.below(3000); // Should complete within 3 seconds
      expect(response.body.data).to.have.property('execution_time');
    });
  });
});
