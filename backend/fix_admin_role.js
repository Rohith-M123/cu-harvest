import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkAdmin() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cu_harvest');
    const user = await User.findOne({ email: 'admin@cu-harvest.com' });
    console.log("Admin User in DB:", user);
    if (user && user.role !== 'ADMIN') {
        user.role = 'ADMIN';
        await user.save();
        console.log("Updated role to ADMIN");
    }
    process.exit(0);
}
checkAdmin();
