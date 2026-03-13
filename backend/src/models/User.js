import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN', 'RIDER'], default: 'USER' },
  phone: { type: String },
  is_online: { type: Boolean, default: false },
  status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Map _id to id
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const User = mongoose.model('User', userSchema);
export default User;
