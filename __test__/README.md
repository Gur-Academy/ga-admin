# Test Suite Documentation

This directory contains comprehensive test cases for the Gur Academy Admin API using Jest and Supertest.

## Test Structure

```
__test__/
├── controller/
│   └── adminController.test.js    # Unit tests for admin controller
├── routes/
│   └── adminRoutes.test.js        # API route tests using Supertest
├── integration/
│   └── app.test.js               # Full application integration tests
├── setup.js                      # Global test configuration
└── README.md                     # This file
```

## Test Types

### 1. Unit Tests (`controller/adminController.test.js`)
- Tests individual controller functions in isolation
- Uses Jest mocks for database and Supabase dependencies
- Tests both success and error scenarios
- Validates function logic and return values

### 2. Route Tests (`routes/adminRoutes.test.js`)
- Tests API endpoints using Supertest
- Mocks controller functions to test route handling
- Tests HTTP methods, status codes, and response formats
- Validates request/response flow

### 3. Integration Tests (`integration/app.test.js`)
- Tests the complete application flow
- Mocks external dependencies (database, Supabase)
- Tests end-to-end API functionality
- Validates error handling and edge cases

## Running Tests

### Run all tests:
```bash
npm test
```

### Run tests with coverage:
```bash
npm run test:coverage
```

### Run specific test files:
```bash
# Run only controller tests
npm test -- controller

# Run only route tests
npm test -- routes

# Run only integration tests
npm test -- integration
```

### Run tests in watch mode:
```bash
npm test -- --watch
```

## Test Coverage

The test suite aims for 80% coverage across:
- Branches (conditional statements)
- Functions (all functions called)
- Lines (all lines executed)
- Statements (all statements executed)

Coverage reports are generated in the `coverage/` directory.

## Mock Strategy

### Database Mocks
- PostgreSQL queries are mocked using Jest
- Each test can control query responses and errors
- Tests database error handling scenarios

### Supabase Mocks
- Supabase Auth functions are mocked
- Tests both successful and failed authentication
- Validates error message handling

### Request/Response Mocks
- Express request and response objects are mocked
- Tests different input scenarios (valid, invalid, missing data)
- Validates response status codes and JSON structure

## Test Scenarios Covered

### Success Scenarios
- ✅ Valid admin profile creation
- ✅ Valid user signup
- ✅ Database queries returning expected data
- ✅ Proper response formatting

### Error Scenarios
- ✅ Missing required fields
- ✅ Invalid email formats
- ✅ Duplicate email addresses
- ✅ Database connection errors
- ✅ Supabase authentication errors
- ✅ Malformed JSON requests
- ✅ Large payload handling

### Edge Cases
- ✅ Empty request bodies
- ✅ Null/undefined values
- ✅ Special characters in input
- ✅ Concurrent requests
- ✅ Different HTTP methods
- ✅ Non-existent routes

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Mocking**: External dependencies are properly mocked
3. **Coverage**: Both success and failure paths are tested
4. **Readability**: Tests are well-documented and easy to understand
5. **Maintainability**: Common test utilities are shared

## Adding New Tests

When adding new functionality:

1. **Unit Tests**: Test individual functions in isolation
2. **Route Tests**: Test API endpoints with mocked controllers
3. **Integration Tests**: Test complete flows with mocked dependencies
4. **Update Coverage**: Ensure new code is covered by tests

## Troubleshooting

### Common Issues:
- **Mock not working**: Ensure mocks are set up before requiring modules
- **Async test failures**: Use `async/await` or return promises
- **Coverage gaps**: Add tests for missing branches/conditions

### Debug Mode:
```bash
npm test -- --verbose --detectOpenHandles
```

## Dependencies

- **Jest**: Testing framework
- **Supertest**: HTTP testing library
- **Express**: Web framework (for route testing)

All dependencies are already installed in `package.json`.
