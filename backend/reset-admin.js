
import { pool } from './src/config/database.js';
import { hashPassword, comparePassword } from './src/utils/password.js';

async function resetAdmin() {
    try {
        const newPassword = 'admin123';
        const hashedPassword = await hashPassword(newPassword);

        console.log('Resetting admin password...');
        await pool.execute(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [hashedPassword, 'admin@cu-harvest.com']
        );
        console.log('Admin password updated.');

        // Verify
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', ['admin@cu-harvest.com']);
        const user = users[0];
        const isMatch = await comparePassword(newPassword, user.password_hash);
        console.log(`Password verification for 'admin123': ${isMatch}`);

        if (isMatch) {
            console.log('✅ Admin login issue resolved.');
        } else {
            console.log('❌ Password mismatch despite update.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetAdmin();
