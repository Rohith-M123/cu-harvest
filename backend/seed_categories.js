import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './src/models/Category.js';

dotenv.config();

const INITIAL_CATEGORIES = [
  { name: 'Vegetables', image_url: 'veg logo.jpeg' },
  { name: 'Fruits', image_url: 'fruits logo.jpeg' },
  { name: 'Dairy & Bread', image_url: 'dairy&bread.jpeg' },
  { name: 'Snacks', image_url: 'snacks logoo.jpeg' },
  { name: 'Beverages', image_url: 'beverages logo.jpeg' },
  { name: 'Personal Care', image_url: 'personal car logo.jpeg' }
];

async function seedCategories() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cu_harvest';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    for (const cat of INITIAL_CATEGORIES) {
      const existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        await Category.create(cat);
        console.log(`Created category: ${cat.name}`);
      } else {
        console.log(`Category exists: ${cat.name}`);
      }
    }
    console.log('✅ Categories seeding completed');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedCategories();
