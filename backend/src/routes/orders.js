import express from 'express';
import { createOrder, getUserOrders, getOrderDetails, getAllOrders, updateOrderStatus } from '../controllers/orderController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/', authenticate, createOrder);
router.get('/my-orders', authenticate, getUserOrders);
router.get('/my-orders/:id', authenticate, getOrderDetails);

// Admin routes
router.get('/admin/all', authenticate, authorizeAdmin, getAllOrders);
router.put('/admin/:id/status', authenticate, authorizeAdmin, updateOrderStatus);

export default router;