import express from 'express';
import { getDashboardStats, getInventoryOverview, updateProductStock, 
         getInventoryLogs, getAdminLogs, createCategory } from '../controllers/adminController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, authorizeAdmin);

// Dashboard routes
router.get('/dashboard', getDashboardStats);

// Inventory management
router.get('/inventory', getInventoryOverview);
router.put('/inventory/product/:id/stock', updateProductStock);
router.get('/inventory/logs', getInventoryLogs);

// Admin logs
router.get('/logs', getAdminLogs);

// Category management
router.post('/categories', createCategory);

export default router;