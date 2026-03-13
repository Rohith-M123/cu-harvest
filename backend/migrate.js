import { createPool } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cu_harvest',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

async function runMigration() {
    try {
        console.log('Starting migration...');
        // Correct path relative to backend/migrate.js: ./sql/migrations/...
        const migrationFile = path.join(__dirname, 'sql/migrations/001_add_rider_fields.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');

        console.log('Executing SQL...');
        await pool.query(sql);

        console.log('Migration completed successfully.');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Migration already applied (Columns exist). Skipping.');
        } else {
            console.error('Migration failed:', error);
        }
    } finally {
        await pool.end();
    }
}

runMigration();
