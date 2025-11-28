# Docker Setup - Easy Launch! 🐳

Docker makes setup much easier - no PostgreSQL password issues!

## Quick Start

### 1. Start PostgreSQL with Docker

```bash
# From project root
docker-compose up -d postgres
```

This starts PostgreSQL with:
- PostGIS extension pre-installed
- Username: `postgres`
- Password: `postgres`
- Database: `lawnr`
- Port: `5432`

### 2. Run Automated Setup

```bash
./backend/scripts/docker-setup.sh
```

This script will:
- ✅ Start PostgreSQL container
- ✅ Install extensions (PostGIS, UUID)
- ✅ Configure .env file
- ✅ Run migrations
- ✅ Seed test data
- ✅ Verify everything works

### 3. Start Backend Server

```bash
cd backend
npm run dev
```

Server will be at `http://localhost:3000`

## Manual Setup (Alternative)

If you prefer to do it step by step:

```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Wait for it to be ready (about 10 seconds)
sleep 10

# 3. Install extensions
docker-compose exec postgres psql -U postgres -d lawnr -c "CREATE EXTENSION IF NOT EXISTS postgis;"
docker-compose exec postgres psql -U postgres -d lawnr -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'

# 4. Configure .env
cd backend
cp .env.docker .env

# 5. Run migrations and seed
npm run migrate
npm run seed

# 6. Start server
npm run dev
```

## Docker Commands

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Stop PostgreSQL
docker-compose down

# View logs
docker-compose logs -f postgres

# Restart PostgreSQL
docker-compose restart postgres

# Remove everything (including data)
docker-compose down -v
```

## Optional: pgAdmin (Database GUI)

Start pgAdmin for easy database management:

```bash
docker-compose --profile tools up -d pgadmin
```

Then visit: `http://localhost:5050`
- Email: `admin@lawnr.com`
- Password: `admin`

## Test Accounts

After seeding:
- **Homeowner**: `homeowner@test.com` / `password123`
- **Contractor**: `contractor@test.com` / `password123`
- **Admin**: `admin@test.com` / `password123`

## Troubleshooting

### Docker not installed?
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Or install Docker Desktop
# https://docs.docker.com/get-docker/
```

### Port 5432 already in use?
Edit `docker-compose.yml` and change:
```yaml
ports:
  - "5433:5432"  # Use 5433 instead
```

Then update `backend/.env`:
```
DB_PORT=5433
```

### Container won't start?
```bash
# Check logs
docker-compose logs postgres

# Remove and recreate
docker-compose down -v
docker-compose up -d postgres
```

## Benefits of Docker

✅ **No password issues** - Everything pre-configured
✅ **PostGIS included** - No manual installation
✅ **Isolated environment** - Won't affect your system PostgreSQL
✅ **Easy cleanup** - Just `docker-compose down -v`
✅ **Consistent setup** - Works the same everywhere
✅ **Quick reset** - Recreate database in seconds

## Next Steps

Once PostgreSQL is running:
1. Run `./backend/scripts/docker-setup.sh`
2. Start backend: `cd backend && npm run dev`
3. Test API: `curl http://localhost:3000/api/health`

That's it! Much easier than dealing with local PostgreSQL! 🎉

