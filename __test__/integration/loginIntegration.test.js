// __test__/integration/loginIntegration.test.js
const request = require('supertest');
const app = require('../../app');

// Mock Supabase for integration tests
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

describe('Login Integration Tests', () => {
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

  describe('Complete Login Flow', () => {
    test('should handle complete login flow with invalid credentials', async () => {
      // Step 1: Attempt login with invalid credentials
      const loginData = {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      };

      const loginResponse = await request(app)
        .post('/api/users/admin/login')
        .send(loginData)
        .expect(401);

      expect(loginResponse.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should handle login with missing required fields', async () => {
      // Test missing email
      const response1 = await request(app)
        .post('/api/users/admin/login')
        .send({ password: 'testpass' })
        .expect(400);

      expect(response1.body).toHaveProperty('error', 'Email and password are required');

      // Test missing password
      const response2 = await request(app)
        .post('/api/users/admin/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response2.body).toHaveProperty('error', 'Email and password are required');
    });

    test('should handle login with empty request body', async () => {
      const response = await request(app)
        .post('/api/users/admin/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });

    test('should handle login with null values', async () => {
      const response = await request(app)
        .post('/api/users/admin/login')
        .send({ email: null, password: null })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });

    test('should handle login with undefined values', async () => {
      const response = await request(app)
        .post('/api/users/admin/login')
        .send({ email: undefined, password: undefined })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });
  });

  describe('Authentication Middleware Integration', () => {
    test('should protect admin routes without authentication', async () => {
      // Test protected route without token
      const response = await request(app)
        .get('/api/users/admin/123')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    test('should reject invalid JWT tokens', async () => {
      // Test with invalid token
      const response = await request(app)
        .get('/api/users/admin/123')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });

    test('should reject malformed Authorization headers', async () => {
      // Test without Bearer prefix
      const response1 = await request(app)
        .get('/api/users/admin/123')
        .set('Authorization', 'some-token')
        .expect(401);

      expect(response1.body).toHaveProperty('error', 'Access token required');

      // Test with empty token
      const response2 = await request(app)
        .get('/api/users/admin/123')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response2.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/users/admin/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@example.com", "password": "testpass"')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid JSON format');
    });

    test('should handle requests with wrong Content-Type', async () => {
      const response = await request(app)
        .post('/api/users/admin/login')
        .set('Content-Type', 'text/plain')
        .send('{"email": "test@example.com", "password": "testpass"}');

      // Express may return 500 for malformed request with wrong Content-Type
      expect([400, 500]).toContain(response.status);
    });

    test('should handle requests with extra fields', async () => {
      const response = await request(app)
        .post('/api/users/admin/login')
        .send({
          email: 'test@example.com',
          password: 'testpass',
          extraField: 'should be ignored'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('Response Structure Validation', () => {
    test('should return proper error response structure', async () => {
      const response = await request(app)
        .post('/api/users/admin/login')
        .send({ email: 'test@example.com', password: 'testpass' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error.length).toBeGreaterThan(0);
    });

    test('should return proper HTTP status codes', async () => {
      // Test 400 for missing fields
      const response1 = await request(app)
        .post('/api/users/admin/login')
        .send({ password: 'testpass' })
        .expect(400);

      // Test 401 for invalid credentials
      const response2 = await request(app)
        .post('/api/users/admin/login')
        .send({ email: 'test@example.com', password: 'testpass' })
        .expect(401);

      expect(response1.status).toBe(400);
      expect(response2.status).toBe(401);
    });
  });
});
