# 🎭 Demo Mode - Quick Start

Demo mode lets you see the app **immediately** without setting up PostgreSQL or Docker!

## What Demo Mode Does

- ✅ **Bypasses authentication** - No login required
- ✅ **Uses SQLite** - No database setup needed
- ✅ **Pre-loaded sample data** - Properties, requests, quotes, jobs
- ✅ **Switch roles easily** - Add `?role=contractor` or `?role=homeowner` to any request

## Quick Start (3 Commands)

```bash
# 1. Install dependencies (if not already done)
cd backend
npm install

# 2. Setup demo database
npm run setup:demo

# 3. Start server in demo mode
npm run demo
```

That's it! The server will start on `http://localhost:3000`

## Test It Out

### Health Check
```bash
curl http://localhost:3000/health
```

### Get Properties (as homeowner)
```bash
curl http://localhost:3000/api/properties
```

### Get Properties (as contractor)
```bash
curl "http://localhost:3000/api/properties?role=contractor"
```

### Get Service Requests
```bash
curl http://localhost:3000/api/requests
```

### Get Jobs
```bash
curl http://localhost:3000/api/jobs
```

## Demo Users

The demo database includes:

- **Homeowner**: `demo.homeowner@lawnr.com` (default role)
- **Contractor**: `demo.contractor@lawnr.com`
- **Admin**: `demo.admin@lawnr.com`

## Switching Roles

Add a query parameter to any API request:

- `?role=homeowner` - View as homeowner (default)
- `?role=contractor` - View as contractor
- `?role=admin` - View as admin

Example:
```bash
# As homeowner
curl http://localhost:3000/api/properties

# As contractor
curl "http://localhost:3000/api/properties?role=contractor"
```

## Demo Data Included

- 2 properties (123 Main St, 456 Oak Ave)
- 2 service requests (lawn mowing, hedge trimming)
- 2 quotes (pending)
- 1 job (scheduled)
- 1 contractor profile (Green Thumb Landscaping)

## API Endpoints Available

All endpoints work in demo mode:

- `/api/properties` - Properties
- `/api/requests` - Service requests
- `/api/quotes` - Quotes
- `/api/jobs` - Jobs
- `/api/contractors` - Contractor profiles
- `/api/payments` - Payments
- `/api/reviews` - Reviews
- `/api/notifications` - Notifications
- `/api/analytics` - Analytics (contractor)
- `/api/expenses` - Expenses (contractor)

## Development Mode

For auto-reload during development:

```bash
npm run demo:watch
```

## Limitations

Demo mode is simplified:

- SQLite instead of PostgreSQL (no PostGIS)
- No real authentication
- No AWS S3 (media uploads won't work)
- No Firebase (notifications won't send)
- No Stripe (payments are simulated)

But you can **see and test all the UI and API endpoints**!

## Switching Back to Real Mode

To use PostgreSQL again:

```bash
# Remove DEMO_MODE
npm run dev

# Or set it explicitly
DEMO_MODE=false npm run dev
```

## Troubleshooting

**Database file not found?**
```bash
npm run setup:demo
```

**Port already in use?**
```bash
PORT=3001 npm run demo
```

**Want to reset demo data?**
```bash
rm backend/demo.db
npm run setup:demo
```


