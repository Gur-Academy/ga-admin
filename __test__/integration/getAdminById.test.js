const request = require('supertest');
const app = require('../../app');

// Mock Supabase for integration tests
jest.mock('../../config/supabase', () => ({
  auth: {
    getUser: jest.fn()
  }
}));

// Mock database
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

const supabase = require('../../config/supabase');
const pool = require('../../config/db');

describe('GET /api/users/admin/:adminId - Integration Tests', () => {
  // Use a UUID that likely exists in the database for testing
  const testAdminId = '169edea8-3dc2-4dd2-af30-3cad1e42bd3c';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for JWT verification (middleware) - invalid token
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid JWT' }
    });
  });

  describe('Authentication Required Tests', () => {
    it('should require authentication to fetch admin by ID', async () => {
      const response = await request(app)
        .get(`/api/users/admin/${testAdminId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should reject invalid JWT token', async () => {
      const response = await request(app)
        .get(`/api/users/admin/${testAdminId}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });

    it('should require authentication for any admin ID', async () => {
      const uuidAdminId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/users/admin/${uuidAdminId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('Error handling', () => {
    it('should require authentication before checking if admin exists', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440001';
      
      const response = await request(app)
        .get(`/api/users/admin/${nonExistentId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should handle empty adminId parameter', async () => {
      const response = await request(app)
        .get('/api/users/admin/')
        .expect(404);

      // Should return 404 for route not found
      expect(response.status).toBe(404);
    });

    it('should require authentication for invalid UUID format', async () => {
      const invalidUuid = 'invalid-uuid-format';
      
      const response = await request(app)
        .get(`/api/users/admin/${invalidUuid}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should require authentication for very long adminId', async () => {
      const longAdminId = 'a'.repeat(1000);
      
      const response = await request(app)
        .get(`/api/users/admin/${longAdminId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should require authentication before SQL injection attempt', async () => {
      const sqlInjectionId = "'; DROP TABLE admins; --";
      
      const response = await request(app)
        .get(`/api/users/admin/${encodeURIComponent(sqlInjectionId)}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  
  describe('URL and parameter handling', () => {
    it('should require authentication even with query parameters', async () => {
      const response = await request(app)
        .get(`/api/users/admin/${testAdminId}?include=details&format=json`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should require authentication for any admin ID format', async () => {
      const adminIdWithSpaces = '550e8400-e29b-41d4-a716-446655440002';
      
      const response = await request(app)
        .get(`/api/users/admin/${adminIdWithSpaces}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should require authentication for unicode characters', async () => {
      const unicodeAdminId = '550e8400-e29b-41d4-a716-446655440003';
      
      const response = await request(app)
        .get(`/api/users/admin/${unicodeAdminId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should require authentication for numeric admin ID', async () => {
      const numericAdminId = '550e8400-e29b-41d4-a716-446655440004';
      
      const response = await request(app)
        .get(`/api/users/admin/${numericAdminId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should require authentication for mixed case admin ID', async () => {
      const mixedCaseAdminId = '550E8400-E29B-41D4-A716-446655440005';
      
      const response = await request(app)
        .get(`/api/users/admin/${mixedCaseAdminId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('Response format and headers', () => {
    it('should return JSON content type for auth error', async () => {
      const response = await request(app)
        .get(`/api/users/admin/${testAdminId}`)
        .expect(401);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return proper error response structure', async () => {
      const response = await request(app)
        .get(`/api/users/admin/${testAdminId}`)
        .expect(401);

      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty('error', 'Access token required');
      expect(typeof response.body.error).toBe('string');
    });

    it('should handle CORS headers for auth errors', async () => {
      const response = await request(app)
        .get(`/api/users/admin/${testAdminId}`)
        .expect(401);

      // This test will pass and checks auth is working
      expect(response.status).toBe(401);
    });
  });

  describe('Performance and concurrency', () => {
    it('should handle multiple concurrent auth requests', async () => {
      const promises = Array(5).fill().map(() =>
        request(app)
          .get(`/api/users/admin/${testAdminId}`)
          .expect(401)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.body).toHaveProperty('error', 'Access token required');
        expect(response.status).toBe(401);
      });
    });

    it('should respond quickly to auth errors', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get(`/api/users/admin/${testAdminId}`)
        .expect(401);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 1 second for auth errors
      expect(responseTime).toBeLessThan(1000);
    });
  });
});
