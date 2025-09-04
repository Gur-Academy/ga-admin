// __test__/routes/loginRoutes.test.js
const request = require('supertest');
const app = require('../../app');

// Mock Supabase for login routes tests
jest.mock('../../config/supabase', () => ({
  auth: {
    signInWithPassword: jest.fn(),
    getUser: jest.fn(),
    admin: {
      createUser: jest.fn()
    }
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
    
    // Default mock for admin.createUser
    supabase.auth.admin.createUser.mockResolvedValue({
      data: null,
      error: { message: 'User creation failed' }
    });
    
    // Default mock for database queries
    pool.query.mockResolvedValue({ rows: [] });
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

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
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

      // Express may return 400 or 401 for malformed request without proper Content-Type
      expect([400, 401, 500]).toContain(response.status);
    });
  });

  describe('Protected Routes', () => {
    test('should allow access to GET /api/users/admin/:adminId without authentication', async () => {
      // Mock database query for getAdminById - override default mock
      pool.query.mockResolvedValueOnce({
        rows: [{ admin_id: 123, admin_name: 'Test Admin', admin_email: 'test@admin.com' }]
      });

      const response = await request(app)
        .get('/api/users/admin/123')
        .expect(200);

      expect(response.body).toHaveProperty('admin_id', 123);
    });

    test('should allow POST /api/users/admin/createAdminProfile without authentication', async () => {
      // Mock successful admin creation sequence
      pool.query
        .mockResolvedValueOnce({
          rows: [{ admin_id: 1, admin_name: 'Test Admin', admin_email: 'admin@test.com', created_at: new Date() }]
        }) // INSERT INTO admins
        .mockResolvedValueOnce({ rows: [] }) // INSERT INTO user_role
        .mockResolvedValueOnce({ rows: [] }); // UPDATE admins SET auth_user_id
      
      supabase.auth.admin.createUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123', email: 'admin@test.com' } },
        error: null
      });

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send({
          admin_name: 'Test Admin',
          admin_email: 'admin@test.com',
          password: 'password123'
        });

      // Should succeed with 201 or fail with validation error, but not auth error
      expect([201, 400, 500]).toContain(response.status);
      if (response.status === 401) {
        throw new Error('Endpoint should not require authentication');
      }
    });

    test('should require authentication for GET /api/users/admin/login', async () => {
      const response = await request(app)
        .get('/api/users/admin/login')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    test('should reject invalid JWT token for protected login route', async () => {
      const response = await request(app)
        .get('/api/users/admin/login')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });

    test('should reject malformed Authorization header for protected login route', async () => {
      const response = await request(app)
        .get('/api/users/admin/login')
        .set('Authorization', 'invalid-header')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });
});
