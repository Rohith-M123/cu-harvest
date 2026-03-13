import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Category from '../models/Category.js';
import InventoryLog from '../models/InventoryLog.js';
import AdminLog from '../models/AdminLog.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

// Admin dashboard overview
export const getDashboardStats = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const usersTotal = await User.countDocuments({ role: 'USER' });
      const productsTotal = await Product.countDocuments({ is_active: true });
      const ordersTotal = await Order.countDocuments();
      
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayOrders = await Order.countDocuments({ created_at: { $gte: startOfToday } });

      const activeRiders = await User.countDocuments({ role: 'RIDER', is_online: true });

      const completedOrdersResult = await Order.aggregate([
        { $match: { payment_status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$total_amount' } } }
      ]);
      const revenueTotal = completedOrdersResult.length > 0 ? completedOrdersResult[0].total : 0;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentOrdersTotal = await Order.countDocuments({ created_at: { $gte: sevenDaysAgo } });

      const lowStockTotal = await Product.countDocuments({ stock_quantity: { $lte: 10 }, is_active: true });

      const ordersByStatusRaw = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const ordersByStatus = ordersByStatusRaw.map(s => ({ status: s._id, count: s.count }));

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const salesByCategoryRaw = await Category.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'category_id',
            as: 'products'
          }
        },
        { $unwind: { path: '$products', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'orderitems',
            localField: 'products._id',
            foreignField: 'product_id',
            as: 'order_items'
          }
        },
        { $unwind: { path: '$order_items', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'orders',
            localField: 'order_items.order_id',
            foreignField: '_id',
            as: 'orders'
          }
        },
        { $unwind: { path: '$orders', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { 'orders.created_at': { $gte: thirtyDaysAgo } },
              { 'orders': { $exists: false } }
            ]
          }
        },
        {
          $group: {
            _id: { id: '$_id', name: '$name' },
            total_sales: { $sum: { $ifNull: ['$order_items.total_price', 0] } }
          }
        },
        { $sort: { total_sales: -1 } }
      ]);

      const salesByCategory = salesByCategoryRaw.map(s => ({
        category: s._id.name,
        total_sales: s.total_sales
      }));

      // Top selling products
      const topSellingProductsRaw = await OrderItem.aggregate([
         { $group: { _id: '$product_id', total_sold: { $sum: '$quantity' } } },
         { $sort: { total_sold: -1 } },
         { $limit: 5 },
         { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product_info' } },
         { $unwind: '$product_info' }
      ]);
      const topSellingProducts = topSellingProductsRaw.map(p => ({
         name: p.product_info.name,
         total_sold: p.total_sold,
         image_url: p.product_info.image_url
      }));

      res.status(200).json({
        success: true,
        stats: {
          totalOrders: ordersTotal,
          todayOrders: todayOrders,
          totalRevenue: parseFloat(revenueTotal.toFixed(2)),
          activeRiders: activeRiders,
          topSellingProducts,
          total_users: usersTotal,
          total_products: productsTotal,
          recent_orders: recentOrdersTotal,
          low_stock_products: lowStockTotal,
          orders_by_status: ordersByStatus,
          sales_by_category: salesByCategory
        }
      });
      
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Get inventory overview
export const getInventoryOverview = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { category_id, low_stock = false } = req.query;
      
      const query = { is_active: true };
      if (category_id) query.category_id = category_id;
      if (low_stock === 'true' || low_stock === true) {
        query.stock_quantity = { $lte: 10 };
      }
      
      const products = await Product.find(query)
        .populate('category_id', 'name')
        .sort({ stock_quantity: 1, name: 1 });

      const mappedProducts = products.map(p => {
        const pObj = p.toJSON();
        return {
          ...pObj,
          category_name: p.category_id ? p.category_id.name : null,
          category_id: p.category_id ? p.category_id._id : null
        };
      });

      const categorySummaryRaw = await Category.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'category_id',
            pipeline: [{ $match: { is_active: true } }],
            as: 'products'
          }
        },
        {
          $project: {
            category: '$name',
            product_count: { $size: '$products' },
            total_stock: { $sum: '$products.stock_quantity' }
          }
        },
        { $sort: { category: 1 } }
      ]);
      
      res.status(200).json({
        success: true,
        products: mappedProducts,
        category_summary: categorySummaryRaw
      });
      
    } catch (error) {
      console.error('Get inventory overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Update product stock
export const updateProductStock = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { stock_quantity, reason } = req.body;
      
      if (stock_quantity === undefined || stock_quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid stock quantity is required'
        });
      }
      
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      
      const oldStock = product.stock_quantity;
      const newStock = stock_quantity;
      const quantityChange = newStock - oldStock;
      
      product.stock_quantity = newStock;
      await product.save();
      
      const changeType = quantityChange > 0 ? 'STOCK_IN' : 
                        quantityChange < 0 ? 'STOCK_OUT' : 'ADJUSTMENT';
      
      await InventoryLog.create({
        product_id: id,
        change_type: changeType,
        quantity_change: quantityChange,
        reason: reason || 'Manual stock update',
        created_by: req.user.id
      });
      
      await AdminLog.create({
        admin_id: req.user.id,
        action_type: 'UPDATE_PRODUCT_STOCK',
        table_name: 'products',
        record_id: id,
        old_values: { stock_quantity: oldStock },
        new_values: { stock_quantity: newStock }
      });
      
      res.status(200).json({
        success: true,
        message: 'Product stock updated successfully',
        product: {
          id,
          name: product.name,
          old_stock: oldStock,
          new_stock: newStock,
          change: quantityChange
        }
      });
      
    } catch (error) {
      console.error('Update product stock error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Get inventory logs
export const getInventoryLogs = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { product_id, change_type, limit = 50, page = 1 } = req.query;
      
      const query = {};
      if (product_id) query.product_id = product_id;
      if (change_type) query.change_type = change_type;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const logsRaw = await InventoryLog.find(query)
        .populate('product_id', 'name')
        .populate('created_by', 'name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));
        
      const total = await InventoryLog.countDocuments(query);
      
      const logs = logsRaw.map(l => ({
        ...l.toJSON(),
        product_name: l.product_id ? l.product_id.name : null,
        admin_name: l.created_by ? l.created_by.name : null,
      }));
      
      res.status(200).json({
        success: true,
        logs,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error('Get inventory logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Get admin activity logs
export const getAdminLogs = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { admin_id, action_type, limit = 50, page = 1 } = req.query;
      
      const query = {};
      if (admin_id) query.admin_id = admin_id;
      if (action_type) query.action_type = action_type;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const logsRaw = await AdminLog.find(query)
        .populate('admin_id', 'name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));
        
      const total = await AdminLog.countDocuments(query);

      const logs = logsRaw.map(l => ({
        ...l.toJSON(),
        admin_name: l.admin_id ? l.admin_id.name : null
      }));
      
      res.status(200).json({
        success: true,
        logs,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error('Get admin logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Create new category
export const createCategory = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { name, description, image_url } = req.body;
      
      if (!name) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }
      
      const existing = await Category.findOne({ name });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Category with this name already exists' });
      }
      
      const newCategory = new Category({ name, description, image_url });
      await newCategory.save();
      
      await AdminLog.create({
        admin_id: req.user.id,
        action_type: 'CREATE_CATEGORY',
        table_name: 'categories',
        record_id: newCategory.id,
        new_values: { name, description, image_url }
      });
      
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        category: newCategory
      });
      
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Get order heatmap locations
export const getOrderLocations = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      // Find orders that have a delivery_location set
      const orders = await Order.find(
        { 'delivery_location.latitude': { $exists: true }, 'delivery_location.longitude': { $exists: true } },
        'order_number delivery_location status'
      );

      res.status(200).json({
        success: true,
        locations: orders.map(o => ({
           order_id: o._id,
           order_number: o.order_number,
           latitude: o.delivery_location.latitude,
           longitude: o.delivery_location.longitude,
           status: o.status
        }))
      });
    } catch (error) {
      console.error('Get order locations error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
];