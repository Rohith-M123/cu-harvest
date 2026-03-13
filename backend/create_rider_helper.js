
import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'cu_harvest'
};

const pool = createPool(dbConfig);

const email = 'rider_manual@cu-harvest.com';
const password = 'riderpassword123';
const name = 'Manual Rider';
const role = 'RIDER';

async function createRider() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to DB');

        const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            console.log('User exists, updating role to RIDER...');
            await connection.execute('UPDATE users SET role = "RIDER" WHERE email = ?', [email]);
        } else {
            console.log('Creating new user...');
            const hash = await bcrypt.hash(password, 10);
            await connection.execute(
                'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
                [name, email, hash, role, 'ACTIVE']
            );
        }

        console.log(`Rider Account Ready:\nEmail: ${email}\nPassword: ${password}`);
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

createRider();
