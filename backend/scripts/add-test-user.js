import Database from "better-sqlite3";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "..", "demo.db");
const db = new Database(dbPath);

// ⚠️ SECURITY WARNING: These are test credentials for development only!
// Change these values in production or use environment variables
const testEmail = process.env.TEST_EMAIL || "test";
const testPassword = process.env.TEST_PASSWORD || "demo123";

// Hash the password
const passwordHash = await bcrypt.hash(testPassword, 10);

// Check if user already exists
const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(testEmail);

if (existing) {
  console.log(`User '${testEmail}' already exists. Updating password...`);
  db.prepare(
    "UPDATE users SET password_hash = ? WHERE email = ?"
  ).run(passwordHash, testEmail);
  console.log(`✅ Password updated for user '${testEmail}'`);
} else {
  // Insert new user
  db.prepare(
    `
    INSERT INTO users (id, email, password_hash, role, full_name, phone_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  ).run(
    "test-user-1",
    testEmail,
    passwordHash,
    "homeowner",
    "Test User",
    "555-0000"
  );
  console.log("✅ Test user created successfully!");
}

console.log("\nLogin credentials:");
console.log(`  Email: ${testEmail}`);
console.log(`  Password: ${testPassword}`);

db.close();

