import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function healthCheck() {
  console.log('=== Lawnr Backend Health Check ===\n');

  // Check database connection
  try {
    const result = await pool.query('SELECT NOW(), version()');
    console.log('✅ Database: Connected');
    console.log(`   Time: ${result.rows[0].now}`);
    console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
  } catch (error) {
    console.log('❌ Database: Connection failed');
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  }

  // Check PostGIS extension
  try {
    const result = await pool.query("SELECT PostGIS_version()");
    console.log('✅ PostGIS: Installed');
    console.log(`   Version: ${result.rows[0].postgis_version}`);
  } catch (error) {
    console.log('⚠️  PostGIS: Not installed (required for geolocation features)');
  }

  // Check environment variables
  console.log('\n=== Environment Variables ===');
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];
  const optional = ['AWS_ACCESS_KEY_ID', 'STRIPE_SECRET_KEY', 'FIREBASE_SERVICE_ACCOUNT', 'EMAIL_USER'];

  required.forEach(key => {
    if (process.env[key]) {
      console.log(`✅ ${key}: Set`);
    } else {
      console.log(`❌ ${key}: Missing (required)`);
    }
  });

  optional.forEach(key => {
    if (process.env[key]) {
      console.log(`✅ ${key}: Set`);
    } else {
      console.log(`⚠️  ${key}: Not set (optional)`);
    }
  });

  // Check migrations
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM schema_migrations');
    console.log(`\n✅ Migrations: ${result.rows[0].count} applied`);
  } catch (error) {
    console.log('\n⚠️  Migrations: Table not found (run migrations first)');
  }

  console.log('\n=== Health Check Complete ===');
  process.exit(0);
}

healthCheck();

