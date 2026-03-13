import CartItem from '../models/CartItem.js';
import Product from '../models/Product.js';
import { authenticate } from '../middleware/auth.js';

// Get user cart
export const getCart = [
  authenticate,
  async (req, res) => {
    try {
      const userId = req.user.id;
      
      const cartItems = await CartItem.find({ user_id: userId })
        .populate('product_id')
        .sort({ added_at: -1 });
      
      // Filter out items where product no longer exists or is inactive
      // Optionally remove them from DB or just ignore here.
      const validCartItems = cartItems.filter(item => item.product_id && item.product_id.is_active);

      // Create mapped response similar to SQL output
      const mappedItems = validCartItems.map(item => {
        const p = item.product_id;
        return {
          id: item._id, // cart item id
          quantity: item.quantity,
          added_at: item.added_at,
          product_id: p._id,
          name: p.name,
          price: p.price,
          original_price: p.original_price,
          discount_percent: p.discount_percent,
          stock_quantity: p.stock_quantity,
          unit: p.unit,
          image_url: p.image_url,
          total_price: p.price * item.quantity
        };
      });

      // Calculate cart summary
      const totalItems = mappedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = mappedItems.reduce((sum, item) => sum + item.total_price, 0);
      
      res.status(200).json({
        success: true,
        cart: {
          items: mappedItems,
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
      const product = await Product.findOne({ _id: product_id, is_active: true });
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or not available'
        });
      }
      
      // Check stock availability
      if (product.stock_quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${product.stock_quantity} items available`
        });
      }
      
      // Check if item already in cart
      const existingItem = await CartItem.findOne({ user_id: userId, product_id: product_id });
      
      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        
        // Check stock again with new quantity
        if (product.stock_quantity < newQuantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock. Only ${product.stock_quantity} items available`
          });
        }
        
        existingItem.quantity = newQuantity;
        await existingItem.save();
      } else {
        // Add new item
        const newItem = new CartItem({
          user_id: userId,
          product_id: product_id,
          quantity: quantity
        });
        await newItem.save();
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
      const cartItem = await CartItem.findOne({ _id: id, user_id: userId }).populate('product_id');
      
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }
      
      const product = cartItem.product_id;
      
      if (!product || !product.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Product is no longer available'
        });
      }
      
      // Check stock availability
      if (product.stock_quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${product.stock_quantity} items available`
        });
      }
      
      // Update quantity
      cartItem.quantity = quantity;
      await cartItem.save();
      
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
      const cartItem = await CartItem.findOne({ _id: id, user_id: userId });
      
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }
      
      // Remove item
      await CartItem.deleteOne({ _id: id });
      
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
      
      await CartItem.deleteMany({ user_id: userId });
      
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