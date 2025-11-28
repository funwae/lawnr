#!/bin/bash

# Launch script for testing environment

set -e

echo "=== Launching Lawnr Test Environment ==="

# Set test environment
export NODE_ENV=test

# Setup test database
echo "Setting up test database..."
./scripts/setup-test-db.sh

# Run tests
echo "Running tests..."
npm test

echo "✅ Tests completed!"

