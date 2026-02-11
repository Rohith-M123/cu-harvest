import express from 'express';
import { getProducts, getProductById, getCategories, createProduct, 
         updateProduct, deleteProduct, getLowStockProducts } from '../controllers/productController.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Admin routes
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.get('/admin/low-stock', getLowStockProducts);

export default router;