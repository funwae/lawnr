#!/bin/bash

# Setup script for test database
# This script creates the test database and runs migrations

set -e

echo "=== Setting up Test Database ==="

# Database connection details
DB_HOST=${TEST_DB_HOST:-localhost}
DB_PORT=${TEST_DB_PORT:-5432}
DB_NAME=${TEST_DB_NAME:-lawnr_test}
DB_USER=${TEST_DB_USER:-postgres}
DB_PASSWORD=${TEST_DB_PASSWORD:-postgres}

# Export for Node.js scripts
export TEST_DB_HOST=$DB_HOST
export TEST_DB_PORT=$DB_PORT
export TEST_DB_NAME=$DB_NAME
export TEST_DB_USER=$DB_USER
export TEST_DB_PASSWORD=$DB_PASSWORD
export NODE_ENV=test

echo "Creating test database: $DB_NAME"

# Create database (requires postgres user)
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" || true
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

echo "Running migrations..."
npm run migrate:test

echo "Seeding test data..."
npm run seed:test

echo "✅ Test database setup complete!"

