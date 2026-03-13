import { pool } from './src/config/database.js';

async function forceMigrate() {
    try {
        console.log('Forcing migration: Adding firebase_uid column...');
        await pool.execute("ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(255) UNIQUE AFTER id");
        // Also make password_hash nullable if possible, requires complex alter. 
        // For now we will just insert dummy passwords for firebase users.
        console.log('Migration successful: firebase_uid column added.');
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
