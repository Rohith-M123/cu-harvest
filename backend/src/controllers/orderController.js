import { pool } from '../config/database.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';
import { orderSchema } from '../middleware/validation.js';

// Create order
export const createOrder = [
  authenticate,
  async (req, res) => {
    try {
      const { items, shipping_address, payment_method, notes } = req.body;
      const userId = req.user.id;

      // Validate input
      const { error } = orderSchema.validate({ items, shipping_address, payment_method });
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(detail => detail.message)
        });
      }

      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Order must contain at least one item'
        });
      }

      // Start transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Validate products and calculate total
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
          const [products] = await connection.execute(
            'SELECT id, name, price, stock_quantity, is_active FROM products WHERE id = ? AND is_active = TRUE FOR UPDATE',
            [item.product_id]
          );

          if (products.length === 0) {
            throw new Error(`Product with ID ${item.product_id} not found or not available`);
          }

          const product = products[0];

          if (product.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
          }

          const itemTotal = product.price * item.quantity;
          totalAmount += itemTotal;

          orderItems.push({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: product.price,
            total_price: itemTotal,
            product_name: product.name
          });
        }

        // Generate unique order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Create order
        const [orderResult] = await connection.execute(
          `INSERT INTO orders (user_id, order_number, total_amount, shipping_address, 
                              payment_method, notes) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, orderNumber, totalAmount, shipping_address, payment_method, notes]
        );

        const orderId = orderResult.insertId;

        // Create order items and update stock
        for (const item of orderItems) {
          await connection.execute(
            'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
            [orderId, item.product_id, item.quantity, item.unit_price, item.total_price]
          );

          // Update product stock
          await connection.execute(
            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );

          // Log inventory change
          await connection.execute(
            'INSERT INTO inventory_logs (product_id, change_type, quantity_change, reason, created_by) VALUES (?, ?, ?, ?, ?)',
            [item.product_id, 'STOCK_OUT', -item.quantity, `Order #${orderNumber}`, userId]
          );
        }

        // Clear user's cart
        await connection.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);

        // Commit transaction
        await connection.commit();
        connection.release();

        // Get created order details
        const [orders] = await pool.execute(
          `SELECT id, order_number, total_amount, status, shipping_address, 
                  payment_method, payment_status, notes, created_at
           FROM orders WHERE id = ?`,
          [orderId]
        );

        const [orderItemsResult] = await pool.execute(
          `SELECT oi.id, oi.quantity, oi.unit_price, oi.total_price,
                  p.name, p.image_url, p.unit
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [orderId]
        );

        res.status(201).json({
          success: true,
          message: 'Order placed successfully',
          order: {
            ...orders[0],
            items: orderItemsResult
          }
        });

      } catch (error) {
        // Rollback transaction
        await connection.rollback();
        connection.release();
        throw error;
      }

    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Get user orders
export const getUserOrders = [
  authenticate,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, limit = 20, page = 1 } = req.query;

      let query = `
        SELECT o.id, o.order_number, o.total_amount, o.status, o.shipping_address, 
               o.payment_method, o.payment_status, o.notes, o.created_at,
               COUNT(oi.id) as items_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
      `;

      const params = [userId];

      if (status) {
        query += ' AND o.status = ?';
        params.push(status);
      }

      query += ' GROUP BY o.id ORDER BY o.created_at DESC';

      // Add pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [orders] = await pool.execute(query, params);

      if (orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const placeholders = orderIds.map(() => '?').join(',');

        const [items] = await pool.execute(
          `SELECT oi.id, oi.order_id, oi.quantity, p.image_url, p.name 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id IN (${placeholders})`,
          orderIds
        );

        orders.forEach(order => {
          order.items = items.filter(i => i.order_id === order.id).map(i => ({
            id: i.id,
            quantity: i.quantity,
            image: i.image_url,
            name: i.name
          }));
        });
      }

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
      const countParams = [userId];

      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }

      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;

      res.status(200).json({
        success: true,
        orders,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Get order details
export const getOrderDetails = [
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get order details (verify ownership)
      const [orders] = await pool.execute(
        `SELECT o.id, o.order_number, o.total_amount, o.status, o.shipping_address, 
                o.payment_method, o.payment_status, o.notes, o.created_at
         FROM orders o
         WHERE o.id = ? AND o.user_id = ?`,
        [id, userId]
      );

      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const order = orders[0];

      // Get order items
      const [items] = await pool.execute(
        `SELECT oi.id, oi.quantity, oi.unit_price, oi.total_price,
                p.name, p.image_url, p.unit
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [id]
      );

      res.status(200).json({
        success: true,
        order: {
          ...order,
          items
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
  }
];

// Admin: Get all orders
export const getAllOrders = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { status, user_id, limit = 20, page = 1 } = req.query;

      let query = `
        SELECT o.id, o.order_number, o.total_amount, o.status, o.shipping_address, 
               o.payment_method, o.payment_status, o.notes, o.created_at,
               u.name as user_name, u.email as user_email,
               COUNT(oi.id) as items_count
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
      `;

      const params = [];
      const whereConditions = [];

      if (status) {
        whereConditions.push('o.status = ?');
        params.push(status);
      }

      if (user_id) {
        whereConditions.push('o.user_id = ?');
        params.push(user_id);
      }

      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }

      query += ' GROUP BY o.id ORDER BY o.created_at DESC';

      // Add pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [orders] = await pool.execute(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM orders o';
      const countParams = [];

      if (whereConditions.length > 0) {
        countQuery += ' WHERE ' + whereConditions.join(' AND ');
        countParams.push(...params.slice(0, whereConditions.length));
      }

      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;

      res.status(200).json({
        success: true,
        orders,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get all orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Admin: Update order status
export const updateOrderStatus = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      // Valid status transitions
      const validStatuses = ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      // Check if order exists
      const [orders] = await pool.execute(
        'SELECT id, status FROM orders WHERE id = ?',
        [id]
      );

      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Update order status
      await pool.execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, id]
      );

      // Log admin action
      await pool.execute(
        'INSERT INTO admin_logs (admin_id, action_type, table_name, record_id, old_values, new_values) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, 'UPDATE_ORDER_STATUS', 'orders', id, JSON.stringify({ status: orders[0].status }), JSON.stringify({ status })]
      );

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully'
      });

    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];