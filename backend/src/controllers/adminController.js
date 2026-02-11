import { pool } from '../config/database.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

// Admin dashboard overview
export const getDashboardStats = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      // Get total users
      const [usersResult] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE role = "USER"');
      
      // Get total products
      const [productsResult] = await pool.execute('SELECT COUNT(*) as total FROM products WHERE is_active = TRUE');
      
      // Get total orders
      const [ordersResult] = await pool.execute('SELECT COUNT(*) as total FROM orders');
      
      // Get total revenue
      const [revenueResult] = await pool.execute('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = "COMPLETED"');
      
      // Get recent orders (last 7 days)
      const [recentOrdersResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM orders 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      );
      
      // Get low stock products
      const [lowStockResult] = await pool.execute('SELECT COUNT(*) as total FROM products WHERE stock_quantity <= 10 AND is_active = TRUE');
      
      // Get orders by status
      const [ordersByStatus] = await pool.execute(
        `SELECT status, COUNT(*) as count 
         FROM orders 
         GROUP BY status`
      );
      
      // Get sales by category (last 30 days)
      const [salesByCategory] = await pool.execute(
        `SELECT c.name as category, COALESCE(SUM(oi.total_price), 0) as total_sales
         FROM categories c
         LEFT JOIN products p ON c.id = p.category_id
         LEFT JOIN order_items oi ON p.id = oi.product_id
         LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY c.id, c.name
         ORDER BY total_sales DESC`
      );
      
      res.status(200).json({
        success: true,
        stats: {
          total_users: usersResult[0].total,
          total_products: productsResult[0].total,
          total_orders: ordersResult[0].total,
          total_revenue: parseFloat(revenueResult[0].total),
          recent_orders: recentOrdersResult[0].total,
          low_stock_products: lowStockResult[0].total,
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
      
      let query = `
        SELECT p.id, p.name, p.stock_quantity, p.unit, p.price,
               p.created_at, c.name as category_name, c.id as category_id
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = TRUE
      `;
      
      const params = [];
      
      if (category_id) {
        query += ' AND c.id = ?';
        params.push(category_id);
      }
      
      if (low_stock) {
        query += ' AND p.stock_quantity <= 10';
      }
      
      query += ' ORDER BY p.stock_quantity ASC, p.name';
      
      const [products] = await pool.execute(query, params);
      
      // Get category summary
      const [categorySummary] = await pool.execute(
        `SELECT c.name as category, COUNT(p.id) as product_count,
                SUM(p.stock_quantity) as total_stock
         FROM categories c
         LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
         GROUP BY c.id, c.name
         ORDER BY c.name`
      );
      
      res.status(200).json({
        success: true,
        products,
        category_summary: categorySummary
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
      
      // Get current product info
      const [products] = await pool.execute(
        'SELECT id, name, stock_quantity FROM products WHERE id = ?',
        [id]
      );
      
      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      const product = products[0];
      const oldStock = product.stock_quantity;
      const newStock = stock_quantity;
      const quantityChange = newStock - oldStock;
      
      // Update stock
      await pool.execute(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [newStock, id]
      );
      
      // Log inventory change
      const changeType = quantityChange > 0 ? 'STOCK_IN' : 
                        quantityChange < 0 ? 'STOCK_OUT' : 'ADJUSTMENT';
      
      await pool.execute(
        'INSERT INTO inventory_logs (product_id, change_type, quantity_change, reason, created_by) VALUES (?, ?, ?, ?, ?)',
        [id, changeType, quantityChange, reason || 'Manual stock update', req.user.id]
      );
      
      // Log admin action
      await pool.execute(
        'INSERT INTO admin_logs (admin_id, action_type, table_name, record_id, old_values, new_values) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, 'UPDATE_PRODUCT_STOCK', 'products', id, 
         JSON.stringify({stock_quantity: oldStock}), 
         JSON.stringify({stock_quantity: newStock})]
      );
      
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
      
      let query = `
        SELECT il.id, il.change_type, il.quantity_change, il.reason, il.created_at,
               p.name as product_name, p.id as product_id,
               u.name as admin_name, u.id as admin_id
        FROM inventory_logs il
        JOIN products p ON il.product_id = p.id
        JOIN users u ON il.created_by = u.id
      `;
      
      const params = [];
      const whereConditions = [];
      
      if (product_id) {
        whereConditions.push('il.product_id = ?');
        params.push(product_id);
      }
      
      if (change_type) {
        whereConditions.push('il.change_type = ?');
        params.push(change_type);
      }
      
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      query += ' ORDER BY il.created_at DESC';
      
      // Add pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const [logs] = await pool.execute(query, params);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM inventory_logs il';
      const countParams = [];
      
      if (whereConditions.length > 0) {
        countQuery += ' WHERE ' + whereConditions.join(' AND ');
        countParams.push(...params.slice(0, whereConditions.length));
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      res.status(200).json({
        success: true,
        logs,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
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
      
      let query = `
        SELECT al.id, al.action_type, al.table_name, al.record_id, 
               al.old_values, al.new_values, al.created_at,
               u.name as admin_name, u.id as admin_id
        FROM admin_logs al
        JOIN users u ON al.admin_id = u.id
      `;
      
      const params = [];
      const whereConditions = [];
      
      if (admin_id) {
        whereConditions.push('al.admin_id = ?');
        params.push(admin_id);
      }
      
      if (action_type) {
        whereConditions.push('al.action_type = ?');
        params.push(action_type);
      }
      
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      query += ' ORDER BY al.created_at DESC';
      
      // Add pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const [logs] = await pool.execute(query, params);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM admin_logs al';
      const countParams = [];
      
      if (whereConditions.length > 0) {
        countQuery += ' WHERE ' + whereConditions.join(' AND ');
        countParams.push(...params.slice(0, whereConditions.length));
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      res.status(200).json({
        success: true,
        logs,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
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
        return res.status(400).json({
          success: false,
          message: 'Category name is required'
        });
      }
      
      // Check if category already exists
      const [existingCategories] = await pool.execute(
        'SELECT id FROM categories WHERE name = ?',
        [name]
      );
      
      if (existingCategories.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
      
      const [result] = await pool.execute(
        'INSERT INTO categories (name, description, image_url) VALUES (?, ?, ?)',
        [name, description, image_url]
      );
      
      // Log admin action
      await pool.execute(
        'INSERT INTO admin_logs (admin_id, action_type, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'CREATE_CATEGORY', 'categories', result.insertId, JSON.stringify({name, description, image_url})]
      );
      
      const [categories] = await pool.execute(
        'SELECT id, name, description, image_url, created_at FROM categories WHERE id = ?',
        [result.insertId]
      );
      
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        category: categories[0]
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