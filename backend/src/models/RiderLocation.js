import mongoose from 'mongoose';

const riderLocationSchema = new mongoose.Schema({
  rider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  last_updated: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

riderLocationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const RiderLocation = mongoose.model('RiderLocation', riderLocationSchema);
export default RiderLocation;
