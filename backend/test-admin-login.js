// Direct database test for admin login
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const testAdminLogin = async () => {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Molli@1020',
      database: process.env.DB_NAME || 'cu_harvest',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('🔍 Testing Admin Login Process...\n');
    
    // Test 1: Check if user exists
    const [users] = await connection.execute(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
      ['workingadmin@example.com']
    );
    
    console.log('1️⃣ User lookup:', users.length > 0 ? 'FOUND' : 'NOT FOUND');
    if (users.length > 0) {
      const user = users[0];
      console.log('   Name:', user.name);
      console.log('   Role:', user.role);
      console.log('   Password hash length:', user.password_hash.length);
      
      // Test 2: Verify password
      const isPasswordValid = await bcrypt.compare('admin123', user.password_hash);
      console.log('2️⃣ Password verification:', isPasswordValid ? '✅ VALID' : '❌ INVALID');
      
      if (isPasswordValid) {
        console.log('🎉 ADMIN LOGIN SUCCESSFUL!');
      } else {
        console.log('❌ Password mismatch detected');
        console.log('   Stored hash:', user.password_hash);
        console.log('   Expected for "admin123":', await bcrypt.hash('admin123', 10));
      }
    } else {
      console.log('❌ Admin user not found in database');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testAdminLogin();