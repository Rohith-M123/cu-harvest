import mongoose from 'mongoose';

const userAddressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address_line1: { type: String, required: true },
  address_line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip_code: { type: String, required: true },
  is_default: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userAddressSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const UserAddress = mongoose.model('UserAddress', userAddressSchema);
export default UserAddress;
