#!/bin/bash

# Setup and Launch Script for Lawnr
# This script will guide you through the setup process

set -e

echo "=== Lawnr Setup and Launch ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=lawnr
DB_USER=postgres
DB_PASSWORD=CHANGE_THIS_PASSWORD

# Test Database Configuration
TEST_DB_HOST=localhost
TEST_DB_PORT=5433
TEST_DB_NAME=lawnr_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=CHANGE_THIS_PASSWORD

# JWT Configuration
# ⚠️ SECURITY WARNING: Change this to a strong random secret in production!
JWT_SECRET=CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# AWS S3 Configuration (optional for development)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=lawnr-media

# Stripe Configuration (optional for development)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Firebase Configuration (optional)
FIREBASE_SERVICE_ACCOUNT=

# Email Configuration (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@lawnr.com

# SMS Configuration (optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
EOF
    echo "✅ .env file created"
    echo ""
    echo "⚠️  Please edit .env and set your PostgreSQL password:"
    echo "   DB_PASSWORD=your-actual-password"
    echo "   TEST_DB_PASSWORD=your-actual-password"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "Checking PostgreSQL connection..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL connection successful"
else
    echo "❌ Cannot connect to PostgreSQL"
    echo "   Please check:"
    echo "   1. PostgreSQL is running: pg_isready"
    echo "   2. DB_PASSWORD in .env is correct"
    echo "   3. Database user has proper permissions"
    exit 1
fi

echo ""
echo "Creating database if it doesn't exist..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
echo "✅ Database ready"

echo ""
echo "Installing PostGIS extension..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS postgis;" > /dev/null 2>&1 || echo "⚠️  PostGIS may not be installed"
echo "✅ Extensions ready"

echo ""
echo "Installing UUID extension..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' > /dev/null 2>&1
echo "✅ UUID extension ready"

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
echo "Starting development server..."
echo "Server will be available at http://localhost:3000"
echo ""
echo "Test accounts:"
echo "  Homeowner: homeowner@test.com / password123"
echo "  Contractor: contractor@test.com / password123"
echo "  Admin: admin@test.com / password123"
echo ""

npm run dev

