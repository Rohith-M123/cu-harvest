import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const setupDatabase = async () => {
  try {
    console.log('🔧 Setting up CU Harvest Database...');

    // Create connection without specifying database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Molli@1020',
      port: process.env.DB_PORT || 3306
    });

    // Create database
    await connection.query('CREATE DATABASE IF NOT EXISTS cu_harvest');
    console.log('✅ Database cu_harvest created successfully');

    // Use the database
    await connection.query('USE cu_harvest');

    // Read and execute schema
    const fs = await import('fs');
    const path = await import('path');

    const schemaPath = path.resolve('sql', 'schema.sql');
    const seedPath = path.resolve('sql', 'seed_data.sql');

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    // Execute schema statements
    const schemaStatements = schemaSQL.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--') && !stmt.includes('CREATE DATABASE') && !stmt.includes('USE'));
    for (const statement of schemaStatements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
        } catch (err) {
          if (!err.message.includes('already exists') && !err.message.includes('Duplicate')) {
            console.error('Schema error:', err.message);
            throw err;
          }
        }
      }
    }
    console.log('✅ Database schema executed successfully');

    // Execute seed data statements
    // Remove comments and split
    const seedSQLClean = seedSQL.replace(/--.*$/gm, '');
    const seedStatements = seedSQLClean.split(';').filter(stmt => {
      const trimmed = stmt.trim();
      return trimmed && !trimmed.startsWith('USE');
    });

    for (const statement of seedStatements) {
      if (statement.trim()) {
        try {
          console.log(`Executing SQL: ${statement.trim().substring(0, 50)}...`);
          await connection.query(statement);
        } catch (err) {
          if (!err.message.includes('Duplicate entry')) {
            console.error('Seed data error:', err.message);
            throw err;
          }
        }
      }
    }
    console.log('✅ Seed data inserted successfully');

    await connection.end();
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Default Credentials:');
    console.log('   Admin Email: admin@cu-harvest.com');
    console.log('   Admin Password: admin123');
    console.log('   User Email: john@example.com');
    console.log('   User Password: admin123');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    process.exit(1);
  }
};

setupDatabase();