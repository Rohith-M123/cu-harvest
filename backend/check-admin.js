
import { pool } from './src/config/database.js';

async function checkAdmin() {
    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', ['admin@cu-harvest.com']);
        console.log('Admin User in DB:', users);

        if (users.length > 0) {
            console.log('Admin Role:', users[0].role);
            console.log('Password Hash:', users[0].password_hash);
        } else {
            console.log('Admin user NOT found.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAdmin();
