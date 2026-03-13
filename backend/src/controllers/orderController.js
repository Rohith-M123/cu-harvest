import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Product from '../models/Product.js';
import CartItem from '../models/CartItem.js';
import RiderLocation from '../models/RiderLocation.js';
import mongoose from 'mongoose';
import { sendOrderNotification } from '../services/emailService.js';

// Create order
export const createOrder = async (req, res) => {
  try {
    const { items, shipping_address, payment_method, notes, delivery_location, delivery_type, delivery_date, delivery_slot } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    let totalAmount = 0;
    const orderItemsToCreate = [];

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.product_id,
        is_active: true
      });

      if (!product) throw new Error(`Product ${item.product_id} not found`);
      if (product.stock_quantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItemsToCreate.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: itemTotal
      });
      
      product.stock_quantity -= item.quantity;
      await product.save();
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const deliveryFee = 5.00; // Flat fee or calculated later

    const newOrder = new Order({
      user_id: userId,
      order_number: orderNumber,
      total_amount: totalAmount,
      delivery_fee: deliveryFee,
      status: 'PLACED',
      shipping_address,
      delivery_location,
      payment_method,
      notes,
      delivery_type: delivery_type || 'INSTANT',
      delivery_date: delivery_date ? new Date(delivery_date) : null,
      delivery_slot,
    });
    await newOrder.save();
    
    // Set order_id on items and insert
    const finalOrderItems = orderItemsToCreate.map(oi => ({ ...oi, order_id: newOrder._id }));
    await OrderItem.insertMany(finalOrderItems);

    // Clear cart
    await CartItem.deleteMany({ user_id: userId });

    // Send Email via Service Component
    sendOrderNotification(req.user.email, newOrder, 'PLACED');
    sendOrderNotification('mollirohit1020@gmail.com', newOrder, 'PLACED'); // Send to admin

    res.status(201).json({ success: true, message: 'Order placed successfully', orderId: newOrder._id, orderNumber });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { user_id: userId };
    if (status) query.status = status;

    const orders = await Order.find(query).sort({ created_at: -1 });

    res.status(200).json({ success: true, orders });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('user_id', 'name')
      .sort({ created_at: -1 });

    const mappedOrders = orders.map(o => {
      const oObj = o.toJSON();
      return {
        ...oObj,
        user_name: o.user_id ? o.user_id.name : null,
      };
    });

    res.status(200).json({ success: true, orders: mappedOrders });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Assign Order
export const assignOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rider_id } = req.body;

    if (!rider_id) return res.status(400).json({ success: false, message: 'Rider ID required' });

    const order = await Order.findByIdAndUpdate(
      id,
      {
        rider_id,
        status: 'ASSIGNED',
        assigned_at: new Date()
      },
      { new: true }
    ).populate('user_id');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user_id) {
       sendOrderNotification(order.user_id.email, order, 'ASSIGNED');
    }

    res.status(200).json({ success: true, message: 'Order assigned to rider' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Order Status (Rider/Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const validStatuses = ['PLACED', 'VERIFIED', 'ASSIGNED', 'ACCEPTED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(id).populate('user_id');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (userRole === 'RIDER') {
      if (order.rider_id.toString() !== userId.toString()) return res.status(403).json({ success: false, message: 'Not assigned to this order' });

      if (order.status === 'ASSIGNED') {
        if (!['ACCEPTED', 'REJECTED', 'OUT_FOR_DELIVERY'].includes(status)) {
          return res.status(400).json({ success: false, message: 'Invalid transition from ASSIGNED state' });
        }
      } else if (order.status === 'ACCEPTED') {
        if (status !== 'OUT_FOR_DELIVERY') return res.status(400).json({ success: false, message: 'Next step: OUT_FOR_DELIVERY' });
      } else if (order.status === 'OUT_FOR_DELIVERY') {
        if (status !== 'DELIVERED') return res.status(400).json({ success: false, message: 'Next step: DELIVERED' });
      }
    }

    order.status = status;
    await order.save();

    if (order.user_id && ['ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
       sendOrderNotification(order.user_id.email, order, status);
    }

    res.status(200).json({ success: true, message: 'Order status updated' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Rider: Get Assigned Orders
export const getRiderOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { history } = req.query;

    let statusCondition = { $nin: ['DELIVERED', 'CANCELLED', 'REJECTED'] };
    if (history === 'true') {
      statusCondition = { $in: ['DELIVERED', 'CANCELLED', 'REJECTED'] };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const orders = await Order.find({
      rider_id: userId,
      status: statusCondition,
      $or: [
        { delivery_type: 'INSTANT' },
        { 
          delivery_type: 'SCHEDULED', 
          delivery_date: { $lte: today } // Show if today or past (shouldn't be past but just in case)
        }
      ]
    })
    .populate('user_id', 'name')
    .sort({ created_at: -1 });

    const mappedOrders = orders.map(o => {
      const oObj = o.toJSON();
      return {
        ...oObj,
        user_name: o.user_id ? o.user_id.name : null,
      };
    });

    res.status(200).json({ success: true, orders: mappedOrders });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Order Details
export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('user_id', 'name');
    if (!order) return res.status(404).json({ success: false });

    const items = await OrderItem.find({ order_id: id }).populate('product_id', 'name');
    
    const mappedItems = items.map(item => item.toJSON());

    const oObj = order.toJSON();
    const mappedOrder = {
      ...oObj,
      user_name: order.user_id ? order.user_id.name : null,
      items: mappedItems
    };

    res.status(200).json({ success: true, order: mappedOrder });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Live Order Tracking
export const trackOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('rider_id', 'name phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    let riderLocation = null;
    if (order.rider_id) {
       riderLocation = await RiderLocation.findOne({ rider_id: order.rider_id._id });
    }

    res.status(200).json({
       success: true,
       tracking: {
         status: order.status,
         estimated_delivery_time: order.estimated_delivery_time || null,
         rider: order.rider_id ? {
            name: order.rider_id.name,
            phone: order.rider_id.phone,
            location: riderLocation ? {
                 latitude: riderLocation.latitude,
                 longitude: riderLocation.longitude,
                 last_updated: riderLocation.last_updated
            } : null
         } : null
       }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};