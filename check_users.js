import mysql from 'mysql2/promise';

const checkUsers = async () => {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: process.env.DB_PASSWORD || 'Molli@1020',
            database: 'cu_harvest',
            port: 3306
        });

        const [rows] = await connection.query('SELECT id, name, email, role FROM users');
        console.log('Users found:', rows.length);
        rows.forEach(u => {
            console.log(`${u.id}: ${u.name} (${u.email}) - ${u.role}`);
        });

        await connection.end();
    } catch (err) {
        console.error('Error checking users:', err);
    }
};

checkUsers();
