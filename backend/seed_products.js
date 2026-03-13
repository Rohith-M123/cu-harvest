import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './src/models/Category.js';
import Product from './src/models/Product.js';

dotenv.config();

const INITIAL_PRODUCTS = [
  { name: 'Fresh Spinach', category: 'Vegetables', price: 20, originalPrice: 25, discount: 20, stock: 50, unit: '250g', image: "/spinach.jpeg", description: 'Fresh organic spinach leaves, washed and ready to cook.' },
  { name: 'Organic Bananas', category: 'Fruits', price: 45, originalPrice: 50, discount: 10, stock: 100, unit: '1 dozen', image: "/banana.jpeg", description: 'Sweet and ripe organic bananas.' },
  { name: 'Full Cream Milk', category: 'Dairy & Bread', price: 33, originalPrice: 35, discount: 5, stock: 200, unit: '500ml', image: "/milk.jpeg", description: 'Pasteurized full cream milk.' },
  { name: 'Potato Chips', category: 'Snacks', price: 20, originalPrice: 20, discount: 0, stock: 150, unit: '50g', image: "/chips.jpeg", description: 'Crispy salted potato chips.' },
  { name: 'Coca Cola', category: 'Beverages', price: 40, originalPrice: 45, discount: 11, stock: 80, unit: '750ml', image: "/coco cola.jpeg", description: 'Refreshing carbonated soft drink.' },
  { name: 'Red Onions', category: 'Vegetables', price: 40, originalPrice: 45, discount: 11, stock: 300, unit: '1kg', image: "/onions.jpeg", description: 'Fresh red onions directly from farms.' }
];

async function seedProducts() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cu_harvest';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    for (const prod of INITIAL_PRODUCTS) {
      const category = await Category.findOne({ name: prod.category });
      if (!category) {
        console.error(`❌ Category not found for product: ${prod.name}`);
        continue;
      }

      const existing = await Product.findOne({ name: prod.name });
      if (!existing) {
        await Product.create({
          name: prod.name,
          category_id: category._id,
          price: prod.price,
          original_price: prod.originalPrice,
          discount_percent: prod.discount,
          stock_quantity: prod.stock,
          unit: prod.unit,
          image_url: prod.image,
          description: prod.description
        });
        console.log(`Created product: ${prod.name}`);
      } else {
        console.log(`Product already exists: ${prod.name}`);
      }
    }
    console.log('✅ Products seeding completed');
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedProducts();
