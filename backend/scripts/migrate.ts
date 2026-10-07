import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  let migrationsDir = path.resolve(__dirname, '../../db/migrations');
  if (!fs.existsSync(migrationsDir)) {
    migrationsDir = path.resolve(__dirname, '../../../db/migrations');
  }
  if (!fs.existsSync(migrationsDir)) {
    migrationsDir = path.resolve(process.cwd(), '../db/migrations');
  }
  console.log(`[MIGRATOR] Reading migrations from: ${migrationsDir}`);

  if (!fs.existsSync(migrationsDir)) {
    console.error(`[MIGRATOR] Migrations directory does not exist: ${migrationsDir}`);
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(100) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Fetch applied migrations
    const appliedResult = await client.query('SELECT version FROM schema_migrations ORDER BY version ASC');
    const appliedSet = new Set(appliedResult.rows.map((r: any) => r.version));

    // 3. Read and sort migration files
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`[MIGRATOR] Found ${files.length} migration file(s).`);

    let pendingCount = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  ✓ ${file} (already applied)`);
        continue;
      }

      console.log(`  ⚡ Executing migration: ${file}...`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      try {
        await client.query('BEGIN');
        await client.query(sqlContent);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  ✅ Successfully applied ${file}`);
        pendingCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ❌ Failed applying ${file}:`, err);
        throw err;
      }
    }

    if (pendingCount === 0) {
      console.log(`[MIGRATOR] Database schema is fully up-to-date. Zero pending migrations.`);
    } else {
      console.log(`[MIGRATOR] Applied ${pendingCount} pending migration(s) successfully.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('[MIGRATOR] Migration execution aborted:', err);
  process.exit(1);
});
