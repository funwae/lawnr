import Database from "better-sqlite3";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "..", "demo.db");
const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

console.log("📦 Setting up demo database...");

// Drop existing tables if they exist
const dropTables = `
  DROP TABLE IF EXISTS expenses;
  DROP TABLE IF EXISTS reviews;
  DROP TABLE IF EXISTS payments;
  DROP TABLE IF EXISTS jobs;
  DROP TABLE IF EXISTS quotes;
  DROP TABLE IF EXISTS request_media;
  DROP TABLE IF EXISTS service_requests;
  DROP TABLE IF EXISTS property_media;
  DROP TABLE IF EXISTS properties;
  DROP TABLE IF EXISTS contractor_profiles;
  DROP TABLE IF EXISTS users;
`;

db.exec(dropTables);

// Create tables (simplified schema for demo)
const createTables = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL CHECK(role IN ('homeowner', 'contractor', 'admin')),
    full_name TEXT NOT NULL,
    phone_number TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contractor_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    business_name TEXT,
    license_number TEXT,
    insurance_provider TEXT,
    service_radius INTEGER,
    hourly_rate NUMERIC,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',
    latitude REAL,
    longitude REAL,
    yard_size_estimate TEXT,
    yard_notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS property_media (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS service_requests (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    homeowner_id TEXT NOT NULL,
    requested_services TEXT,
    schedule_preference TEXT DEFAULT 'scheduled',
    preferred_date TEXT,
    preferred_time_from TEXT,
    preferred_time_to TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (homeowner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS request_media (
    id TEXT PRIMARY KEY,
    service_request_id TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT,
    thumbnail_url TEXT,
    file_size INTEGER,
    mime_type TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id)
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    contractor_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    valid_until TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (request_id) REFERENCES service_requests(id),
    FOREIGN KEY (contractor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    quote_id TEXT NOT NULL,
    contractor_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    scheduled_date TEXT,
    scheduled_time_from TEXT,
    scheduled_time_to TEXT,
    actual_start TEXT,
    actual_end TEXT,
    status TEXT DEFAULT 'scheduled',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (quote_id) REFERENCES quotes(id),
    FOREIGN KEY (contractor_id) REFERENCES users(id),
    FOREIGN KEY (property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    reviewee_id TEXT NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (reviewee_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    contractor_id TEXT NOT NULL,
    job_id TEXT,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT,
    expense_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (contractor_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  );
`;

db.exec(createTables);

// Insert demo data
const insertDemoData = () => {
  // Demo users
  db.prepare(
    `
    INSERT INTO users (id, email, role, full_name, phone_number)
    VALUES
      ('demo-homeowner-1', 'demo.homeowner@lawnr.com', 'homeowner', 'John Doe', '555-0101'),
      ('demo-contractor-1', 'demo.contractor@lawnr.com', 'contractor', 'Jane Smith', '555-0202'),
      ('demo-admin-1', 'demo.admin@lawnr.com', 'admin', 'Admin User', '555-0000')
  `
  ).run();

  // Contractor profile
  db.prepare(
    `
    INSERT INTO contractor_profiles (id, user_id, business_name, service_radius, hourly_rate)
    VALUES ('contractor-profile-1', 'demo-contractor-1', 'Green Thumb Landscaping', 25, 50.00)
  `
  ).run();

  // Properties
  db.prepare(
    `
    INSERT INTO properties (id, owner_id, address_line1, city, province, postal_code, latitude, longitude)
    VALUES
      ('property-1', 'demo-homeowner-1', '123 Main St', 'Springfield', 'IL', '62701', 39.7817, -89.6501),
      ('property-2', 'demo-homeowner-1', '456 Oak Ave', 'Springfield', 'IL', '62702', 39.7917, -89.6601)
  `
  ).run();

  // Service requests
  db.prepare(
    `
    INSERT INTO service_requests (id, property_id, homeowner_id, requested_services, schedule_preference, preferred_date, notes, status)
    VALUES
      ('request-1', 'property-1', 'demo-homeowner-1', 'lawn_mowing', 'scheduled', '2024-12-20', 'Weekly lawn mowing needed', 'pending'),
      ('request-2', 'property-1', 'demo-homeowner-1', 'hedge_trimming', 'scheduled', '2024-12-21', 'Hedge trimming and edging', 'pending')
  `
  ).run();

  // Quotes
  db.prepare(
    `
    INSERT INTO quotes (id, request_id, contractor_id, amount, description, status)
    VALUES
      ('quote-1', 'request-1', 'demo-contractor-1', 75.00, 'Weekly mowing service', 'pending'),
      ('quote-2', 'request-2', 'demo-contractor-1', 120.00, 'Hedge trimming and edging', 'pending')
  `
  ).run();

  // Jobs
  db.prepare(
    `
    INSERT INTO jobs (id, quote_id, contractor_id, property_id, status, scheduled_date)
    VALUES
      ('job-1', 'quote-1', 'demo-contractor-1', 'property-1', 'scheduled', '2024-12-20')
  `
  ).run();

  console.log("✅ Demo database setup complete!");
  console.log("");
  console.log("Demo users:");
  console.log("  Homeowner: demo.homeowner@lawnr.com");
  console.log("  Contractor: demo.contractor@lawnr.com");
  console.log("  Admin: demo.admin@lawnr.com");
  console.log("");
  console.log(
    "Switch roles by adding ?role=contractor or ?role=homeowner to API requests"
  );
};

insertDemoData();

db.close();
console.log("📦 Demo database ready at:", dbPath);

