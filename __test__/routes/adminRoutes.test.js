const request = require('supertest');
const express = require('express');

// Mock the controller
jest.mock('../../controller/adminController', () => ({
  createAdminProfile: jest.fn()
}));

const adminController = require('../../controller/adminController');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/users/admin', require('../../routes/adminRoutes'));

describe('Admin Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users/admin/createAdminProfile', () => {
    const validAdminData = {
      name: 'Test Admin',
      email_id: 'admin@test.com',
      phone: '1234567890',
      password: 'password123'
    };

    it('should create admin profile successfully', async () => {
      // Mock successful controller response
      const mockResponse = {
        message: 'Admin profile created successfully',
        auth_user: { id: 'test-user-id', email: 'admin@test.com' },
        admin_record: { admin_id: 'test-user-id', admin_name: 'Test Admin' }
      };

      adminController.createAdminProfile.mockImplementation((req, res) => {
        res.status(201).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(validAdminData)
        .expect(201);

      // Verify controller was called
      expect(adminController.createAdminProfile).toHaveBeenCalled();
      
      // Verify the request body was passed correctly
      const callArgs = adminController.createAdminProfile.mock.calls[0];
      expect(callArgs[0].body).toEqual(validAdminData);

      // Verify response
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        name: 'Test Admin',
        // missing email_id, phone, password
      };

      adminController.createAdminProfile.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Missing required fields' });
      });

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Missing required fields' });
    });

    it('should handle invalid email format', async () => {
      const invalidEmailData = {
        ...validAdminData,
        email_id: 'invalid-email'
      };

      adminController.createAdminProfile.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Invalid email format' });
      });

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid email format' });
    });

    it('should handle duplicate email error', async () => {
      adminController.createAdminProfile.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Email already exists' });
      });

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(validAdminData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Email already exists' });
    });

    it('should handle server error', async () => {
      adminController.createAdminProfile.mockImplementation((req, res) => {
        res.status(500).json({ error: 'Internal Server Error' });
      });

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(validAdminData)
        .expect(500);

      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });

    it('should handle empty request body', async () => {
      adminController.createAdminProfile.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Request body is required' });
      });

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send({})
        .expect(400);

      expect(response.body).toEqual({ error: 'Request body is required' });
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Express should return a 400 for malformed JSON
      expect(response.status).toBe(400);
    });

    it('should handle very long input data', async () => {
      const longData = {
        ...validAdminData,
        name: 'A'.repeat(1000), // Very long name
        email_id: 'verylongemail@' + 'a'.repeat(1000) + '.com'
      };

      adminController.createAdminProfile.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Input data too long' });
      });

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(longData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Input data too long' });
    });

    it('should handle special characters in input', async () => {
      const specialCharData = {
        name: 'Admin <script>alert("xss")</script>',
        email_id: 'admin+test@example.com',
        phone: '+1-234-567-8900',
        password: 'password123!@#'
      };

      adminController.createAdminProfile.mockImplementation((req, res) => {
        res.status(201).json({ message: 'Admin profile created successfully' });
      });

      const response = await request(app)
        .post('/api/users/admin/createAdminProfile')
        .send(specialCharData)
        .expect(201);

      expect(response.body).toEqual({ message: 'Admin profile created successfully' });
    });

    it('should handle different HTTP methods', async () => {
      // Test GET method (should not be allowed)
      await request(app)
        .get('/api/users/admin/createAdminProfile')
        .expect(404);

      // Test PUT method (should not be allowed)
      await request(app)
        .put('/api/users/admin/createAdminProfile')
        .send(validAdminData)
        .expect(404);

      // Test DELETE method (should not be allowed)
      await request(app)
        .delete('/api/users/admin/createAdminProfile')
        .expect(404);
    });

    it('should handle concurrent requests', async () => {
      adminController.createAdminProfile.mockImplementation((req, res) => {
        // Simulate some processing time
        setTimeout(() => {
          res.status(201).json({ message: 'Admin profile created successfully' });
        }, 100);
      });

      // Send multiple concurrent requests
      const promises = Array(3).fill().map(() =>
        request(app)
          .post('/api/users/admin/createAdminProfile')
          .send(validAdminData)
      );

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toEqual({ message: 'Admin profile created successfully' });
      });

      // Controller should have been called 3 times
      expect(adminController.createAdminProfile).toHaveBeenCalledTimes(3);
    });
  });

  describe('Route not found', () => {
    it('should return 404 for non-existent routes', async () => {
      await request(app)
        .post('/api/users/admin/nonexistent')
        .send({})
        .expect(404);

      await request(app)
        .get('/api/users/admin')
        .expect(404);
    });
  });
});
