import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { hashPassword } from './src/utils/password.js';

dotenv.config();

const resetPassword = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Molli@1020',
            database: 'cu_harvest',
            port: process.env.DB_PORT || 3306
        });

        const newPassword = 'admin123';
        console.log(`Hashing password: ${newPassword}`);
        const hashedPassword = await hashPassword(newPassword);
        console.log(`New hash: ${hashedPassword}`);

        // Update ALL users
        const [result] = await connection.execute(
            'UPDATE users SET password_hash = ?',
            [hashedPassword]
        );

        console.log(`Updated ${result.affectedRows} user passwords.`);

        await connection.end();
    } catch (err) {
        console.error('Error resetting password:', err);
    }
};

resetPassword();
