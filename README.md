
# Gur Academy Admin API

## Table of Contents
- [Database Connections](#database-connections)
  - [PostgreSQL](#postgresql)
  - [Supabase](#supabase)
  - [Testing Connections](#testing-connections)
- [API Documentation](#api-documentation)
  - [Admin](#admin)
    - [Create Admin Profile (`POST /api/users/admin/createAdminProfile`)](#create-admin-profile)
    - [Login (`POST /api/users/admin/login`)](#login)
    - [Get Admin By ID (`GET /api/users/admin/:adminId`)](#get-admin-by-id)

## Database Connections

### PostgreSQL
- Connection configured via environment variables in `.env`
- Required environment variables:
  - `PGHOST` - Database host
  - `PGPORT` - Database port
  - `PGDATABASE` - Database name
  - `PGUSER` - Database user
  - `PGPASSWORD` - Database password
  - `POOLMODE` - Connection pool mode (optional)

### Supabase
- Authentication and data access via Supabase client
- Required environment variables:
  - `SUPABASE_URL` - Your Supabase project URL
  - `SUPABASE_KEY` - Service role or anon key (service role for admin ops)

### Testing Connections

To verify database connections:

```bash
# Install dependencies
npm install

# Run connection tests
node test-connection.js
```

The script tests both PostgreSQL and Supabase connections and prints a summary.

## API Documentation

### Admin

#### Create Admin Profile
Create an admin user in Supabase and persist the admin profile.

- **Endpoint:** `POST /api/users/admin/createAdminProfile`
- **Notes:**
  - Uses Supabase Admin API to create a user with `email_confirm: true`.
  - Persists role in `user_role` with `role = 'ADMIN'`.
  - Inserts admin record into `admins` with `admin_id = <supabase user id>`.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| admin_name | String | Yes | Admin's display name |
| admin_email | String | Yes | Admin's email address |
| admin_password | String | Yes | Password for the admin user |
| admin_profile_picture_key | String | No | Optional storage key for profile picture |

Example JSON:
```json
{
  "admin_name": "Admin User",
  "admin_email": "admin@example.com",
  "admin_password": "StrongP@ssw0rd!",
  "admin_profile_picture_key": null
}
```

**Success Response (201):**
```json
{
  "message": "Admin created successfully",
  "admin": {
    "admin_id": "<uuid>",
    "admin_name": "<name>",
    "admin_email": "<email>",
    "admin_profile_picture_key": null,
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- 400 Bad Request (missing fields)
```json
{ "error": "admin_name, admin_email, and admin_password are required" }
```
- 400 Bad Request (duplicate email)
```json
{ "error": "Email already exists" }
```
- 500 Internal Server Error
```json
{ "error": "Internal Server Error" }
```

#### Login
Authenticate an admin and persist a user session.

- **Endpoint:** `POST /api/users/admin/login`
- **Notes:**
  - Requires a client-provided `user_session_id` (UUID) and `user_agent`.
  - If `user_session_id` already exists in `user_session`, returns `409 USER_EXISTS`.
  - On success, inserts `{ user_session_id, user_id, user_agent }` into `user_session`.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "StrongP@ssw0rd!",
  "user_session_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_agent": "Mozilla/5.0 (X11; Linux x86_64)"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": { "id": "<uuid>", "email": "admin@example.com" },
  "session": { "access_token": "<jwt>", "refresh_token": "<token>", "expires_at": 1700000000 }
}
```

**Error Responses:**
- 400 Bad Request (missing fields)
```json
{ "error": "Email, password, user_session_id, and user_agent are required" }
```
- 400 Bad Request (invalid UUID)
```json
{ "error": "Invalid user_session_id format (expected UUID)" }
```
- 401 Unauthorized
```json
{ "error": "Invalid credentials" }
```
- 409 Conflict
```json
{ "error": "USER_EXISTS" }
```
- 500 Internal Server Error
```json
{ "error": "Internal Server Error" }
```

### Admins

#### Get Admin By ID
Fetch a single admin profile by `adminId`.

- **Endpoint:** `GET /api/users/admin/:adminId`
- **Path Parameters:**
  - `adminId` (required): UUID of the admin

**Success Response (200):**
```json
{
  "admin_id": "<uuid>",
  "admin_name": "<name>",
  "admin_email": "<email>",
  "admin_profile_picture_key": null,
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- 404 Not Found
```json
{ "error": "Admin not found" }
```
- 500 Internal Server Error
```json
{ "error": "Internal Server Error" }
```
 
