import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const env = process.env.NODE_ENV || 'development';
  const dbName = env === 'test'
    ? (process.env.TEST_DB_NAME || 'lawnr_test')
    : (process.env.DB_NAME || 'lawnr');

  console.log(`Running migrations for ${env} database: ${dbName}`);

  try {
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files`);

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    // Get applied migrations
    const appliedResult = await pool.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    const applied = new Set(appliedResult.rows.map(r => r.version));

    // Run pending migrations
    for (const file of files) {
      const version = file.replace('.sql', '');

      if (applied.has(version)) {
        console.log(`✓ Migration ${version} already applied`);
        continue;
      }

      console.log(`Running migration: ${file}...`);

      const sql = fs.readFileSync(
        path.join(migrationsDir, file),
        'utf8'
      );

      // Run migration in a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version]
        );
        await client.query('COMMIT');
        console.log(`✓ Migration ${version} applied successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigrations();

