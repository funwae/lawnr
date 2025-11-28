# Quick Start Guide

Get the Lawnr platform running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js
node --version  # Should be 18+

# Check PostgreSQL
psql --version  # Should be 14+

# Check Flutter (for mobile)
flutter --version  # Should be 3.0+
```

## Step 1: Backend Setup (2 minutes)

```bash
cd backend

# Install dependencies
npm install

# Create .env file (if not exists)
cp .env.example .env

# Edit .env with your database credentials
# At minimum, set:
#   DB_PASSWORD=your-postgres-password
#   JWT_SECRET=any-random-string

# Create database
createdb lawnr

# Install PostGIS extension
psql -d lawnr -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -d lawnr -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Run migrations
npm run migrate

# Seed test data
npm run seed

# Health check
npm run health
```

## Step 2: Start Backend (30 seconds)

```bash
cd backend
npm run dev
```

Server will start at `http://localhost:3000`

## Step 3: Test the API (30 seconds)

In another terminal:

```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"homeowner@test.com","password":"password123"}'
```

You should get a JWT token back!

## Step 4: Mobile Setup (2 minutes)

```bash
cd mobile

# Install dependencies
flutter pub get

# Update API URL in lib/services/api_service.dart
# Change baseUrl to: 'http://localhost:3000/api'
# (or 'http://10.0.2.2:3000/api' for Android emulator)

# Run on device/emulator
flutter run
```

## Test Accounts

After seeding, you can login with:

- **Homeowner**: `homeowner@test.com` / `password123`
- **Contractor**: `contractor@test.com` / `password123`
- **Admin**: `admin@test.com` / `password123`

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d lawnr -c "SELECT 1;"
```

### Port Already in Use
```bash
# Change PORT in .env
# Or kill process on port 3000
lsof -ti:3000 | xargs kill
```

### PostGIS Not Found
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-postgis

# macOS
brew install postgis

# Then create extension
psql -d lawnr -c "CREATE EXTENSION postgis;"
```

## Next Steps

1. **Configure Services** (optional):
   - AWS S3 for media storage
   - Stripe for payments
   - Firebase for notifications

2. **Run Tests**:
   ```bash
   cd backend
   npm test
   ```

3. **Explore API**:
   - Check `docs/` for API documentation
   - Use Postman or curl to test endpoints

4. **Customize**:
   - Update branding
   - Configure business rules
   - Add more features

## Full Documentation

- **Launch Guide**: `docs/LAUNCH.md`
- **Testing Guide**: `docs/TESTING.md`
- **API Spec**: `docs/specs/spec_v0.3.md`
- **Roadmap**: `docs/ROADMAP.md`

Happy coding! 🚀

