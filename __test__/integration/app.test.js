const request = require('supertest');

// Mock dependencies before requiring the app
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

jest.mock('../../config/supabase', () => ({
  auth: {
    admin: {
      createUser: jest.fn()
    },
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null
    })
  }
}));

const app = require('../../app');
const pool = require('../../config/db');
const supabase = require('../../config/supabase');

describe('Application Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful JWT verification by default
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null
    });
    
    // Mock admin role check by default - need to handle multiple queries
    pool.query.mockImplementation((query, params) => {
      if (query.includes('SELECT role FROM user_role')) {
        return Promise.resolve({ rows: [{ role: 'ADMIN' }] });
      }
      return Promise.resolve({ rows: [] });
    });
  });

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toBe('Welcome to Gur Academy Admin API');
    });
  });

  describe('GET /users', () => {
    it('should return users from database', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@test.com' },
        { id: 2, email: 'user2@test.com' }
      ];

      pool.query.mockResolvedValue({ rows: mockUsers });

      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body).toEqual(mockUsers);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM auth.users');
    });

    it('should handle database error', async () => {
      pool.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/users')
        .expect(500);

      expect(response.body).toEqual({ error: 'Database error' });
    });
  });

 
  describe('POST /api/users/admin/createAdminProfile', () => {
    it('should create admin profile successfully', async () => {
      const adminData = {
        admin_name: 'Test Admin',
        admin_email: 'admin@test.com',
        password: 'password123'
      };

      const mockAdminRecord = {
        admin_id: 'generated-admin-id',
        admin_name: 'Test Admin',
        admin_email: 'admin@test.com',
        created_at: '2025-08-24T11:32:00.123Z'
      };

      const mockAuthData = {
        user: { id: 'admin-user-id', email: 'admin@test.com' }
      };

      // Mock Supabase auth
      supabase.auth.admin.createUser.mockResolvedValue({
        data: mockAuthData,
        error: null
      });

      // Mock database queries - new flow: admin insert, user_role insert, admin update (no auth middleware)
      pool.query
        .mockResolvedValueOnce({ rows: [mockAdminRecord] }) // admin insert
        .mockResolvedValueOnce({ rows: [] }) // user_role insert
        .mockResolvedValueOnce({ rows: [] }); // admin update with auth_user_id

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(adminData)
        .expect(201);

      expect(response.body).toEqual({
        message: 'Admin created successfully',
        admin: {
          admin_id: mockAdminRecord.admin_id,
          admin_name: mockAdminRecord.admin_name,
          admin_email: mockAdminRecord.admin_email,
          created_at: mockAdminRecord.created_at
        }
      });

      // Verify all mocks were called correctly
      expect(supabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          admin_id: mockAdminRecord.admin_id,
          admin_name: 'Test Admin'
        }
      });

      expect(pool.query).toHaveBeenCalledWith(
        `INSERT INTO user_role (user_id, role) VALUES ($1, 'ADMIN')`,
        ['admin-user-id']
      );

      expect(pool.query).toHaveBeenCalledWith(
        `INSERT INTO admins (admin_name, admin_email, created_at)
       VALUES ($1, $2, NOW())
       RETURNING admin_id, admin_name, admin_email, created_at`,
        ['Test Admin', 'admin@test.com']
      );
    });

    it('should handle Supabase auth error', async () => {
      const adminData = {
        admin_name: 'Test Admin',
        admin_email: 'existing@test.com',
        password: 'password123'
      };

      supabase.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' }
      });

      // Mock role check for middleware and admin insert (which will be rolled back)
      const mockAdminRecord = {
        admin_id: 'temp-admin-id',
        admin_name: 'Test Admin',
        admin_email: 'existing@test.com',
        created_at: '2025-08-24T11:32:00.123Z'
      };

      pool.query
        .mockResolvedValueOnce({ rows: [{ role: 'ADMIN' }] }) // role check for middleware
        .mockResolvedValueOnce({ rows: [mockAdminRecord] }) // admin insert
        .mockResolvedValueOnce({ rows: [] }); // delete rollback

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .set('Content-Type', 'application/json')
        .send(adminData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email already exists');
    });

    it('should handle database error', async () => {
      const adminData = {
        admin_name: 'Test Admin',
        admin_email: 'admin@test.com',
        password: 'password123'
      };

      supabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      });

      // Mock database error on admin insert (first step)
      pool.query
        .mockRejectedValue(new Error('Database connection failed')); // admin insert fails

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(adminData)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal Server Error');
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid JSON format');
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send('some data');

      // Should not require authentication - expect parsing error or validation error
      expect([400, 500]).toContain(response.status);
    });

    it('should handle very large payload', async () => {
      const largeData = {
        admin_name: 'A'.repeat(10000),
        admin_email: 'admin@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(largeData);

      // Should not require authentication - expect success or validation error
      expect([201, 400, 500]).toContain(response.status);
    });
  });

  describe('Route coverage', () => {
    it('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/nonexistent')
        .expect(404);

      await request(app)
        .post('/api/nonexistent')
        .send({})
        .expect(404);
    });

    it('should handle different HTTP methods correctly', async () => {
      // Test that POST routes don't accept GET requests
      // This will be caught by the :adminId route and return 401 Unauthorized
      await request(app)
        .get('/api/users/admin/createAdminProfile')
        .expect(401);

      await request(app)
        .get('/signup')
        .expect(404);

      // Test that GET routes don't accept POST requests
      await request(app)
        .post('/users')
        .send({})
        .expect(404);
    });
  });
});
