
import { Product, Category } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Vegetables', image: 'veg logo.jpeg' },
  { id: '2', name: 'Fruits', image: 'fruits logo.jpeg' },
  { id: '3', name: 'Dairy & Bread', image: 'dairy&bread.jpeg' },
  { id: '4', name: 'Snacks', image: 'snacks logoo.jpeg' },
  { id: '5', name: 'Beverages', image: 'beverages logo.jpeg' },
  { id: '6', name: 'Personal Care', image: 'personal car logo.jpeg' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Fresh Spinach',
    category: 'Vegetables',
    price: 20,
    originalPrice: 25,
    discount: 20,
    stock: 50,
    unit: '250g',
    image: "/spinach.jpeg",
    description: 'Fresh organic spinach leaves, washed and ready to cook.'
  },
  {
    id: 'p2',
    name: 'Organic Bananas',
    category: 'Fruits',
    price: 45,
    originalPrice: 50,
    discount: 10,
    stock: 100,
    unit: '1 dozen',
    image: "/banana.jpeg",
    description: 'Sweet and ripe organic bananas.'
  },
  {
    id: 'p3',
    name: 'Full Cream Milk',
    category: 'Dairy & Bread',
    price: 33,
    originalPrice: 35,
    discount: 5,
    stock: 200,
    unit: '500ml',
    image: "/milk.jpeg",
    description: 'Pasteurized full cream milk.'
  },
  {
    id: 'p4',
    name: 'Potato Chips',
    category: 'Snacks',
    price: 20,
    originalPrice: 20,
    discount: 0,
    stock: 150,
    unit: '50g',
    image: "/chips.jpeg",
    description: 'Crispy salted potato chips.'
  },
  {
    id: 'p5',
    name: 'Coca Cola',
    category: 'Beverages',
    price: 40,
    originalPrice: 45,
    discount: 11,
    stock: 80,
    unit: '750ml',
    image: "/coco cola.jpeg",
    description: 'Refreshing carbonated soft drink.'
  },
  {
    id: 'p6',
    name: 'Red Onions',
    category: 'Vegetables',
    price: 40,
    originalPrice: 45,
    discount: 11,
    stock: 300,
    unit: '1kg',
    image: "/onions.jpeg",
    description: 'Fresh red onions directly from farms.'
  }
];
