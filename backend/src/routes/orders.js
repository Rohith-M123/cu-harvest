import express from 'express';
import {
    createOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    assignOrder,
    getRiderOrders,
    getOrderDetails,
    trackOrder
} from '../controllers/orderController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Apply Firebase Auth to all order routes
router.use(authenticate);

// User Routes
router.post('/', createOrder);
router.get('/my-orders', getUserOrders);
router.get('/my-orders/:id', getOrderDetails);
router.get('/:id/track', trackOrder);

// Rider Routes
router.get('/rider/assigned', authorizeRoles(['RIDER']), getRiderOrders);

// Admin Routes
router.get('/admin/all', authorizeRoles(['ADMIN']), getAllOrders);
router.put('/admin/:id/assign', authorizeRoles(['ADMIN']), assignOrder);

// Shared Status Update (Rider & Admin)
router.put('/:id/status', authorizeRoles(['ADMIN', 'RIDER']), updateOrderStatus);

export default router;