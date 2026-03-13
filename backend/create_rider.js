async function updateRiderEmail() {
    try {
        const oldEmail = 'rider@cuharvest.com';
        const newEmail = 'rider@cu-harvest.com'; // With hyphen

        console.log(`Updating ${oldEmail} to ${newEmail}...`);

        // Check if new email already exists (from user's previous attempt)
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [newEmail]);
        if (existing.length > 0) {
            console.log(`${newEmail} already exists. Updating its role to RIDER directly.`);
            await pool.execute('UPDATE users SET role = "RIDER" WHERE email = ?', [newEmail]);
        } else {
            // Rename the one we created
            const [result] = await pool.execute('UPDATE users SET email = ? WHERE email = ?', [newEmail, oldEmail]);
            if (result.affectedRows === 0) {
                console.log("Old rider email not found. Creating new one...");
                const { hashPassword } = await import('./src/utils/password.js');
                const hashed = await hashPassword('password123');
                await pool.execute(
                    'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
                    ['Test Rider', newEmail, hashed, 'RIDER', 'ACTIVE']
                );
            }
        }

        console.log('Rider email update complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateRiderEmail();
