import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String },
  price: { type: Number, required: true },
  original_price: { type: Number },
  discount_percent: { type: Number, default: 0 },
  stock_quantity: { type: Number, default: 0 },
  unit: { type: String },
  image_url: { type: String },
  is_active: { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Map _id to id
productSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
