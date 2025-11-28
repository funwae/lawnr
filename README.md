# Lawnr

A mobile-first marketplace and operations platform connecting homeowners with lawn-care and landscaping contractors.

## Overview

Lawnr enables seamless booking, quoting, scheduling, payment, and repeat maintenance services while giving contractors professional digital presence, tools to manage jobs, track costs/earnings, and scale their business.

## Project Structure

```
lawnr/
├── backend/          # Node.js/Express API server
├── mobile/           # Flutter mobile app (iOS + Android)
├── admin_dashboard/  # Admin web UI (to be implemented)
└── docs/            # Specification documents
```

## Quick Start

### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up PostgreSQL database:
```bash
# Create database
createdb lawnr

# Run migrations
psql -d lawnr -f migrations/001_initial_schema.sql
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and API keys
```

4. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Mobile App Setup

1. Install Flutter dependencies:
```bash
cd mobile
flutter pub get
```

2. Run the app:
```bash
flutter run
```

## API Endpoints

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

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL, JWT authentication
- **Mobile**: Flutter (Dart)
- **Payment**: Stripe
- **Database**: PostgreSQL with PostGIS for geolocation

## Documentation

See the [`docs/`](./docs/) directory for detailed specifications:
- **[Quick Start Guide](./QUICK_START.md)** - Get the platform running in 5 minutes
- **[Docker Setup](./DOCKER_SETUP.md)** - Easy setup using Docker
- **[Development Roadmap](./docs/ROADMAP.md)** - Complete development roadmap with phases and tasks
- **[Demo Mode](./docs/DEMO_MODE.md)** - Quick demo without database setup
- [Spec v0.1](./docs/specs/spec_v0.1.md) - Overview & Vision
- [Spec v0.2](./docs/specs/spec_v0.2.md) - Expanded Technical Specification
- [Spec v0.3](./docs/specs/spec_v0.3.md) - Engineering-Ready Blueprint

## Development Status

This project is in active development. See the [Roadmap](./docs/ROADMAP.md) for detailed development phases.

**Current Status:**
- ✅ User authentication (register/login)
- ✅ Property management
- ✅ Contractor profiles
- ✅ Service requests and quotes
- ✅ Job management workflow
- ✅ Payment processing (Stripe integration)
- ✅ Reviews and ratings
- ✅ Mobile app (Flutter) with full feature set
- ✅ Admin dashboard (Next.js/React)
- ✅ Route optimization
- ✅ Calendar views
- ✅ Support chat and FAQ system
- ✅ Data export (CSV)
- ✅ Demo mode for quick testing

See the [Roadmap](./docs/ROADMAP.md) and [Completion Summary](./docs/COMPLETION_SUMMARY.md) for details.

## License

[To be determined]
