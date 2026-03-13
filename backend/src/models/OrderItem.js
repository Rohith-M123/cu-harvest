import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  total_price: { type: Number, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }, // only created_at in schema.sql
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Map _id to id
orderItemSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const OrderItem = mongoose.model('OrderItem', orderItemSchema);
export default OrderItem;
