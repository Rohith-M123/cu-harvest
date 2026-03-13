import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1 },
}, {
  timestamps: { createdAt: 'added_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Ensure unique_user_product
cartItemSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

// Map _id to id
cartItemSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const CartItem = mongoose.model('CartItem', cartItemSchema);
export default CartItem;
