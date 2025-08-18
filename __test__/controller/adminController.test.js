const adminController = require('../../controller/adminController');

// Mock dependencies
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

jest.mock('../../config/supabase', () => ({
  auth: {
    admin: {
      createUser: jest.fn()
    }
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
        name: 'Test Admin',
        email_id: 'admin@test.com',
        phone: '1234567890',
        password: 'password123'
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

      // Mock successful database queries
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // user_role insert
        .mockResolvedValueOnce({ 
          rows: [{ 
            admin_id: 'test-user-id-123',
            admin_name: 'Test Admin',
            admin_email: 'admin@test.com'
          }] 
        }); // admins insert

      await adminController.createAdminProfile(mockReq, mockRes);

      // Verify Supabase auth was called correctly
      expect(supabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'password123',
        email_confirm: true
      });

      // Verify database queries were called correctly
      expect(pool.query).toHaveBeenCalledWith(
        `INSERT INTO user_role (user_id, role) VALUES ($1, 'ADMIN')`,
        ['test-user-id-123']
      );

      expect(pool.query).toHaveBeenCalledWith(
        `INSERT INTO admins (admin_id, admin_name, admin_email)
       VALUES ($1, $2, $3)
       RETURNING *`,
        ['test-user-id-123', 'Test Admin', 'admin@test.com']
      );

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Admin profile created successfully',
        auth_user: mockAuthData.user,
        admin_record: {
          admin_id: 'test-user-id-123',
          admin_name: 'Test Admin',
          admin_email: 'admin@test.com'
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

      // Verify error response
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Email already exists'
      });

      // Verify database queries were not called
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('should handle missing required fields', async () => {
      // Test with missing email
      const reqWithMissingEmail = {
        body: {
          name: 'Test Admin',
          phone: '1234567890',
          password: 'password123'
        }
      };

      await adminController.createAdminProfile(reqWithMissingEmail, mockRes);

      // Should still attempt to create user but fail at Supabase level
      expect(supabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: undefined,
        password: 'password123',
        email_confirm: true
      });
    });

    it('should handle database error during user_role insert', async () => {
      // Mock successful Supabase auth
      supabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'test-user-id-123' } },
        error: null
      });

      // Mock database error on user_role insert
      pool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      await adminController.createAdminProfile(mockReq, mockRes);

      // Verify error response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });

    it('should handle database error during admins insert', async () => {
      // Mock successful Supabase auth
      supabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'test-user-id-123' } },
        error: null
      });

      // Mock successful user_role insert but failed admins insert
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // user_role insert
        .mockRejectedValueOnce(new Error('Constraint violation')); // admins insert

      await adminController.createAdminProfile(mockReq, mockRes);

      // Verify error response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });

    it('should handle empty request body', async () => {
      const emptyReq = { body: {} };

      await adminController.createAdminProfile(emptyReq, mockRes);

      // Should attempt to create user with undefined values
      expect(supabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: undefined,
        password: undefined,
        email_confirm: true
      });
    });

    it('should handle null request body', async () => {
      const nullReq = { body: null };

      // This test should expect an error since we can't destructure null
      await expect(adminController.createAdminProfile(nullReq, mockRes))
        .rejects.toThrow('Cannot destructure property');
    });
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

      // Mock successful database query
      pool.query.mockResolvedValue({
        rows: [mockAdminData]
      });

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
      // Mock empty database result
      pool.query.mockResolvedValue({
        rows: []
      });

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
});
