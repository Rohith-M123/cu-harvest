import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image_url: { type: String },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Map _id to id
categorySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
