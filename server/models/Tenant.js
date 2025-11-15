import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  unitId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  rewards: {
    currentDiscount: { type: Number, default: 0 },
    lifetimeSavedUSD: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    badges: [{ type: String }]
  },
  acknowledgedTips: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Tenant', tenantSchema);

