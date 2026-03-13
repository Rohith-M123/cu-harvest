import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assigned Rider
  order_number: { type: String, required: true, unique: true },
  total_amount: { type: Number, required: true },
  delivery_fee: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['PLACED', 'VERIFIED', 'ASSIGNED', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'CANCELLED'],
    default: 'PLACED'
  },
  shipping_address: { type: String, required: true },
  delivery_location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  payment_method: { type: String },
  payment_status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  notes: { type: String },
  assigned_at: { type: Date },
  estimated_delivery_time: { type: Date },
  delivery_type: { 
    type: String, 
    enum: ['INSTANT', 'SCHEDULED'], 
    default: 'INSTANT' 
  },
  delivery_date: { type: Date },
  delivery_slot: { 
    type: String, 
    enum: ['MORNING', 'AFTERNOON', 'EVENING'] 
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Map _id to id
orderSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
