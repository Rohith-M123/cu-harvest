import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const createAdmin = async () => {
    const mongoUri = process.env.MONGO_URI;
    const adminEmail = 'admin@cu-harvest.com';
    const adminPassword = 'admin123'; // The default password we've been using

    if (!mongoUri) {
        console.error('❌ MONGO_URI is not defined in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('ℹ️ Admin user already exists');
            if (existingAdmin.role !== 'ADMIN') {
                existingAdmin.role = 'ADMIN';
                await existingAdmin.save();
                console.log('✅ Updated existing user role to ADMIN');
            }
        } else {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const newAdmin = new User({
                name: 'System Admin',
                email: adminEmail,
                password_hash: hashedPassword,
                role: 'ADMIN',
                phone: '0000000000',
                status: 'ACTIVE'
            });

            await newAdmin.save();
            console.log('✅ Admin user created successfully!');
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
        }

    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createAdmin();
