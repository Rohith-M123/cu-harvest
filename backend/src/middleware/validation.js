import Joi from 'joi';

// User registration validation schema
export const userRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional().messages({
    'string.pattern.base': 'Phone number must be 10-15 digits'
  }),
  role: Joi.string().valid('USER', 'ADMIN', 'RIDER').optional(),
  firebase_uid: Joi.string().optional()
});

// User login validation schema
export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Product validation schema
export const productSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  category_id: Joi.number().integer().positive().required(),
  description: Joi.string().max(1000).optional(),
  price: Joi.number().positive().required(),
  original_price: Joi.number().positive().optional(),
  discount_percent: Joi.number().min(0).max(100).optional(),
  stock_quantity: Joi.number().integer().min(0).required(),
  unit: Joi.string().max(50).optional(),
  image_url: Joi.string().uri().optional(),
  is_active: Joi.boolean().optional()
});

// Order validation schema
export const orderSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    product_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().positive().required()
  })).min(1).required(),
  shipping_address: Joi.string().required(),
  payment_method: Joi.string().max(50).required()
});

// Address validation schema
export const addressSchema = Joi.object({
  address_line1: Joi.string().max(255).required(),
  address_line2: Joi.string().max(255).optional(),
  city: Joi.string().max(100).required(),
  state: Joi.string().max(100).required(),
  zip_code: Joi.string().max(20).required(),
  is_default: Joi.boolean().optional()
});