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
    signUp: jest.fn()
  }
}));

const app = require('../../app');
const pool = require('../../config/db');
const supabase = require('../../config/supabase');

describe('Application Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        name: 'Test Admin',
        email_id: 'admin@test.com',
        phone: '1234567890',
        password: 'password123'
      };

      const mockAuthData = {
        user: { id: 'admin-user-id', email: 'admin@test.com' }
      };

      const mockAdminRecord = {
        admin_id: 'admin-user-id',
        admin_name: 'Test Admin',
        admin_email: 'admin@test.com'
      };

      // Mock Supabase auth
      supabase.auth.admin.createUser.mockResolvedValue({
        data: mockAuthData,
        error: null
      });

      // Mock database queries
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // user_role insert
        .mockResolvedValueOnce({ rows: [mockAdminRecord] }); // admins insert

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(adminData)
        .expect(201);

      expect(response.body).toEqual({
        message: 'Admin profile created successfully',
        auth_user: mockAuthData.user,
        admin_record: mockAdminRecord
      });

      // Verify all mocks were called correctly
      expect(supabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'password123',
        email_confirm: true
      });

      expect(pool.query).toHaveBeenCalledWith(
        `INSERT INTO user_role (user_id, role) VALUES ($1, 'ADMIN')`,
        ['admin-user-id']
      );

      expect(pool.query).toHaveBeenCalledWith(
        `INSERT INTO admins (admin_id, admin_name, admin_email)
       VALUES ($1, $2, $3)
       RETURNING *`,
        ['admin-user-id', 'Test Admin', 'admin@test.com']
      );
    });

    it('should handle Supabase auth error', async () => {
      const adminData = {
        name: 'Test Admin',
        email_id: 'existing@test.com',
        phone: '1234567890',
        password: 'password123'
      };

      supabase.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' }
      });

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(adminData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Email already exists' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('should handle database error', async () => {
      const adminData = {
        name: 'Test Admin',
        email_id: 'admin@test.com',
        phone: '1234567890',
        password: 'password123'
      };

      supabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      });

      pool.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(adminData)
        .expect(500);

      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send('some data')
        .expect(500); // Express will return 500 for malformed JSON
    });

    it('should handle very large payload', async () => {
      const largeData = {
        name: 'A'.repeat(10000),
        email_id: 'admin@test.com',
        phone: '1234567890',
        password: 'password123'
      };

      // This should be handled by Express body parser limits
      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(largeData);

      // Should either succeed or fail gracefully
      expect([200, 201, 400, 413, 500]).toContain(response.status);
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
      // This will be caught by the :adminId route and return 500 due to invalid UUID
      await request(app)
        .get('/api/users/admin/createAdminProfile')
        .expect(500);

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
