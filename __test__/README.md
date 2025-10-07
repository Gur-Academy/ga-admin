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
- Mocks controller functions to focus on router wiring (paths, methods, status pass-through)
- Validates request/response flow and payload forwarding
- Edge-case input validation is covered at the controller layer

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
- Covered methods: `auth.admin.createUser`, `auth.signInWithPassword`
- Tests both successful and failed authentication
- Validates error message handling

## Endpoint Contracts (key)

### Admin Login `POST /api/users/admin/login`
- **Required body fields**: `email`, `password`, `user_session_id`, `user_agent`
- **Constraints**:
  - `user_session_id` must be a UUID (v1–v5 accepted)
  - If `user_session_id` already exists in `user_session` table → `409 { error: "USER_EXISTS" }`
  - Invalid credentials → `401 { error: "Invalid credentials" }`
  - Missing fields → `400 { error: 'Email, password, user_session_id, and user_agent are required' }`
- **On success (200)**: persists `user_session` with `{ user_session_id, user_id, user_agent }`

Example request:
```json
{
  "email": "admin@example.com",
  "password": "StrongP@ssw0rd!",
  "user_session_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_agent": "Mozilla/5.0 (X11; Linux x86_64)"
}
```

### Admin Create Profile `POST /api/users/admin/createAdminProfile`
- **Required body fields**: `admin_name`, `admin_email`, `admin_password`
- Creates Supabase user (email confirmed), assigns `ADMIN` role in `user_role`, and inserts into `admins`

### Request/Response Mocks
- Express request and response objects are mocked
- Tests different input scenarios (valid, invalid, missing data)
- Validates response status codes and JSON structure

## Test Scenarios Covered

### Success Scenarios
- ✅ Valid admin profile creation
- ✅ Valid admin login (with session persistence)
- ✅ Database queries returning expected data
- ✅ Proper response formatting

### Error Scenarios
- ✅ Missing required fields (controller layer)
- ✅ Duplicate email addresses (create profile)
- ✅ Database connection errors
- ✅ Supabase authentication errors
- ✅ Invalid credentials (login)
- ✅ Duplicate `user_session_id` → 409 (login)

### Edge Cases
- ✅ Empty request bodies
- ✅ Null/undefined values
- ✅ Special characters in input
- ✅ Concurrent requests
- ✅ Non-existent routes (router-level)

## Notes on Layered Responsibilities
- **Routes tests**: ensure correct path/method bindings and that requests reach controllers with the expected payloads.
- **Controller tests**: enforce validation, UUID checks, DB interactions (`user_role`, `admins`, `user_session`), and error semantics (400/401/409/500).

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
