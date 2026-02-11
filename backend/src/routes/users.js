import express from 'express';
import { pool } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user addresses
router.get('/addresses', authenticate, async (req, res) => {
  try {
    const [addresses] = await pool.execute(
      'SELECT id, address_line1, address_line2, city, state, zip_code, is_default, created_at FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );

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

    // If this is set as default, unset other default addresses
    if (is_default) {
      await pool.execute(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?',
        [userId]
      );
    }

    const [result] = await pool.execute(
      'INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, zip_code, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, address_line1, address_line2, city, state, zip_code, is_default || false]
    );

    const [newAddress] = await pool.execute(
      'SELECT id, address_line1, address_line2, city, state, zip_code, is_default, created_at FROM user_addresses WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address: newAddress[0]
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
    const { address_line1, address_line2, city, state, zip_code, is_default } = req.body;
    const userId = req.user.id;

    // Verify address belongs to user
    const [existingAddresses] = await pool.execute(
      'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingAddresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If this is set as default, unset other default addresses
    if (is_default) {
      await pool.execute(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND id != ?',
        [userId, id]
      );
    }

    await pool.execute(
      'UPDATE user_addresses SET address_line1 = ?, address_line2 = ?, city = ?, state = ?, zip_code = ?, is_default = ? WHERE id = ?',
      [address_line1, address_line2, city, state, zip_code, is_default || false, id]
    );

    const [updatedAddress] = await pool.execute(
      'SELECT id, address_line1, address_line2, city, state, zip_code, is_default, created_at FROM user_addresses WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address: updatedAddress[0]
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

    // Verify address belongs to user
    const [existingAddresses] = await pool.execute(
      'SELECT id, is_default FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingAddresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If deleting default address, set another one as default if available
    if (existingAddresses[0].is_default) {
      await pool.execute(
        'UPDATE user_addresses SET is_default = TRUE WHERE user_id = ? AND id != ? ORDER BY created_at ASC LIMIT 1',
        [userId, id]
      );
    }

    await pool.execute('DELETE FROM user_addresses WHERE id = ?', [id]);

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
    const [orders] = await pool.execute(
      `SELECT o.id, o.order_number, o.total_amount, o.status, o.shipping_address, 
              o.payment_method, o.payment_status, o.created_at,
              COUNT(oi.id) as items_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      orders
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

    // Get order details
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
});

// Get all users (Admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const [users] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );

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

export default router;