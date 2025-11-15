import { Tenant, Unit, Reading } from '../data/store.js';
import { normalizeEmissions } from '../utils/calculations.js';

/**
 * Get tenant summary (CPI, quota, progress, discount)
 */
export async function getTenantSummary(req, res) {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findOne({ id });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const unit = await Unit.findOne({ id: tenant.unitId });
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    
    // Calculate quota (use custom quota or baseline)
    const quota = unit.quota || unit.baselineKgCO2e;
    const progress = quota > 0 ? (unit.currentKgCO2e / quota) * 100 : 0;
    
    // Calculate usage breakdown (simulated from random weighted splits)
    const breakdown = calculateUsageBreakdown(unit.currentKgCO2e);
    
    res.json({
      tenantId: tenant.id,
      unitId: unit.id,
      cpi: unit.cpi,
      currentKgCO2e: unit.currentKgCO2e,
      quota: quota,
      progress: Math.min(100, progress),
      discount: unit.discount,
      breakdown,
      rewards: tenant.rewards
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get tenant usage data (daily emissions)
 */
export async function getTenantUsage(req, res) {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findOne({ id });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Get all readings for this unit
    const allReadings = await Reading.find({
      unitId: tenant.unitId
    });
    
    if (allReadings.length === 0) {
      return res.json({
        unitId: tenant.unitId,
        readings: []
      });
    }
    
    // Sort by date
    allReadings.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get the most recent date in the data
    const mostRecentDate = new Date(allReadings[allReadings.length - 1].date);
    
    // Get last 30 days from the most recent date in the data
    const thirtyDaysAgo = new Date(mostRecentDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Filter to last 30 days from the most recent date
    const readings = allReadings.filter(r => {
      const readingDate = new Date(r.date);
      return readingDate >= thirtyDaysAgo;
    });
    
    res.json({
      unitId: tenant.unitId,
      readings: readings.map(r => ({
        date: r.date,
        kwh: r.kwh,
        emissionsKg: r.emissionsKg
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Acknowledge a tip or goal
 */
export async function acknowledgeTip(req, res) {
  try {
    const { id } = req.params;
    const { tipId } = req.body;
    
    const tenant = await Tenant.findOne({ id });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    if (!tenant.acknowledgedTips.includes(tipId)) {
      tenant.acknowledgedTips.push(tipId);
    }
    
    res.json({ success: true, acknowledgedTips: tenant.acknowledgedTips });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Calculate usage breakdown (simulated)
 */
function calculateUsageBreakdown(totalEmissions) {
  // Simulate breakdown with weighted percentages
  const weights = {
    hvac: 0.45,
    lights: 0.20,
    water: 0.15,
    appliances: 0.12,
    other: 0.08
  };
  
  return {
    hvac: totalEmissions * weights.hvac,
    lights: totalEmissions * weights.lights,
    water: totalEmissions * weights.water,
    appliances: totalEmissions * weights.appliances,
    other: totalEmissions * weights.other
  };
}

