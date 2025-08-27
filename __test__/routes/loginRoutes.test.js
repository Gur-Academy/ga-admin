// __test__/routes/loginRoutes.test.js
const request = require('supertest');
const app = require('../../app');

// Mock Supabase for login routes tests
jest.mock('../../config/supabase', () => ({
  auth: {
    signInWithPassword: jest.fn(),
    getUser: jest.fn()
  }
}));

// Mock database
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

const supabase = require('../../config/supabase');
const pool = require('../../config/db');

describe('Login Routes Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for invalid credentials
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' }
    });
    
    // Default mock for JWT verification (middleware)
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid JWT' }
    });
  });

  describe('POST /api/users/admin/login', () => {
    test('should handle POST method correctly', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword'
      };

      const response = await request(app)
        .post('/api/users/admin/login')
        .send(loginData)
        .expect(401); // Will fail due to invalid credentials, but method is correct

      expect(response.body).toHaveProperty('error');
    });

    test('should reject GET method', async () => {
      const response = await request(app)
        .get('/api/users/admin/login')
        .expect(401); // Returns 401 because route exists but requires authentication

      expect(response.body).toHaveProperty('error');
    });

    test('should reject PUT method', async () => {
      const response = await request(app)
        .put('/api/users/admin/login')
        .expect(404); // Method not allowed

      // Should return 404 since PUT is not defined for this route
    });

    test('should reject DELETE method', async () => {
      const response = await request(app)
        .delete('/api/users/admin/login')
        .expect(404); // Method not allowed

      // Should return 404 since DELETE is not defined for this route
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/users/admin/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400); // Express handles malformed JSON with 400

      expect(response.body).toHaveProperty('error', 'Invalid JSON format');
    });

    test('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/users/admin/login')
        .send('{"email":"test@example.com","password":"testpass"}');

      // Express may return 500 for malformed request without proper Content-Type
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Protected Routes', () => {
    test('should require authentication for GET /api/users/admin/:adminId', async () => {
      const response = await request(app)
        .get('/api/users/admin/123')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    test('should allow POST /api/users/admin/createAdminProfile without authentication', async () => {
      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send({
          admin_name: 'Test Admin',
          admin_email: 'admin@test.com',
          password: 'password123'
        });

      // Should not require authentication anymore - expect success or validation error, not auth error
      expect([201, 400, 500]).toContain(response.status);
      if (response.status === 401) {
        throw new Error('Endpoint should not require authentication');
      }
    });

    test('should reject invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/users/admin/123')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });

    test('should reject malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/users/admin/123')
        .set('Authorization', 'invalid-header')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });
});
