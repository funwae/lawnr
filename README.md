# Lawnr

A mobile-first marketplace and operations platform connecting homeowners with lawn-care and landscaping contractors.

## Overview

Lawnr enables seamless booking, quoting, scheduling, payment, and repeat maintenance services while giving contractors professional digital presence, tools to manage jobs, track costs/earnings, and scale their business.

## Project Structure

```
lawnr/
├── backend/          # Node.js/Express API server
├── mobile/           # Flutter mobile app (iOS + Android)
├── admin_dashboard/  # Next.js/React admin web UI
└── docs/             # Specification documents
```

## Quick Start

### Option 1: Demo Mode (Easiest - No Database Setup Required)

Get started instantly without PostgreSQL:

```bash
cd backend
npm install
npm run setup:demo
npm run demo
```

The API will be available at `http://localhost:3000`. See [Demo Mode Guide](./docs/DEMO_MODE.md) for details.

### Option 2: Docker Setup (Recommended)

Easiest way with PostgreSQL:

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run automated setup
./backend/scripts/docker-setup.sh

# Start backend
cd backend
npm run dev
```

See [Docker Setup Guide](./DOCKER_SETUP.md) for complete instructions.

### Option 3: Full Setup with PostgreSQL

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Set up PostgreSQL database:**
```bash
# Create database
createdb lawnr

# Install extensions
psql -d lawnr -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -d lawnr -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
```

3. **Configure environment variables:**
```bash
# Copy Docker config (or create your own)
cp .env.docker .env

# Edit .env with your database credentials
# At minimum, set:
#   DB_PASSWORD=your-postgres-password
#   JWT_SECRET=any-random-string-min-32-chars
```

4. **Run migrations and seed:**
```bash
npm run migrate
npm run seed
```

5. **Start the server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3000` (or port specified in `.env`)

### Admin Dashboard Setup

1. **Install dependencies:**
```bash
cd admin_dashboard
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:3000` (or next available port).

**Note:** The admin dashboard connects to the backend API. Make sure the backend is running first.
- If backend runs on port 3000, you may need to run admin dashboard on a different port (e.g., `PORT=3001 npm run dev`)
- The API URL is configured in `admin_dashboard/lib/utils/api.ts` (defaults to `http://localhost:3001/api`)
- Update the API URL in that file if your backend runs on a different port

### Mobile App Setup

1. **Install Flutter dependencies:**
```bash
cd mobile
flutter pub get
```

2. **Configure API URL** (if needed):
   - Edit `mobile/lib/services/api_service.dart`
   - Update `baseUrl` to match your backend (default: `http://localhost:3000/api`)
   - For Android emulator: use `http://10.0.2.2:3000/api`
   - For physical device: use your computer's IP address

3. **Run the app:**
```bash
flutter run
```

## Test Accounts

After seeding the database, you can login with:

- **Homeowner**: `homeowner@test.com` / `password123`
- **Contractor**: `contractor@test.com` / `password123`
- **Admin**: `admin@test.com` / `password123`

For demo mode, see [Demo Mode Guide](./docs/DEMO_MODE.md) for demo accounts.

## API Endpoints

The API is available at `http://localhost:3000/api` (or your configured port).

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Properties (Homeowner)
- `POST /api/properties` - Create property
- `GET /api/properties` - List properties
- `GET /api/properties/:id` - Get property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Contractors
- `GET /api/contractors/search` - Search contractors
- `GET /api/contractors/:id` - Get contractor profile
- `POST /api/contractors/profile` - Create contractor profile
- `PUT /api/contractors/profile/me` - Update contractor profile

### Service Requests
- `POST /api/requests` - Create service request
- `GET /api/requests` - List requests (homeowner)
- `GET /api/requests/available/list` - List available requests (contractor)
- `POST /api/requests/:id/quote` - Submit quote
- `POST /api/requests/:id/accept-quote/:quoteId` - Accept quote

### Jobs
- `GET /api/jobs` - List jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/on_way` - Mark job "on the way"
- `POST /api/jobs/:id/start` - Start job
- `POST /api/jobs/:id/complete` - Complete job

### Payments
- `GET /api/payments` - List invoices
- `GET /api/payments/:id` - Get invoice
- `POST /api/payments` - Process payment

### Reviews
- `POST /api/reviews/jobs/:jobId` - Create review
- `GET /api/reviews/contractors/:contractorId` - Get contractor reviews

### Additional Features
- **Route Optimization**: `POST /api/routes/optimize` - Optimize job routes
- **Analytics**: `GET /api/analytics/*` - Contractor analytics and exports
- **FAQs**: `GET /api/faqs` - Public FAQ endpoints
- **Support Chat**: `GET /api/messages` - Support messaging
- **Admin**: `GET /api/admin/*` - Admin dashboard endpoints

For complete API documentation, see the [API Specification](./docs/specs/spec_v0.3.md).

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL (or SQLite in demo mode), JWT authentication
- **Mobile**: Flutter (Dart) - iOS, Android, and Linux desktop
- **Admin Dashboard**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Payment**: Stripe integration
- **Database**: PostgreSQL with PostGIS for geolocation (or SQLite for demo)
- **Maps**: OpenStreetMap via flutter_map (mobile)
- **Real-time**: Firebase Realtime Database (chat/messaging)

## Documentation

### Getting Started
- **[Quick Start Guide](./QUICK_START.md)** - Get the platform running in 5 minutes
- **[Docker Setup](./DOCKER_SETUP.md)** - Easy setup using Docker (recommended)
- **[Demo Mode](./docs/DEMO_MODE.md)** - Quick demo without database setup

### Development
- **[Development Roadmap](./docs/ROADMAP.md)** - Complete development roadmap with phases and tasks
- **[Testing Guide](./docs/TESTING.md)** - How to run tests
- **[Launch Guide](./docs/LAUNCH.md)** - Detailed launch instructions

### Specifications
- [Spec v0.1](./docs/specs/spec_v0.1.md) - Overview & Vision
- [Spec v0.2](./docs/specs/spec_v0.2.md) - Expanded Technical Specification
- [Spec v0.3](./docs/specs/spec_v0.3.md) - Engineering-Ready Blueprint

## Development Status

This project is feature-complete for MVP. See the [Roadmap](./docs/ROADMAP.md) for detailed development phases.

**Completed Features:**
- ✅ User authentication (register/login, password reset)
- ✅ Property management
- ✅ Contractor profiles and verification
- ✅ Service requests and quotes
- ✅ Job management workflow
- ✅ Payment processing (Stripe integration)
- ✅ Reviews and ratings
- ✅ Mobile app (Flutter) - iOS, Android, Linux desktop
- ✅ Admin dashboard (Next.js/React) - Full management UI
- ✅ Route optimization (TSP algorithm)
- ✅ Calendar views (table_calendar)
- ✅ Support chat and FAQ system
- ✅ Data export (CSV)
- ✅ Demo mode for quick testing (SQLite, no setup required)
- ✅ OpenStreetMap integration (replaces Google Maps)
- ✅ Subscriptions and recurring services
- ✅ Premium listings and promotions

See the [Completion Summary](./docs/COMPLETION_SUMMARY.md) and [Roadmap](./docs/ROADMAP.md) for details.

## License

[To be determined]
