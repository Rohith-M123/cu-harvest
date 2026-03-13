import express from 'express';
import { getProducts, getProductById, getCategories, createProduct, 
         updateProduct, deleteProduct, getLowStockProducts } from '../controllers/productController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Admin routes
router.post('/', authenticate, authorizeRoles(['ADMIN']), createProduct);
router.put('/:id', authenticate, authorizeRoles(['ADMIN']), updateProduct);
router.delete('/:id', authenticate, authorizeRoles(['ADMIN']), deleteProduct);
router.get('/admin/low-stock', authenticate, authorizeRoles(['ADMIN']), getLowStockProducts);

export default router;