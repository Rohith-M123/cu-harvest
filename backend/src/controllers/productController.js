import Product from '../models/Product.js';
import Category from '../models/Category.js';
import OrderItem from '../models/OrderItem.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';
import { productSchema } from '../middleware/validation.js';

// Get all products (public)
export const getProducts = async (req, res) => {
  try {
    const { category, search, limit = 20, page = 1 } = req.query;

    const query = { is_active: true };

    if (category) {
      const cat = await Category.findOne({ name: category });
      if (cat) {
        query.category_id = cat._id;
      } else {
        // category not found means no products
        query.category_id = null;
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const limitInt = parseInt(limit);
    const pageInt = parseInt(page);
    const skip = (pageInt - 1) * limitInt;

    const products = await Product.find(query)
      .populate('category_id', 'name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitInt);

    const total = await Product.countDocuments(query);

    // Map to include category_name to keep frontend compatibility
    const mappedProducts = products.map(p => {
      const pObj = p.toJSON();
      return {
        ...pObj,
        category_name: p.category_id ? p.category_id.name : null,
        category_id: p.category_id ? p.category_id._id : null
      };
    });

    res.status(200).json({
      success: true,
      products: mappedProducts,
      pagination: {
        current_page: pageInt,
        per_page: limitInt,
        total,
        total_pages: Math.ceil(total / limitInt)
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get product by ID (public)
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, is_active: true })
      .populate('category_id', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const pObj = product.toJSON();
    const mappedProduct = {
      ...pObj,
      category_name: product.category_id ? product.category_id.name : null,
      category_id: product.category_id ? product.category_id._id : null
    };

    res.status(200).json({
      success: true,
      product: mappedProduct
    });

  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all categories (public)
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Create product
export const createProduct = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      // Validate input
      const { error } = productSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(detail => detail.message)
        });
      }

      const { name, category_id, description, price, original_price, discount_percent,
        stock_quantity, unit, image_url, is_active } = req.body;

      // Check if category exists
      const category = await Category.findById(category_id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      const newProduct = new Product({
        name,
        category_id,
        description: description || null,
        price,
        original_price: original_price || null,
        discount_percent: discount_percent || 0,
        stock_quantity,
        unit: unit || null,
        image_url: image_url || null,
        is_active: is_active !== undefined ? is_active : true
      });

      await newProduct.save();

      const savedProduct = await Product.findById(newProduct._id).populate('category_id', 'name');
      
      const pObj = savedProduct.toJSON();
      const mappedProduct = {
        ...pObj,
        category_name: savedProduct.category_id ? savedProduct.category_id.name : null,
        category_id: savedProduct.category_id ? savedProduct.category_id._id : null
      };

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product: mappedProduct
      });

    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Admin: Update product
export const updateProduct = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if product exists
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if category exists (if provided)
      if (updateData.category_id) {
        const category = await Category.findById(updateData.category_id);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Category not found'
          });
        }
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      ).populate('category_id', 'name');

      const pObj = updatedProduct.toJSON();
      const mappedProduct = {
        ...pObj,
        category_name: updatedProduct.category_id ? updatedProduct.category_id.name : null,
        category_id: updatedProduct.category_id ? updatedProduct.category_id._id : null
      };

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        product: mappedProduct
      });

    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Admin: Delete product
export const deleteProduct = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if product exists
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if product has orders
      const orderItemsCount = await OrderItem.countDocuments({ product_id: id });

      if (orderItemsCount > 0) {
        // Soft delete - mark as inactive
        product.is_active = false;
        await product.save();

        res.status(200).json({
          success: true,
          message: 'Product deactivated successfully (has existing orders)'
        });
      } else {
        // Hard delete
        await Product.findByIdAndDelete(id);

        res.status(200).json({
          success: true,
          message: 'Product deleted successfully'
        });
      }

    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Admin: Get low stock products
export const getLowStockProducts = [
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const threshold = req.query.threshold || 10;

      const products = await Product.find({
        stock_quantity: { $lte: threshold },
        is_active: true
      })
      .populate('category_id', 'name')
      .sort({ stock_quantity: 1 });

      const mappedProducts = products.map(p => {
        const pObj = p.toJSON();
        return {
          ...pObj,
          category_name: p.category_id ? p.category_id.name : null,
          category_id: p.category_id ? p.category_id._id : null
        };
      });

      res.status(200).json({
        success: true,
        products: mappedProducts
      });

    } catch (error) {
      console.error('Get low stock products error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];