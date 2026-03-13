import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Toggle Online/Offline Status
router.put('/status', authenticate, authorizeRoles(['RIDER']), async (req, res) => {
    try {
        const { is_online } = req.body;
        const userId = req.user.id;

        await User.findByIdAndUpdate(userId, { is_online });

        res.status(200).json({
            success: true,
            message: `Status updated to ${is_online ? 'Online' : 'Offline'}`
        });

    } catch (error) {
        console.error('Update rider status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get Assigned Orders
router.get('/orders', authenticate, authorizeRoles(['RIDER']), async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.find({ rider_id: userId })
            .populate('user_id')
            .sort({ assigned_at: -1, created_at: -1 });

        const mappedOrders = [];
        for (const o of orders) {
            const items = await OrderItem.find({ order_id: o._id }).populate('product_id', 'name image_url');
            const oObj = o.toJSON();
            mappedOrders.push({
                ...oObj,
                user_name: o.user_id ? o.user_id.name : null,
                user_phone: o.user_id ? o.user_id.phone : null,
                user_email: o.user_id ? o.user_id.email : null,
                items: items.map(i => ({
                    id: i._id,
                    order_id: i.order_id,
                    quantity: i.quantity,
                    image_url: i.product_id ? i.product_id.image_url : null,
                    name: i.product_id ? i.product_id.name : null,
                }))
            });
        }

        res.status(200).json({
            success: true,
            orders: mappedOrders
        });

    } catch (error) {
        console.error('Get rider orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update Rider Location
router.put('/location', authenticate, authorizeRoles(['RIDER']), async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const riderId = req.user.id;

        if (latitude === undefined || longitude === undefined) {
             return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
        }

        const location = await import('../models/RiderLocation.js').then(m => m.default);

        await location.findOneAndUpdate(
            { rider_id: riderId },
            { latitude, longitude, last_updated: Date.now() },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, message: 'Location updated successfully' });
    } catch (error) {
        console.error('Update rider location error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get Rider Earnings
router.get('/earnings', authenticate, authorizeRoles(['RIDER']), async (req, res) => {
    try {
        const riderId = req.user.id;
        
        // Sum total delivery_fee for DELIVERED orders
        const mongoose = await import('mongoose').then(m => m.default);
        const result = await Order.aggregate([
            { $match: { rider_id: new mongoose.Types.ObjectId(riderId), status: 'DELIVERED' } },
            { $group: { _id: null, totalEarnings: { $sum: '$delivery_fee' } } }
        ]);

        const totalEarnings = result.length > 0 ? result[0].totalEarnings : 0;

        res.status(200).json({
            success: true,
            earnings: {
                total_earnings: totalEarnings
            }
        });
    } catch (error) {
        console.error('Get rider earnings error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get Rider Trips (Completed deliveries)
router.get('/trips', authenticate, authorizeRoles(['RIDER']), async (req, res) => {
    try {
        const riderId = req.user.id;

        const trips = await Order.find({ rider_id: riderId, status: 'DELIVERED' })
            .populate('user_id', 'name phone')
            .sort({ updated_at: -1 });

        res.status(200).json({
            success: true,
            trips: trips.map(t => ({
               id: t._id,
               order_number: t.order_number,
               delivery_fee: t.delivery_fee,
               total_amount: t.total_amount,
               delivered_at: t.updated_at,
               customer_name: t.user_id ? t.user_id.name : null,
               customer_phone: t.user_id ? t.user_id.phone : null
            }))
        });

    } catch (error) {
        console.error('Get rider trips error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;
