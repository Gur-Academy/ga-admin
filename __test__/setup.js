// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  
  // Suppress console.log during tests (optional)
  // console.log = jest.fn();
  
  // Suppress console.error during tests (optional)
  // console.error = jest.fn();
});

afterAll(() => {
  // Cleanup after all tests
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  // Helper to create mock request object
  createMockRequest: (body = {}, params = {}, query = {}) => ({
    body,
    params,
    query,
    headers: {
      'content-type': 'application/json'
    }
  }),

  // Helper to create mock response object
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },

  // Helper to create valid admin data
  createValidAdminData: () => ({
    name: 'Test Admin',
    email_id: 'admin@test.com',
    phone: '1234567890',
    password: 'password123'
  }),

  // Helper to create valid signup data
  createValidSignupData: () => ({
    email: 'user@test.com',
    password: 'password123'
  }),

  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
beforeEach(() => {
  // Uncomment the lines below if you want to suppress console output during tests
  // console.log = jest.fn();
  // console.error = jest.fn();
  // console.warn = jest.fn();
});

afterEach(() => {
  // Restore original console methods
  // console.log = originalConsole.log;
  // console.error = originalConsole.error;
  // console.warn = originalConsole.warn;
});
