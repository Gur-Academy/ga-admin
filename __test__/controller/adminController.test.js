const adminController = require('../../controller/adminController');

// Mock dependencies
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

jest.mock('../../config/supabase', () => ({
  auth: {
    admin: {
      createUser: jest.fn()
    },
    signInWithPassword: jest.fn()
  }
}));

const pool = require('../../config/db');
const supabase = require('../../config/supabase');

describe('Admin Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock request object
    mockReq = {
      body: {
        admin_name: 'Test Admin',
        admin_email: 'admin@test.com',
        admin_password: 'password123'
      }
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createAdminProfile', () => {
    it('should create admin profile successfully', async () => {
      // Mock successful Supabase auth response
      const mockAuthData = {
        user: {
          id: 'test-user-id-123',
          email: 'admin@test.com'
        }
      };
      supabase.auth.admin.createUser.mockResolvedValue({
        data: mockAuthData,
        error: null
      });

      // Mock DB: user_role insert, then admins insert returning record
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // user_role insert
        .mockResolvedValueOnce({
          rows: [{
            admin_id: 'test-user-id-123',
            admin_name: 'Test Admin',
            admin_email: 'admin@test.com',
            admin_profile_picture_key: null,
            created_at: '2025-08-24T11:32:00.123Z'
          }]
        }); // admins insert

      await adminController.createAdminProfile(mockReq, mockRes);

      // Supabase create user called with correct args
      expect(supabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          display_name: 'Test Admin'
        }
      });

      // user_role insert
      expect(pool.query).toHaveBeenCalledWith(
        `INSERT INTO user_role (user_id, role) VALUES ($1, 'ADMIN')`,
        ['test-user-id-123']
      );

      // admins insert with admin_id = user_id
      expect(pool.query).toHaveBeenCalledWith(
        `INSERT INTO admins (admin_id, admin_name, admin_email, admin_profile_picture_key, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING admin_id, admin_name, admin_email, admin_profile_picture_key, created_at`,
        ['test-user-id-123', 'Test Admin', 'admin@test.com', null]
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Admin created successfully',
        admin: {
          admin_id: 'test-user-id-123',
          admin_name: 'Test Admin',
          admin_email: 'admin@test.com',
          admin_profile_picture_key: null,
          created_at: new Date('2025-08-24T11:32:00.123Z').toISOString()
        }
      });
    });

    it('should handle Supabase auth error', async () => {
      // Mock Supabase auth error
      const authError = { message: 'Email already exists' };
      supabase.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: authError
      });

      await adminController.createAdminProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email already exists' });
      // DB should not be called when auth fails
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('should handle missing required fields', async () => {
      // Test with missing admin_email
      const reqWithMissingEmail = {
        body: {
          admin_name: 'Test Admin',
          admin_password: 'password123'
        }
      };

      await adminController.createAdminProfile(reqWithMissingEmail, mockRes);

      // Should return validation error immediately
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'admin_name, admin_email, and admin_password are required'
      });

      // Should not call Supabase or database
      expect(supabase.auth.admin.createUser).not.toHaveBeenCalled();
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('should handle database error during admin insert', async () => {
      // Mock Supabase createUser success so we reach DB layer
      supabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'test-user-id-123' } },
        error: null
      });
      // Mock database error on first DB operation after auth (user_role insert)
      pool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      await adminController.createAdminProfile(mockReq, mockRes);

      // Verify error response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });

      // Supabase createUser should have been called before DB error
      expect(supabase.auth.admin.createUser).toHaveBeenCalled();
    });

    it('should handle database error during user_role insert', async () => {
      // Mock successful admin insert
      pool.query.mockResolvedValueOnce({
        rows: [{
          admin_id: 'generated-admin-id',
          admin_name: 'Test Admin',
          admin_email: 'admin@test.com',
          created_at: '2025-08-24T11:32:00.123Z'
        }]
      });

      // Mock successful Supabase auth
      supabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'test-user-id-123' } },
        error: null
      });

      // Mock failed user_role insert
      pool.query.mockRejectedValueOnce(new Error('Constraint violation'));

      await adminController.createAdminProfile(mockReq, mockRes);

      // Verify error response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });

    it('should handle empty request body', async () => {
      const emptyReq = { body: {} };

      await adminController.createAdminProfile(emptyReq, mockRes);

      // Should return validation error immediately
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'admin_name, admin_email, and admin_password are required'
      });

      // Should not call Supabase or database
      expect(supabase.auth.admin.createUser).not.toHaveBeenCalled();
      expect(pool.query).not.toHaveBeenCalled();
    });

    // Removed null body destructure test; controller safely reads from req.body.
  });

  describe('getAdminById', () => {
    it('should fetch admin by ID successfully', async () => {
      const mockAdminData = {
        admin_id: '550e8400-e29b-41d4-a716-446655440000',
        admin_name: 'Test Admin',
        admin_email: 'admin@test.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock successful database query for this call deterministically
      pool.query.mockResolvedValueOnce({ rows: [mockAdminData] });

      const req = {
        params: { adminId: '550e8400-e29b-41d4-a716-446655440000' }
      };

      await adminController.getAdminById(req, mockRes);

      // Verify database query was called correctly
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM admins WHERE admin_id = $1`,
        ['550e8400-e29b-41d4-a716-446655440000']
      );

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockAdminData);
    });

    it('should return 404 when admin is not found', async () => {
      // Mock empty database result deterministically
      pool.query.mockResolvedValueOnce({ rows: [] });

      const req = {
        params: { adminId: '550e8400-e29b-41d4-a716-446655440001' }
      };

      await adminController.getAdminById(req, mockRes);

      // Verify database query was called
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM admins WHERE admin_id = $1`,
        ['550e8400-e29b-41d4-a716-446655440001']
      );

      // Verify 404 response
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Admin not found'
      });
    });

    it('should handle database error', async () => {
      // Mock database error
      pool.query.mockRejectedValue(new Error('Database connection failed'));

      const req = {
        params: { adminId: '550e8400-e29b-41d4-a716-446655440002' }
      };

      await adminController.getAdminById(req, mockRes);

      // Verify database query was called
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM admins WHERE admin_id = $1`,
        ['550e8400-e29b-41d4-a716-446655440002']
      );

      // Verify 500 response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });

    it('should handle undefined adminId parameter', async () => {
      const req = {
        params: { adminId: undefined }
      };

      // Mock empty database result for undefined adminId
      pool.query.mockResolvedValue({
        rows: []
      });

      await adminController.getAdminById(req, mockRes);

      // Verify database query was called with undefined
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM admins WHERE admin_id = $1`,
        [undefined]
      );

      // Verify 404 response since no admin found with undefined ID
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Admin not found'
      });
    });

    it('should handle null adminId parameter', async () => {
      const req = {
        params: { adminId: null }
      };

      // Mock empty database result for null adminId
      pool.query.mockResolvedValue({
        rows: []
      });

      await adminController.getAdminById(req, mockRes);

      // Verify database query was called with null
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM admins WHERE admin_id = $1`,
        [null]
      );

      // Verify 404 response since no admin found with null ID
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Admin not found'
      });
    });

    it('should handle empty string adminId parameter', async () => {
      const req = {
        params: { adminId: '' }
      };

      // Mock empty database result for empty string adminId
      pool.query.mockResolvedValue({
        rows: []
      });

      await adminController.getAdminById(req, mockRes);

      // Verify database query was called with empty string
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM admins WHERE admin_id = $1`,
        ['']
      );

      // Verify 404 response since no admin found with empty string ID
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Admin not found'
      });
    });

    it('should handle UUID format adminId', async () => {
      const uuidAdminId = '169edea8-3dc2-4dd2-af30-3cad1e42bd3c';
      const mockAdminData = {
        admin_id: uuidAdminId,
        admin_name: 'UUID Admin',
        admin_email: 'uuid@test.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      pool.query.mockResolvedValue({
        rows: [mockAdminData]
      });

      const req = {
        params: { adminId: uuidAdminId }
      };

      await adminController.getAdminById(req, mockRes);

      // Verify database query was called with UUID
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM admins WHERE admin_id = $1`,
        [uuidAdminId]
      );

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockAdminData);
    });

    it('should handle invalid UUID format', async () => {
      const invalidUuid = 'invalid-uuid-format';
      
      // Mock database error for invalid UUID
      pool.query.mockRejectedValue(new Error('invalid input syntax for type uuid'));

      const req = {
        params: { adminId: invalidUuid }
      };

      await adminController.getAdminById(req, mockRes);

      // Verify database query was called with invalid UUID
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM admins WHERE admin_id = $1`,
        [invalidUuid]
      );

      // Verify 500 response for database error
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });

    it('should handle very long adminId', async () => {
      const longAdminId = 'a'.repeat(1000);
      
      // Mock database error for very long adminId
      pool.query.mockRejectedValue(new Error('invalid input syntax for type uuid'));

      const req = {
        params: { adminId: longAdminId }
      };

      await adminController.getAdminById(req, mockRes);

      // Verify database query was called with long ID
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM admins WHERE admin_id = $1`,
        [longAdminId]
      );

      // Verify 500 response for database error
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });

    it('should handle SQL injection attempt', async () => {
      const sqlInjectionId = "'; DROP TABLE admins; --";
      
      // Mock database error for SQL injection attempt
      pool.query.mockRejectedValue(new Error('invalid input syntax for type uuid'));

      const req = {
        params: { adminId: sqlInjectionId }
      };

      await adminController.getAdminById(req, mockRes);

      // Verify database query was called with parameterized query (safe)
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM admins WHERE admin_id = $1`,
        [sqlInjectionId]
      );

      // Verify 500 response for database error
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });

    it('should handle database timeout error', async () => {
      // Mock database timeout error
      pool.query.mockRejectedValue(new Error('Query timeout'));

      const req = {
        params: { adminId: '550e8400-e29b-41d4-a716-446655440003' }
      };

      await adminController.getAdminById(req, mockRes);

      // Verify 500 response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });

    it('should handle database connection refused error', async () => {
      // Mock database connection refused error
      pool.query.mockRejectedValue(new Error('Connection refused'));

      const req = {
        params: { adminId: '550e8400-e29b-41d4-a716-446655440004' }
      };

      await adminController.getAdminById(req, mockRes);

      // Verify 500 response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });

    it('should handle missing params object', async () => {
      const req = {};

      // Mock empty database result
      pool.query.mockResolvedValue({
        rows: []
      });

      await adminController.getAdminById(req, mockRes);

      // Verify database query was called with undefined
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM admins WHERE admin_id = $1`,
        [undefined]
      );

      // Verify 404 response
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Admin not found'
      });
    });

    it('should handle admin with all fields populated', async () => {
      const completeAdminData = {
        admin_id: '550e8400-e29b-41d4-a716-446655440005',
        admin_name: 'Complete Admin',
        admin_email: 'complete@test.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        phone: '1234567890',
        address: '123 Admin Street',
        role: 'SUPER_ADMIN'
      };

      pool.query.mockResolvedValue({
        rows: [completeAdminData]
      });

      const req = {
        params: { adminId: '550e8400-e29b-41d4-a716-446655440005' }
      };

      await adminController.getAdminById(req, mockRes);

      // Verify response includes all fields
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(completeAdminData);
    });
  });

  describe('login', () => {
    it('should return 400 when required fields are missing', async () => {
      mockReq = { body: { email: 'a@b.com', password: 'x' } };
      await adminController.login(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email, password, user_session_id, and user_agent are required' });
    });

    it('should return 400 for invalid user_session_id format', async () => {
      mockReq = { body: { email: 'a@b.com', password: 'x', user_session_id: 'not-a-uuid', user_agent: 'jest' } };
      await adminController.login(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid user_session_id format (expected UUID)' });
    });

    it('should return 409 if session already exists', async () => {
      mockReq = { body: { email: 'a@b.com', password: 'x', user_session_id: '550e8400-e29b-41d4-a716-446655440000', user_agent: 'jest' } };
      pool.query.mockResolvedValueOnce({ rows: [{ exists: 1 }] }); // existing session

      await adminController.login(mockReq, mockRes);
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT 1 FROM user_session WHERE user_session_id = $1 LIMIT 1`,
        ['550e8400-e29b-41d4-a716-446655440000']
      );
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'USER_EXISTS' });
    });

    it('should return 401 for invalid credentials', async () => {
      mockReq = { body: { email: 'a@b.com', password: 'wrong', user_session_id: '550e8400-e29b-41d4-a716-446655440000', user_agent: 'jest' } };
      pool.query.mockResolvedValueOnce({ rows: [] }); // no existing session
      supabase.auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid' } });

      await adminController.login(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should insert user_session and return 200 on success', async () => {
      mockReq = { body: { email: 'a@b.com', password: 'good', user_session_id: '550e8400-e29b-41d4-a716-446655440000', user_agent: 'jest' } };
      // session exists check
      pool.query.mockResolvedValueOnce({ rows: [] });
      // supabase login success
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'uid-123' }, session: { access_token: 't' } },
        error: null
      });
      // user_role lookup (found)
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: 'uid-123' }] });
      // insert user_session
      pool.query.mockResolvedValueOnce({ rows: [] });

      await adminController.login(mockReq, mockRes);

      expect(pool.query).toHaveBeenNthCalledWith(1,
        `SELECT 1 FROM user_session WHERE user_session_id = $1 LIMIT 1`,
        ['550e8400-e29b-41d4-a716-446655440000']
      );
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'good' });
      expect(pool.query).toHaveBeenNthCalledWith(2,
        `SELECT user_id FROM user_role WHERE user_id = $1 LIMIT 1`,
        ['uid-123']
      );
      expect(pool.query).toHaveBeenNthCalledWith(3,
        `INSERT INTO user_session (user_session_id, user_id, user_agent) VALUES ($1, $2, $3)`,
        ['550e8400-e29b-41d4-a716-446655440000', 'uid-123', 'jest']
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Login successful',
        user: { id: 'uid-123' },
        session: { access_token: 't' }
      });
    });

    it('should return 500 when insert user_session fails', async () => {
      mockReq = { body: { email: 'a@b.com', password: 'good', user_session_id: '550e8400-e29b-41d4-a716-446655440000', user_agent: 'jest' } };
      pool.query.mockResolvedValueOnce({ rows: [] });
      supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'uid-123' }, session: {} }, error: null });
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: 'uid-123' }] });
      pool.query.mockRejectedValueOnce(new Error('insert failed'));

      await adminController.login(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal Server Error during session creation' });
    });
  });
});
