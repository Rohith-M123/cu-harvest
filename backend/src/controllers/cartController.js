import { pool } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

// Get user cart
export const getCart = [
  authenticate,
  async (req, res) => {
    try {
      const userId = req.user.id;
      
      const [cartItems] = await pool.execute(
        `SELECT ci.id, ci.quantity, ci.added_at,
                p.id as product_id, p.name, p.price, p.original_price, 
                p.discount_percent, p.stock_quantity, p.unit, p.image_url,
                (p.price * ci.quantity) as total_price
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = ? AND p.is_active = TRUE
         ORDER BY ci.added_at DESC`,
        [userId]
      );
      
      // Calculate cart summary
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = cartItems.reduce((sum, item) => sum + item.total_price, 0);
      
      res.status(200).json({
        success: true,
        cart: {
          items: cartItems,
          summary: {
            total_items: totalItems,
            total_price: parseFloat(totalPrice.toFixed(2))
          }
        }
      });
      
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Add item to cart
export const addToCart = [
  authenticate,
  async (req, res) => {
    try {
      const { product_id, quantity = 1 } = req.body;
      const userId = req.user.id;
      
      // Validate input
      if (!product_id || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Product ID and quantity are required'
        });
      }
      
      // Check if product exists and is active
      const [products] = await pool.execute(
        'SELECT id, name, price, stock_quantity, is_active FROM products WHERE id = ? AND is_active = TRUE',
        [product_id]
      );
      
      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or not available'
        });
      }
      
      const product = products[0];
      
      // Check stock availability
      if (product.stock_quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${product.stock_quantity} items available`
        });
      }
      
      // Check if item already in cart
      const [existingItems] = await pool.execute(
        'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
        [userId, product_id]
      );
      
      if (existingItems.length > 0) {
        // Update quantity
        const newQuantity = existingItems[0].quantity + quantity;
        
        // Check stock again with new quantity
        if (product.stock_quantity < newQuantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock. Only ${product.stock_quantity} items available`
          });
        }
        
        await pool.execute(
          'UPDATE cart_items SET quantity = ? WHERE id = ?',
          [newQuantity, existingItems[0].id]
        );
      } else {
        // Add new item
        await pool.execute(
          'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
          [userId, product_id, quantity]
        );
      }
      
      res.status(200).json({
        success: true,
        message: 'Item added to cart successfully'
      });
      
    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Update cart item quantity
export const updateCartItem = [
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const userId = req.user.id;
      
      // Validate input
      if (quantity === undefined || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a positive number'
        });
      }
      
      // Verify item belongs to user and get product info
      const [cartItems] = await pool.execute(
        `SELECT ci.id, ci.quantity, p.id as product_id, p.stock_quantity, p.is_active
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.id = ? AND ci.user_id = ?`,
        [id, userId]
      );
      
      if (cartItems.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }
      
      const cartItem = cartItems[0];
      
      if (!cartItem.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Product is no longer available'
        });
      }
      
      // Check stock availability
      if (cartItem.stock_quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${cartItem.stock_quantity} items available`
        });
      }
      
      // Update quantity
      await pool.execute(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [quantity, id]
      );
      
      res.status(200).json({
        success: true,
        message: 'Cart item updated successfully'
      });
      
    } catch (error) {
      console.error('Update cart item error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Remove item from cart
export const removeFromCart = [
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Verify item belongs to user
      const [cartItems] = await pool.execute(
        'SELECT id FROM cart_items WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      
      if (cartItems.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }
      
      // Remove item
      await pool.execute('DELETE FROM cart_items WHERE id = ?', [id]);
      
      res.status(200).json({
        success: true,
        message: 'Item removed from cart successfully'
      });
      
    } catch (error) {
      console.error('Remove from cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Clear entire cart
export const clearCart = [
  authenticate,
  async (req, res) => {
    try {
      const userId = req.user.id;
      
      await pool.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
      
      res.status(200).json({
        success: true,
        message: 'Cart cleared successfully'
      });
      
    } catch (error) {
      console.error('Clear cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];