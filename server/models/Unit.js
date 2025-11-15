import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  buildingId: { type: String, required: true },
  buildingType: { type: String, enum: ['Residential', 'Commercial'], default: 'Residential' },
  area: { type: Number, required: true },
  occupancy: { type: Number, required: true },
  medicalFlag: { type: Boolean, default: false },
  baselineKgCO2e: { type: Number, required: true },
  currentKgCO2e: { type: Number, default: 0 },
  cpi: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  quota: { type: Number, default: null }, // Custom quota override
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Unit', unitSchema);

