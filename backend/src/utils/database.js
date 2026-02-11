import { pool } from '../config/database.js';

// Initialize database with schema and seed data
export const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');
    
    // Read and execute schema file
    const fs = await import('fs');
    const path = await import('path');
    
    const schemaPath = path.resolve('sql', 'schema.sql');
    const seedPath = path.resolve('sql', 'seed_data.sql');
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    // Split and execute schema statements
    const schemaStatements = schemaSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of schemaStatements) {
      if (statement.trim()) {
        await pool.execute(statement);
      }
    }
    
    console.log('✅ Database schema created successfully');
    
    // Split and execute seed data statements
    const seedStatements = seedSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of seedStatements) {
      if (statement.trim()) {
        await pool.execute(statement);
      }
    }
    
    console.log('✅ Seed data inserted successfully');
    console.log('🎉 Database initialization completed!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

// Create database if it doesn't exist
export const createDatabaseIfNotExists = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('CREATE DATABASE IF NOT EXISTS cu_harvest');
    connection.release();
    console.log('✅ Database cu_harvest ensured to exist');
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
  }
};