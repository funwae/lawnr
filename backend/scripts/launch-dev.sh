#!/bin/bash

# Launch script for development environment

set -e

echo "=== Launching Lawnr Development Environment ==="

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Creating from .env.example..."
  cp .env.example .env
  echo "📝 Please update .env with your configuration"
  exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check database connection
echo "Checking database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1 || {
  echo "❌ Cannot connect to database. Please check your configuration."
  exit 1
}

# Run migrations
echo "Running database migrations..."
npm run migrate

# Start server
echo "Starting development server..."
npm run dev

