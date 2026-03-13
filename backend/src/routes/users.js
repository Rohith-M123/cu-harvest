import express from 'express';
import User from '../models/User.js';
import UserAddress from '../models/UserAddress.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import CartItem from '../models/CartItem.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get user addresses
router.get('/addresses', authenticate, async (req, res) => {
  try {
    const addresses = await UserAddress.find({ user_id: req.user.id })
      .sort({ is_default: -1, created_at: -1 });

    res.status(200).json({
      success: true,
      addresses
    });

  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add new address
router.post('/addresses', authenticate, async (req, res) => {
  try {
    const { address_line1, address_line2, city, state, zip_code, is_default } = req.body;
    const userId = req.user.id;

    if (is_default) {
      await UserAddress.updateMany({ user_id: userId }, { is_default: false });
    }

    const newAddress = new UserAddress({
      user_id: userId,
      address_line1,
      address_line2,
      city,
      state,
      zip_code,
      is_default: is_default || false
    });

    await newAddress.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address: newAddress
    });

  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update address
router.put('/addresses/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const address = await UserAddress.findOne({ _id: id, user_id: userId });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (updateData.is_default) {
      await UserAddress.updateMany({ user_id: userId, _id: { $ne: id } }, { is_default: false });
    }

    Object.assign(address, updateData);
    await address.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address
    });

  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete address
router.delete('/addresses/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const address = await UserAddress.findOne({ _id: id, user_id: userId });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (address.is_default) {
      const nextAddress = await UserAddress.findOne({ user_id: userId, _id: { $ne: id } }).sort({ created_at: 1 });
      if (nextAddress) {
        nextAddress.is_default = true;
        await nextAddress.save();
      }
    }

    await UserAddress.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user order history
router.get('/orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user.id }).sort({ created_at: -1 });

    const mappedOrders = [];
    for (const o of orders) {
      const itemsCount = await OrderItem.countDocuments({ order_id: o._id });
      mappedOrders.push({
        ...o.toJSON(),
        items_count: itemsCount,
      });
    }

    res.status(200).json({
      success: true,
      orders: mappedOrders
    });

  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get order details
router.get('/orders/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: id, user_id: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const items = await OrderItem.find({ order_id: id }).populate('product_id', 'name image_url unit');

    const mappedItems = items.map(i => {
      const iObj = i.toJSON();
      return {
        ...iObj,
        name: i.product_id ? i.product_id.name : null,
        image_url: i.product_id ? i.product_id.image_url : null,
        unit: i.product_id ? i.product_id.unit : null
      };
    });

    res.status(200).json({
      success: true,
      order: {
        ...order.toJSON(),
        items: mappedItems
      }
    });

  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all riders (Admin only)
router.get('/riders', authenticate, authorizeRoles(['ADMIN']), async (req, res) => {
  try {
    const riders = await User.find({ role: 'RIDER' })
      .select('id name email phone is_online created_at')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      riders
    });
  } catch (error) {
    console.error('Get riders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all users (Admin only)
router.get('/', authenticate, authorizeRoles(['ADMIN']), async (req, res) => {
  try {
    const users = await User.find()
      .select('id name email role created_at status firebase_uid')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Toggle User Status (Admin only)
router.put('/:id/status', authenticate, authorizeRoles(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use ACTIVE or SUSPENDED.'
      });
    }

    await User.findByIdAndUpdate(id, { status });

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Toggle User Role (Admin only)
router.put('/:id/role', authenticate, authorizeRoles(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN', 'RIDER'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Use USER, ADMIN, or RIDER.'
      });
    }

    await User.findByIdAndUpdate(id, { role });

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete User (Admin only)
router.delete('/:id', authenticate, authorizeRoles(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    // Delete dependent records
    await CartItem.deleteMany({ user_id: id });
    await UserAddress.deleteMany({ user_id: id });
    
    // Find all orders by user and delete their items + orders
    const orders = await Order.find({ user_id: id });
    const orderIds = orders.map(o => o._id);
    if (orderIds.length > 0) {
      await OrderItem.deleteMany({ order_id: { $in: orderIds } });
      await Order.deleteMany({ user_id: id });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'User permanently deleted' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;