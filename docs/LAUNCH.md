# Launch Guide

This guide will help you set up and launch the Lawnr platform for development and testing.

## Prerequisites

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **PostGIS** extension for PostgreSQL
- **Flutter** SDK 3.0+ ([Download](https://flutter.dev/docs/get-started/install))
- **Git** ([Download](https://git-scm.com/downloads))

### Optional Services
- **AWS Account** (for S3 media storage)
- **Stripe Account** (for payments)
- **Firebase Project** (for push notifications)
- **Twilio Account** (for SMS)
- **Email Service** (Gmail/SMTP)

## Quick Start

### 1. Clone and Setup

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd lawnr

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration

# Mobile setup
cd ../mobile
flutter pub get
```

### 2. Database Setup

```bash
# Create databases
createdb lawnr
createdb lawnr_test

# Install PostGIS extension
psql -d lawnr -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -d lawnr_test -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -d lawnr -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -d lawnr_test -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Run migrations
cd backend
npm run migrate
npm run seed

# Setup test database
npm run setup:test
```

### 3. Launch Backend

```bash
cd backend

# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

The API will be available at `http://localhost:3000`

### 4. Launch Mobile App

```bash
cd mobile

# Run on connected device/emulator
flutter run

# Or specify device
flutter devices
flutter run -d <device-id>
```

## Environment Configuration

### Backend (.env)

Create `backend/.env` from `backend/.env.example`:

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lawnr
DB_USER=postgres
DB_PASSWORD=your-password

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# AWS S3 (optional for development)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=lawnr-media

# Stripe (use test keys for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Firebase (optional)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Email (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### Mobile Configuration

Update `mobile/lib/services/api_service.dart`:

```dart
static const String baseUrl = 'http://localhost:3000/api';
// Or for physical device:
// static const String baseUrl = 'http://10.0.2.2:3000/api'; // Android emulator
// static const String baseUrl = 'http://<your-ip>:3000/api'; // Physical device
```

## Launch Scripts

### Development Launch

```bash
# Backend
cd backend
chmod +x scripts/launch-dev.sh
./scripts/launch-dev.sh

# Or manually:
npm run setup:dev  # Run migrations and seed
npm run dev        # Start server
```

### Testing Launch

```bash
# Backend tests
cd backend
chmod +x scripts/launch-test.sh
./scripts/launch-test.sh

# Mobile tests
cd mobile
flutter test
```

## Verification

### Check Backend

1. **Health Check:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Test Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"homeowner@test.com","password":"password123"}'
   ```

### Check Mobile

1. **Build Check:**
   ```bash
   cd mobile
   flutter doctor
   flutter analyze
   ```

2. **Run App:**
   - Connect device or start emulator
   - Run `flutter run`
   - App should launch and show login screen

## Common Issues

### Database Connection Failed
- Ensure PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Verify database exists: `psql -l | grep lawnr`

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:3000 | xargs kill`

### PostGIS Extension Error
```bash
# Install PostGIS
sudo apt-get install postgresql-postgis  # Ubuntu/Debian
brew install postgis                     # macOS

# Then create extension
psql -d lawnr -c "CREATE EXTENSION postgis;"
```

### Flutter Build Errors
```bash
cd mobile
flutter clean
flutter pub get
flutter doctor
```

### CORS Errors
- Add your frontend URL to `CORS_ORIGIN` in `.env`
- For mobile, ensure correct API URL in `api_service.dart`

## Development Workflow

### 1. Start Development Environment

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Mobile
cd mobile
flutter run
```

### 2. Make Changes

- Backend changes auto-reload (with `npm run dev`)
- Mobile changes require hot reload (`r` in terminal) or restart

### 3. Test Changes

```bash
# Backend tests
cd backend
npm test

# Mobile tests
cd mobile
flutter test
```

### 4. Database Changes

```bash
# Create new migration
cd backend/migrations
# Create 008_new_feature.sql

# Run migration
npm run migrate

# Update seed data if needed
# Edit scripts/seed-database.js
npm run seed
```

## Production Deployment

### Backend

1. **Set Production Environment:**
   ```bash
   NODE_ENV=production
   ```

2. **Build and Deploy:**
   - Deploy to cloud service (Heroku, AWS, etc.)
   - Set environment variables
   - Run migrations: `npm run migrate`

### Mobile

1. **Build Release:**
   ```bash
   flutter build apk        # Android
   flutter build ios         # iOS
   ```

2. **Distribute:**
   - Upload to Google Play / App Store
   - Or distribute APK/IPA directly

## Next Steps

1. **Configure Services:**
   - Set up AWS S3 for media storage
   - Configure Stripe for payments
   - Set up Firebase for notifications

2. **Customize:**
   - Update branding and colors
   - Configure business rules
   - Set up admin accounts

3. **Test:**
   - Run full test suite
   - Test on real devices
   - Load testing

4. **Deploy:**
   - Set up production database
   - Deploy backend API
   - Publish mobile apps

## Support

For issues or questions:
- Check documentation in `docs/`
- Review error logs
- Check GitHub issues (if applicable)

Happy coding! 🚀

