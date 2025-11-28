import dotenv from "dotenv";
import { hashPassword } from "../app/utils/auth.js";
import pool, { db } from "../config/database.js";

dotenv.config();

const isDemoMode = process.env.DEMO_MODE === "true";

async function createAdminUser() {
  try {
    // ⚠️ SECURITY WARNING: These are test credentials for development only!
    // Change these values in production or use environment variables
    const email = process.env.ADMIN_EMAIL || "test@test.com";
    const password = process.env.ADMIN_PASSWORD || "test123";
    const fullName = "Test Admin";
    const role = "admin";
    const phoneNumber = "+1234567890";

    // Hash the password
    const passwordHash = await hashPassword(password);

    if (isDemoMode) {
      // SQLite (demo mode)
      console.log("📦 Demo mode: Using SQLite database");

      // Check if user already exists
      const existing = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(email);

      if (existing) {
        console.log(`User ${email} already exists. Updating password...`);
        db.prepare(
          "UPDATE users SET password_hash = ?, role = ?, full_name = ?, phone_number = ? WHERE email = ?"
        ).run(passwordHash, role, fullName, phoneNumber, email);
        console.log(`✅ Password and details updated for user ${email}`);
      } else {
        // Insert new user
        const stmt = db.prepare(
          `INSERT INTO users (email, password_hash, full_name, role, phone_number)
           VALUES (?, ?, ?, ?, ?)`
        );
        stmt.run(email, passwordHash, fullName, role, phoneNumber);
        const lastId = db.prepare("SELECT last_insert_rowid() as id").get();
        console.log(`✅ Admin user created successfully!`);
        console.log(`   ID: ${lastId.id}`);
      }
    } else {
      // PostgreSQL
      // Check if user already exists
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        console.log(`User ${email} already exists. Updating password...`);
        await pool.query(
          "UPDATE users SET password_hash = $1, role = $2, full_name = $3, phone_number = $4 WHERE email = $5",
          [passwordHash, role, fullName, phoneNumber, email]
        );
        console.log(`✅ Password and details updated for user ${email}`);
      } else {
        // Insert new user
        const result = await pool.query(
          `INSERT INTO users (email, password_hash, full_name, role, phone_number)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, email, role, full_name`,
          [email, passwordHash, fullName, role, phoneNumber]
        );
        console.log(`✅ Admin user created successfully!`);
        console.log(`   ID: ${result.rows[0].id}`);
      }
    }

    console.log("\nLogin credentials:");
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role: ${role}`);

    if (isDemoMode) {
      db.close();
    } else {
      await pool.end();
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    if (isDemoMode && db) {
      db.close();
    }
    process.exit(1);
  }
}

createAdminUser();
