#!/bin/bash

set -e

echo "=== Lawnr Interactive Setup ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env 2>/dev/null || cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=lawnr
DB_USER=postgres
DB_PASSWORD=
TEST_DB_HOST=localhost
TEST_DB_PORT=5433
TEST_DB_NAME=lawnr_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=
# ⚠️ SECURITY WARNING: Change this to a strong random secret in production!
JWT_SECRET=CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=7d
EOF
fi

echo "PostgreSQL Connection Setup"
echo "============================"
echo ""
echo "We need your PostgreSQL password to continue."
echo ""
echo "Options:"
echo "1. Enter your PostgreSQL password"
echo "2. Reset PostgreSQL password (requires sudo)"
echo "3. Skip database setup (you'll need to do it manually)"
echo ""
read -p "Choose option (1-3): " option

case $option in
    1)
        read -sp "Enter PostgreSQL password for user 'postgres': " password
        echo ""
        sed -i "s/^DB_PASSWORD=$/DB_PASSWORD=$password/" .env
        sed -i "s/^TEST_DB_PASSWORD=$/TEST_DB_PASSWORD=$password/" .env
        export PGPASSWORD="$password"
        ;;
    2)
        read -sp "Enter NEW password for PostgreSQL user 'postgres': " new_password
        echo ""
        echo "Resetting password (requires sudo)..."
        sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$new_password';" || {
            echo "❌ Failed to reset password. You may need to run this manually:"
            echo "   sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'your-password';\""
            exit 1
        }
        sed -i "s/^DB_PASSWORD=$/DB_PASSWORD=$new_password/" .env
        sed -i "s/^TEST_DB_PASSWORD=$/TEST_DB_PASSWORD=$new_password/" .env
        export PGPASSWORD="$new_password"
        ;;
    3)
        echo "Skipping database setup. Please configure manually."
        exit 0
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

# Load environment
export $(cat .env | grep -v '^#' | xargs)

echo ""
echo "Testing PostgreSQL connection..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Connection successful!"
else
    echo "❌ Connection failed. Please check your password and try again."
    exit 1
fi

echo ""
echo "Creating database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
echo "✅ Database ready"

echo ""
echo "Installing extensions..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS postgis;" > /dev/null 2>&1 || echo "⚠️  PostGIS may not be installed"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' > /dev/null 2>&1
echo "✅ Extensions installed"

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

