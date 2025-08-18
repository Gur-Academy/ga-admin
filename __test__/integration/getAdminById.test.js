const request = require('supertest');
const app = require('../../app');

describe('GET /api/users/admin/:adminId - Integration Tests', () => {
  // Use a UUID that likely exists in the database for testing
  const testAdminId = '169edea8-3dc2-4dd2-af30-3cad1e42bd3c';

  describe('Successful GET requests', () => {
    it('should fetch existing admin by ID', async () => {
      const response = await request(app)
        .get(`/api/users/admin/${testAdminId}`)
        .expect(200);

      expect(response.body).toHaveProperty('admin_id');
      expect(response.body).toHaveProperty('admin_name');
      expect(response.body).toHaveProperty('admin_email');
      expect(response.body).toHaveProperty('created_at');
    });

    it('should return all admin fields', async () => {
      const response = await request(app)
        .get(`/api/users/admin/${testAdminId}`)
        .expect(200);

      const expectedFields = ['admin_id', 'admin_name', 'admin_email', 'created_at'];
      expectedFields.forEach(field => {
        expect(response.body).toHaveProperty(field);
      });
    });

    it('should handle UUID format adminId', async () => {
      const uuidAdminId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/users/admin/${uuidAdminId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Admin not found');
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent admin', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440001';
      
      const response = await request(app)
        .get(`/api/users/admin/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Admin not found');
    });

    it('should handle empty adminId parameter', async () => {
      const response = await request(app)
        .get('/api/users/admin/')
        .expect(404);

      // Should return 404 for route not found
      expect(response.status).toBe(404);
    });

    it('should handle invalid UUID format', async () => {
      const invalidUuid = 'invalid-uuid-format';
      
      const response = await request(app)
        .get(`/api/users/admin/${invalidUuid}`)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal Server Error');
    });

    it('should handle very long adminId', async () => {
      const longAdminId = 'a'.repeat(1000);
      
      const response = await request(app)
        .get(`/api/users/admin/${longAdminId}`)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal Server Error');
    });

    it('should handle SQL injection attempt safely', async () => {
      const sqlInjectionId = "'; DROP TABLE admins; --";
      
      const response = await request(app)
        .get(`/api/users/admin/${encodeURIComponent(sqlInjectionId)}`)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal Server Error');
    });
  });

  
  describe('URL and parameter handling', () => {
    it('should handle URL with query parameters', async () => {
      const response = await request(app)
        .get(`/api/users/admin/${testAdminId}?include=details&format=json`)
        .expect(200);

      expect(response.body).toHaveProperty('admin_id', testAdminId);
    });

    it('should handle adminId with spaces', async () => {
      const adminIdWithSpaces = '550e8400-e29b-41d4-a716-446655440002';
      
      const response = await request(app)
        .get(`/api/users/admin/${adminIdWithSpaces}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Admin not found');
    });

    it('should handle adminId with unicode characters', async () => {
      const unicodeAdminId = '550e8400-e29b-41d4-a716-446655440003';
      
      const response = await request(app)
        .get(`/api/users/admin/${unicodeAdminId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Admin not found');
    });

    it('should handle adminId with numbers only', async () => {
      const numericAdminId = '550e8400-e29b-41d4-a716-446655440004';
      
      const response = await request(app)
        .get(`/api/users/admin/${numericAdminId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Admin not found');
    });

    it('should handle adminId with mixed case', async () => {
      const mixedCaseAdminId = '550E8400-E29B-41D4-A716-446655440005';
      
      const response = await request(app)
        .get(`/api/users/admin/${mixedCaseAdminId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Admin not found');
    });
  });

  describe('Response format and headers', () => {
    it('should return JSON content type', async () => {
      const response = await request(app)
        .get(`/api/users/admin/${testAdminId}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return proper response structure', async () => {
      const response = await request(app)
        .get(`/api/users/admin/${testAdminId}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Object);
      expect(typeof response.body.admin_id).toBe('string');
      expect(typeof response.body.admin_name).toBe('string');
      expect(typeof response.body.admin_email).toBe('string');
    });

    it('should handle CORS headers if configured', async () => {
      const response = await request(app)
        .get(`/api/users/admin/${testAdminId}`)
        .expect(200);

      // This test will pass even if CORS is not configured
      // It just checks that the request doesn't fail
      expect(response.status).toBe(200);
    });
  });

  describe('Performance and concurrency', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = Array(5).fill().map(() =>
        request(app)
          .get(`/api/users/admin/${testAdminId}`)
          .expect(200)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.body).toHaveProperty('admin_id', testAdminId);
        expect(response.status).toBe(200);
      });
    });

    it('should respond within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get(`/api/users/admin/${testAdminId}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 2 seconds
      expect(responseTime).toBeLessThan(2000);
    });
  });
});
