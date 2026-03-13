import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action_type: { type: String, required: true },
  table_name: { type: String },
  record_id: { type: String },
  old_values: { type: mongoose.Schema.Types.Mixed },
  new_values: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

adminLogSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const AdminLog = mongoose.model('AdminLog', adminLogSchema);
export default AdminLog;
