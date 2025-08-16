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
});
