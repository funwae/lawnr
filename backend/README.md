# Lawnr Backend

Node.js/Express API server for the Lawnr marketplace platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up PostgreSQL database:
```bash
# Create database
createdb lawnr

# Run migrations
psql -d lawnr -f migrations/001_initial_schema.sql
```

4. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## Environment Variables

Required environment variables (see `.env.example`):
- `PORT` - Server port (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection
- `JWT_SECRET` - Secret key for JWT tokens
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` - AWS S3 configuration
- `STRIPE_SECRET_KEY` - Stripe API key for payments

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Properties
- `POST /api/properties` - Create property
- `GET /api/properties` - List user's properties
- `GET /api/properties/:id` - Get property details
- `GET /api/properties/:id/media` - Get property media
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Media
- `POST /api/media/properties/:property_id` - Upload property media
- `POST /api/media/jobs/:job_id` - Upload job media (before/after)
- `POST /api/media/contractors/portfolio` - Upload contractor portfolio
- `DELETE /api/media/properties/:media_id` - Delete media

### Contractors
- `GET /api/contractors/search` - Search contractors
- `GET /api/contractors/:id` - Get contractor profile
- `POST /api/contractors/profile` - Create contractor profile
- `GET /api/contractors/profile/me` - Get own profile
- `PUT /api/contractors/profile/me` - Update own profile

### Service Requests
- `POST /api/requests` - Create service request
- `GET /api/requests` - List requests (homeowner)
- `GET /api/requests/available/list` - List available requests (contractor)
- `GET /api/requests/:id` - Get request details
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
- `POST /api/payments/webhook` - Stripe webhook

### Reviews
- `POST /api/reviews/jobs/:jobId` - Create review
- `GET /api/reviews/contractors/:contractorId` - Get contractor reviews

## Project Structure

```
backend/
├── app/
│   ├── models/          # Database models
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   └── utils/           # Utilities (auth, etc.)
├── config/              # Configuration files
├── migrations/          # Database migrations
├── scripts/             # Utility scripts
└── server.js            # Entry point
```

## Media Upload

The backend supports media uploads to AWS S3:
- Images are automatically optimized and thumbnails are generated
- Videos are uploaded directly
- Files are organized by type (properties, jobs, contractors)

## Development

- Use `npm run dev` for development with auto-reload
- Check logs for debugging
- API responses follow standard format: `{ data }` or `{ error: { message } }`

## Testing

```bash
# Run tests (when implemented)
npm test
```

## Deployment

1. Set production environment variables
2. Build and start server
3. Ensure database is migrated
4. Configure reverse proxy (nginx) if needed

