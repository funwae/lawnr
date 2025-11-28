import Database from "better-sqlite3";
import dotenv from "dotenv";
import { dirname, join } from "path";
import pg from "pg";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Demo mode uses SQLite
const isDemoMode = process.env.DEMO_MODE === "true";

let pool;
let db;

if (isDemoMode) {
  // SQLite database for demo
  const dbPath = join(__dirname, "..", "demo.db");
  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Don't log full path in production to avoid exposing system information
  if (process.env.NODE_ENV !== 'production') {
    console.log("📦 Demo mode: Using SQLite database at", dbPath);
  } else {
    console.log("📦 Demo mode: Using SQLite database");
  }

  // Create a PostgreSQL-compatible interface
  pool = {
    query: (text, params) => {
      // Convert PostgreSQL queries to SQLite
      let sql = text;

      // Replace $1, $2, etc. with ?
      sql = sql.replace(/\$(\d+)/g, "?");

      // Convert PostgreSQL types to SQLite
      sql = sql.replace(/::uuid/gi, "");
      sql = sql.replace(/::text/gi, "");
      sql = sql.replace(/::integer/gi, "");
      sql = sql.replace(/::numeric/gi, "");
      sql = sql.replace(/::timestamp/gi, "");
      sql = sql.replace(/::boolean/gi, "");
      sql = sql.replace(/::jsonb/gi, "");
      sql = sql.replace(/::point/gi, "");
      sql = sql.replace(/NOW\(\)/gi, "datetime('now')");
      sql = sql.replace(/CURRENT_TIMESTAMP/gi, "datetime('now')");
      sql = sql.replace(/RETURNING \*/gi, "");
      sql = sql.replace(/RETURNING id/gi, "");

      try {
        const sqlUpper = sql.trim().toUpperCase();
        const isInsert = sqlUpper.startsWith("INSERT");
        const isUpdate = sqlUpper.startsWith("UPDATE");
        const isDelete = sqlUpper.startsWith("DELETE");
        const isSelect = sqlUpper.startsWith("SELECT");

        if (isInsert) {
          const stmt = db.prepare(sql);
          const info = stmt.run(params || []);
          const lastId = db.prepare("SELECT last_insert_rowid() as id").get();
          return Promise.resolve({
            rows: [{ id: lastId.id }],
            rowCount: 1,
          });
        }

        if (isUpdate || isDelete) {
          const stmt = db.prepare(sql);
          const info = stmt.run(params || []);
          return Promise.resolve({
            rows: [],
            rowCount: info.changes || 0,
          });
        }

        if (isSelect) {
          const stmt = db.prepare(sql);
          const result = stmt.all(params || []);
          return Promise.resolve({
            rows: result,
            rowCount: result.length,
          });
        }

        // For other statements (CREATE, DROP, etc.)
        db.exec(sql);
        return Promise.resolve({
          rows: [],
          rowCount: 0,
        });
      } catch (error) {
        console.error("SQLite query error:", error);
        console.error("SQL:", sql);
        console.error("Params:", params);
        return Promise.reject(error);
      }
    },
    end: () => Promise.resolve(),
    on: () => {},
  };
} else {
  // PostgreSQL for production/development
  const { Pool } = pg;

  // Database configuration based on environment
  const getDatabaseConfig = () => {
    const env = process.env.NODE_ENV || "development";

    if (env === "test") {
      return {
        host: process.env.TEST_DB_HOST || process.env.DB_HOST || "localhost",
        port: parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT || 5433),
        database: process.env.TEST_DB_NAME || "lawnr_test",
        user: process.env.TEST_DB_USER || process.env.DB_USER || "postgres",
        password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || "",
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };
    }

    return {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || 5433),
      database: process.env.DB_NAME || "lawnr",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  };

  pool = new Pool(getDatabaseConfig());

  // Test connection
  pool.on("connect", () => {
    const env = process.env.NODE_ENV || "development";
    console.log(`Connected to ${env} database`);
  });

  pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
  });
}

export default pool;
export { db };
