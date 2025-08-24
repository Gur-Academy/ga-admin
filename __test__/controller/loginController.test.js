// __test__/controller/loginController.test.js
const request = require('supertest');

// Mock dependencies before requiring the app
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

jest.mock('../../config/supabase', () => ({
  auth: {
    signInWithPassword: jest.fn(),
    getUser: jest.fn()
  }
}));

const app = require('../../app');
const pool = require('../../config/db');
const supabase = require('../../config/supabase');

describe('Login Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users/admin/login', () => {
    test('should fail with missing email', async () => {
      const loginData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/admin/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });

    test('should fail with missing password', async () => {
      const loginData = {
        email: 'admin@example.com'
      };

      const response = await request(app)
        .post('/api/users/admin/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });

    test('should fail with empty body', async () => {
      const response = await request(app)
        .post('/api/users/admin/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });

    test('should fail with invalid credentials', async () => {
      const loginData = {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      };

      // Mock Supabase auth failure
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', code: 'invalid_credentials' }
      });

      const response = await request(app)
        .post('/api/users/admin/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should accept valid request structure but fail with invalid credentials', async () => {
      const loginData = {
        email: 'admin@example.com',
        password: 'password123'
      };

      // Mock Supabase auth failure
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', code: 'invalid_credentials' }
      });

      const response = await request(app)
        .post('/api/users/admin/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should return proper error structure for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword'
      };

      // Mock Supabase auth failure
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', code: 'invalid_credentials' }
      });

      const response = await request(app)
        .post('/api/users/admin/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    test('should handle successful login with valid credentials', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'validpassword'
      };

      // Mock successful Supabase auth
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'test-user-id', email: 'admin@test.com' },
          session: { 
            access_token: 'mock-jwt-token',
            refresh_token: 'mock-refresh-token',
            expires_at: '2024-12-31T23:59:59Z'
          }
        },
        error: null
      });

      // Mock database queries
      pool.query
        .mockResolvedValueOnce({ 
          rows: [{ admin_id: 'test-user-id', admin_name: 'Test Admin', admin_email: 'admin@test.com' }] 
        }) // Admin lookup
        .mockResolvedValueOnce({ 
          rows: [{ role: 'ADMIN' }] 
        }); // Role lookup

      const response = await request(app)
        .post('/api/users/admin/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('session');
      expect(response.body.session).toHaveProperty('access_token', 'mock-jwt-token');
    });

    test('should fail when user not found in admin database', async () => {
      const loginData = {
        email: 'notadmin@test.com',
        password: 'validpassword'
      };

      // Mock successful Supabase auth but no admin record
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'test-user-id', email: 'notadmin@test.com' },
          session: { access_token: 'mock-jwt-token' }
        },
        error: null
      });

      // Mock empty admin lookup
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/users/admin/login')
        .send(loginData)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'User not found in admin database');
    });

    test('should fail when user does not have admin role', async () => {
      const loginData = {
        email: 'user@test.com',
        password: 'validpassword'
      };

      // Mock successful Supabase auth and admin record but no admin role
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'test-user-id', email: 'user@test.com' },
          session: { access_token: 'mock-jwt-token' }
        },
        error: null
      });

      // Mock admin lookup and role lookup
      pool.query
        .mockResolvedValueOnce({ 
          rows: [{ admin_id: 'test-user-id', admin_name: 'Test User', admin_email: 'user@test.com' }] 
        }) // Admin lookup
        .mockResolvedValueOnce({ 
          rows: [{ role: 'USER' }] 
        }); // Role lookup - not ADMIN

      const response = await request(app)
        .post('/api/users/admin/login')
        .send(loginData)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'User does not have admin privileges');
    });
  });
});
