import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { hashPassword } from './src/utils/password.js';

dotenv.config();

const resetMongoAdmin = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cu_harvest';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const email = 'admin@cu-harvest.com';
    const newPassword = 'admin123';
    
    console.log(`Hashing password for ${email}...`);
    const hashedPassword = await hashPassword(newPassword);

    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: email },
      { 
        $set: { 
          password_hash: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE'
        } 
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log(`✅ Admin user created with ID: ${result.upsertedId}`);
    } else if (result.modifiedCount > 0) {
      console.log('✅ Admin password and role updated successfully.');
    } else {
      console.log('ℹ️ Admin user already had these settings.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting MongoDB admin:', error);
    process.exit(1);
  }
};

resetMongoAdmin();
