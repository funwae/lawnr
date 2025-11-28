#!/bin/bash

set -e

echo "=== Lawnr Docker Setup ==="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    echo "Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker found"
echo ""

# Navigate to project root
cd "$(dirname "$0")/../.."

echo "Starting PostgreSQL container..."
docker-compose up -d postgres || docker compose up -d postgres

echo ""
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Wait for PostgreSQL to be healthy
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1 || \
       docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

echo ""
echo "Setting up database extensions..."
docker-compose exec -T postgres psql -U postgres -d lawnr -c "CREATE EXTENSION IF NOT EXISTS postgis;" || \
docker compose exec -T postgres psql -U postgres -d lawnr -c "CREATE EXTENSION IF NOT EXISTS postgis;"

docker-compose exec -T postgres psql -U postgres -d lawnr -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' || \
docker compose exec -T postgres psql -U postgres -d lawnr -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'

echo "✅ Extensions installed"

echo ""
echo "Copying Docker .env file..."
cd backend
cp .env.docker .env
echo "✅ .env configured for Docker"

echo ""
echo "Running migrations..."
npm run migrate
echo "✅ Migrations complete"

echo ""
echo "Seeding database..."
npm run seed
echo "✅ Database seeded"

echo ""
echo "Running health check..."
npm run health

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "PostgreSQL is running in Docker"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  User: postgres"
echo "  Password: postgres"
echo "  Database: lawnr"
echo ""
echo "To start the backend server:"
echo "  cd backend && npm run dev"
echo ""
echo "To stop PostgreSQL:"
echo "  docker-compose down"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f postgres"

