import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  change_type: { type: String, enum: ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'], required: true },
  quantity_change: { type: Number, required: true },
  reason: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

inventoryLogSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);
export default InventoryLog;
