import { pool } from '../config/database.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';
import { productSchema } from '../middleware/validation.js';

// Get all products (public)
export const getProducts = async (req, res) => {
  try {
    const { category, search, limit = 20, page = 1 } = req.query;

    let query = `
      SELECT p.id, p.name, p.description, p.price, p.original_price, 
             p.discount_percent, p.stock_quantity, p.unit, p.image_url,
             p.is_active, p.created_at,
             c.name as category_name, c.id as category_id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
    `;

    const params = [];

    if (category) {
      query += ' AND c.name = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC';

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    console.log('Query:', query);
    console.log('Params:', params);

    const [products] = await pool.execute(query, params);
    console.log(`Fetched ${products.length} products`);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
    `;

    const countParams = [];
    if (category) {
      countQuery += ' AND c.name = ?';
      countParams.push(category);
    }
    if (search) {
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      products,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
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

    const [products] = await pool.execute(
      `SELECT p.id, p.name, p.description, p.price, p.original_price, 
              p.discount_percent, p.stock_quantity, p.unit, p.image_url,
              p.is_active, p.created_at,
              c.name as category_name, c.id as category_id
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.is_active = TRUE`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product: products[0]
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
    const [categories] = await pool.execute(
      'SELECT id, name, description, image_url, created_at FROM categories ORDER BY name'
    );

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

      console.log('Backend createProduct received:', req.body);

      // Check if category exists
      const [categories] = await pool.execute(
        'SELECT id FROM categories WHERE id = ?',
        [category_id]
      );

      if (categories.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      const [result] = await pool.execute(
        `INSERT INTO products (name, category_id, description, price, original_price, 
                              discount_percent, stock_quantity, unit, image_url, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, category_id, description || null, price, original_price || null, discount_percent || 0,
          stock_quantity, unit || null, image_url || null, is_active !== undefined ? is_active : true]
      );

      // Get the created product
      const [products] = await pool.execute(
        `SELECT p.id, p.name, p.description, p.price, p.original_price, 
                p.discount_percent, p.stock_quantity, p.unit, p.image_url,
                p.is_active, p.created_at,
                c.name as category_name
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product: products[0]
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
      const { name, category_id, description, price, original_price, discount_percent,
        stock_quantity, unit, image_url, is_active } = req.body;

      // Check if product exists
      const [existingProducts] = await pool.execute(
        'SELECT id FROM products WHERE id = ?',
        [id]
      );

      if (existingProducts.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if category exists (if provided)
      if (category_id) {
        const [categories] = await pool.execute(
          'SELECT id FROM categories WHERE id = ?',
          [category_id]
        );

        if (categories.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Category not found'
          });
        }
      }

      // Build update query dynamically
      let query = 'UPDATE products SET ';
      const params = [];
      const fields = [];

      if (name !== undefined) {
        fields.push('name = ?');
        params.push(name);
      }
      if (category_id !== undefined) {
        fields.push('category_id = ?');
        params.push(category_id);
      }
      if (description !== undefined) {
        fields.push('description = ?');
        params.push(description);
      }
      if (price !== undefined) {
        fields.push('price = ?');
        params.push(price);
      }
      if (original_price !== undefined) {
        fields.push('original_price = ?');
        params.push(original_price);
      }
      if (discount_percent !== undefined) {
        fields.push('discount_percent = ?');
        params.push(discount_percent);
      }
      if (stock_quantity !== undefined) {
        fields.push('stock_quantity = ?');
        params.push(stock_quantity);
      }
      if (unit !== undefined) {
        fields.push('unit = ?');
        params.push(unit);
      }
      if (image_url !== undefined) {
        fields.push('image_url = ?');
        params.push(image_url);
      }
      if (is_active !== undefined) {
        fields.push('is_active = ?');
        params.push(is_active);
      }

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      query += fields.join(', ') + ' WHERE id = ?';
      params.push(id);

      await pool.execute(query, params);

      // Get updated product
      const [products] = await pool.execute(
        `SELECT p.id, p.name, p.description, p.price, p.original_price, 
                p.discount_percent, p.stock_quantity, p.unit, p.image_url,
                p.is_active, p.created_at,
                c.name as category_name
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`,
        [id]
      );

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        product: products[0]
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
      const [existingProducts] = await pool.execute(
        'SELECT id, name FROM products WHERE id = ?',
        [id]
      );

      if (existingProducts.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if product has orders (soft delete)
      const [orderItems] = await pool.execute(
        'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?',
        [id]
      );

      if (orderItems[0].count > 0) {
        // Soft delete - mark as inactive
        await pool.execute(
          'UPDATE products SET is_active = FALSE WHERE id = ?',
          [id]
        );

        res.status(200).json({
          success: true,
          message: 'Product deactivated successfully (has existing orders)'
        });
      } else {
        // Hard delete
        await pool.execute('DELETE FROM products WHERE id = ?', [id]);

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

      const [products] = await pool.execute(
        `SELECT p.id, p.name, p.stock_quantity, p.unit,
                c.name as category_name
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.stock_quantity <= ? AND p.is_active = TRUE
         ORDER BY p.stock_quantity ASC`,
        [threshold]
      );

      res.status(200).json({
        success: true,
        products
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