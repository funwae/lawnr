#!/bin/bash

echo "=== PostgreSQL Password Helper ==="
echo ""
echo "PostgreSQL requires a password. Let's find the right one."
echo ""

# Try common passwords
PASSWORDS=("postgres" "" "password" "admin" "root")

for pwd in "${PASSWORDS[@]}"; do
  echo "Trying password: ${pwd:-'(empty)'}..."
  export PGPASSWORD="$pwd"
  if psql -h localhost -p 5433 -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ SUCCESS! Password is: ${pwd:-'(empty - no password)'}"
    echo ""
    echo "Update your .env file:"
    echo "  DB_PASSWORD=$pwd"
    echo "  TEST_DB_PASSWORD=$pwd"
    exit 0
  fi
done

echo "❌ Could not find password automatically."
echo ""
echo "Please:"
echo "1. Find your PostgreSQL password"
echo "2. Or reset it: sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'newpassword';\""
echo "3. Update .env with: DB_PASSWORD=your-password"

