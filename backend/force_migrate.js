import { pool } from './src/config/database.js';

async function forceMigrate() {
    try {
        console.log('Forcing migration: Adding status column...');
        await pool.execute("ALTER TABLE users ADD COLUMN status ENUM('ACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE' AFTER is_online");
        console.log('Migration successful: status column added.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists (ER_DUP_FIELDNAME).');
        } else {
            console.error('Migration failed:', error);
        }
        process.exit(1);
    }
}

forceMigrate();
