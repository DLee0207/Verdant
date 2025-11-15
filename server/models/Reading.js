import mongoose from 'mongoose';

const readingSchema = new mongoose.Schema({
  unitId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  kwh: { type: Number, required: true },
  gridIntensity: { type: Number, required: true },
  emissionsKg: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

readingSchema.index({ unitId: 1, date: 1 });

export default mongoose.model('Reading', readingSchema);

