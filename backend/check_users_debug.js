import { pool } from './src/config/database.js';

async function checkUsers() {
    try {
        const [users] = await pool.execute('SELECT id, name, email, role, status FROM users');
        console.log('Users found:', users.length);
        console.table(users);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsers();
