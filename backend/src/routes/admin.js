import express from 'express';
import {
    getDashboardStats, getInventoryOverview, updateProductStock,
    getInventoryLogs, getAdminLogs, createCategory, getOrderLocations
} from '../controllers/adminController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, authorizeRoles(['ADMIN']));

// Dashboard routes
router.get('/dashboard', getDashboardStats);
router.get('/analytics', getDashboardStats); // Fallback for the prompt's requested path
router.get('/order-locations', getOrderLocations);

// Inventory management
router.get('/inventory', getInventoryOverview);
router.put('/inventory/product/:id/stock', updateProductStock);
router.get('/inventory/logs', getInventoryLogs);

// Admin logs
router.get('/logs', getAdminLogs);

// Category management
router.post('/categories', createCategory);

export default router;