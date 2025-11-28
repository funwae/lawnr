# Testing Guide

This document provides instructions for setting up and running tests for the Lawnr platform.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Flutter SDK installed (for mobile tests)
- Test database created

## Backend Testing

### Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure test environment:**
   - Copy `.env.example` to `.env.test`
   - Update test database credentials:
     ```
     TEST_DB_HOST=localhost
     TEST_DB_PORT=5432
     TEST_DB_NAME=lawnr_test
     TEST_DB_USER=postgres
     TEST_DB_PASSWORD=postgres
     ```

3. **Create test database:**
   ```bash
   # Using the setup script
   chmod +x scripts/setup-test-db.sh
   ./scripts/setup-test-db.sh

   # Or manually:
   createdb lawnr_test
   npm run migrate:test
   npm run seed:test
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run with coverage
npm test -- --coverage
```

### Test Structure

```
backend/
├── __tests__/
│   ├── setup.js              # Test configuration
│   ├── unit/                 # Unit tests
│   │   └── auth.test.js
│   └── integration/           # Integration tests
│       └── api.test.js
```

### Writing Tests

#### Unit Tests
Test individual functions and modules in isolation:

```javascript
import { describe, it, expect } from '@jest/globals';
import User from '../../app/models/User.js';

describe('User Model', () => {
  it('should create a user', async () => {
    // Test implementation
  });
});
```

#### Integration Tests
Test API endpoints and database interactions:

```javascript
import request from 'supertest';
import app from '../../server.js';

describe('POST /api/auth/login', () => {
  it('should authenticate user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

## Mobile Testing

### Setup

1. **Install Flutter dependencies:**
   ```bash
   cd mobile
   flutter pub get
   ```

2. **Run Flutter doctor:**
   ```bash
   flutter doctor
   ```

### Running Tests

```bash
# Run unit tests
flutter test

# Run widget tests
flutter test test/widget_test.dart

# Run integration tests
flutter test integration_test/integration_test.dart

# Run all tests with coverage
flutter test --coverage
```

### Test Structure

```
mobile/
├── test/
│   ├── widget_test.dart      # Widget tests
│   └── integration_test.dart  # Integration tests
└── integration_test/          # E2E tests
```

## Test Data

### Seed Data

The test database is automatically seeded with:
- **Test Users:**
  - Homeowner: `homeowner@test.com` / `password123`
  - Contractor: `contractor@test.com` / `password123`
  - Admin: `admin@test.com` / `password123`
- **Test Data:**
  - 1 property
  - 1 service request
  - 1 quote

### Custom Test Data

You can create custom test data by modifying `backend/scripts/seed-database.js` or creating additional seed scripts.

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test
        env:
          TEST_DB_HOST: localhost
          TEST_DB_NAME: lawnr_test
          TEST_DB_USER: postgres
          TEST_DB_PASSWORD: postgres
```

## Best Practices

1. **Isolation:** Each test should be independent and not rely on other tests
2. **Cleanup:** Clean up test data after each test
3. **Mocking:** Use mocks for external services (Stripe, AWS, etc.)
4. **Coverage:** Aim for >80% code coverage
5. **Speed:** Keep tests fast - unit tests should run in milliseconds
6. **Naming:** Use descriptive test names that explain what is being tested

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env.test`
- Verify database exists: `psql -l | grep lawnr_test`

### Test Failures
- Clear test database: `dropdb lawnr_test && createdb lawnr_test`
- Re-run migrations: `npm run migrate:test`
- Re-seed data: `npm run seed:test`

### Flutter Test Issues
- Run `flutter clean` and `flutter pub get`
- Ensure emulator/device is connected
- Check Flutter doctor for issues

## Coverage Reports

### Backend
Coverage reports are generated in `backend/coverage/`:
- HTML report: `coverage/lcov-report/index.html`
- LCOV report: `coverage/lcov.info`

### Mobile
Coverage reports are generated in `mobile/coverage/`:
- LCOV report: `coverage/lcov.info`

View coverage reports:
```bash
# Backend
open backend/coverage/lcov-report/index.html

# Mobile (requires lcov installed)
genhtml mobile/coverage/lcov.info -o mobile/coverage/html
```

