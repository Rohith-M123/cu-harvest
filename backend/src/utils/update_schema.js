import { pool } from '../config/database.js';
import dotenv from 'dotenv';
dotenv.config();

const runUpdate = async () => {
    try {
        console.log('Running schema update...');
        await pool.execute(`
            ALTER TABLE orders 
            MODIFY COLUMN status 
            ENUM('PLACED', 'ASSIGNED', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'CANCELLED') 
            DEFAULT 'PLACED'
        `);
        console.log('✅ Schema updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Schema update failed:', error.message);
        process.exit(1);
    }
};

runUpdate();
