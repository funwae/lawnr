import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  const env = process.env.NODE_ENV || 'development';
  console.log(`Seeding ${env} database...`);

  try {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // ⚠️ SECURITY WARNING: These are test credentials for development only!
      // Change these values in production or use environment variables
      const testPassword = process.env.TEST_USER_PASSWORD || 'password123';
      const hashedPassword = await bcrypt.hash(testPassword, 10);

      // Test Homeowner
      const homeownerResult = await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, phone_number)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING id
      `, [
        'homeowner@test.com',
        hashedPassword,
        'Test Homeowner',
        'homeowner',
        '+1234567890'
      ]);

      const homeownerId = homeownerResult.rows[0].id;

      // Test Contractor
      const contractorResult = await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, phone_number)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING id
      `, [
        'contractor@test.com',
        hashedPassword,
        'Test Contractor',
        'contractor',
        '+1234567891'
      ]);

      const contractorId = contractorResult.rows[0].id;

      // Test Admin
      const adminResult = await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, phone_number)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING id
      `, [
        'admin@test.com',
        hashedPassword,
        'Test Admin',
        'admin',
        '+1234567892'
      ]);

      // Create contractor profile
      await client.query(`
        INSERT INTO contractor_profiles (
          user_id, business_name, description, hourly_rate,
          service_area_radius, is_verified, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO UPDATE SET
          business_name = EXCLUDED.business_name,
          description = EXCLUDED.description
      `, [
        contractorId,
        'Test Lawn Care Services',
        'Professional lawn care and landscaping services',
        50.00,
        25,
        true,
        true
      ]);

      // Create test property
      const propertyResult = await client.query(`
        INSERT INTO properties (
          owner_id, address, city, state, zip_code, property_type,
          lot_size_sqft, location
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326))
        RETURNING id
      `, [
        homeownerId,
        '123 Test Street',
        'Test City',
        'TS',
        '12345',
        'residential',
        5000,
        -122.4194, // San Francisco coordinates
        37.7749
      ]);

      const propertyId = propertyResult.rows[0].id;

      // Create test service request
      const requestResult = await client.query(`
        INSERT INTO service_requests (
          property_id, requested_by, service_type, description,
          preferred_date, status, location
        )
        VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326))
        RETURNING id
      `, [
        propertyId,
        homeownerId,
        'lawn_mowing',
        'Need weekly lawn mowing service',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        'open',
        -122.4194,
        37.7749
      ]);

      const requestId = requestResult.rows[0].id;

      // Create test quote
      await client.query(`
        INSERT INTO quotes (
          request_id, contractor_id, quoted_price, estimated_hours,
          expires_at, status
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        requestId,
        contractorId,
        75.00,
        2,
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        'pending'
      ]);

      await client.query('COMMIT');

      console.log('✅ Database seeded successfully!');
      console.log('\nTest Accounts:');
      console.log(`  Homeowner: homeowner@test.com / ${testPassword}`);
      console.log(`  Contractor: contractor@test.com / ${testPassword}`);
      console.log(`  Admin: admin@test.com / ${testPassword}`);
      console.log('\n⚠️  SECURITY WARNING: These are test credentials for development only!');
      console.log(`\nCreated:`);
      console.log(`  - 3 users`);
      console.log(`  - 1 property`);
      console.log(`  - 1 service request`);
      console.log(`  - 1 quote`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();

