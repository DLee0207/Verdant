import { Tenant, Unit, Reading, dataStore } from '../data/store.js';
import { normalizeEmissions } from '../utils/calculations.js';
import { generateAISuggestions } from '../utils/geminiService.js';

/**
 * Get tenant summary (CPI, quota, progress, discount)
 */
export async function getTenantSummary(req, res) {
  try {
    const { id } = req.params;
    
    // FAST MODE: Direct access to dataStore (no promise overhead)
    const tenant = dataStore.tenants.find(t => t.id === id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const unit = dataStore.units.find(u => u.id === tenant.unitId);
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
 * FAST MODE: Generates synthetic readings if none exist (for demo speed)
 */
export async function getTenantUsage(req, res) {
  try {
    const { id } = req.params;
    
    // FAST MODE: Direct access to dataStore (no promise overhead)
    const tenant = dataStore.tenants.find(t => t.id === id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const unit = dataStore.units.find(u => u.id === tenant.unitId);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    
    // FAST MODE: Always generate synthetic readings (skip CSV processing for demo speed)
    // This avoids processing potentially hundreds of readings from CSV
    const dailyEmissions = unit.currentKgCO2e / 30; // Average daily emissions
    const dailyKwh = dailyEmissions / 0.42; // Convert to kWh (assuming 0.42 grid intensity)
    
    // Generate 30 days of readings with realistic variation
    const readings = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Add some variation (±10%) for realistic chart
      const variation = 1 + (Math.random() * 0.2 - 0.1);
      const kwh = dailyKwh * variation;
      const emissionsKg = kwh * 0.42;
      
      readings.push({
        date: date.toISOString().split('T')[0],
        kwh: Math.round(kwh * 100) / 100,
        emissionsKg: Math.round(emissionsKg * 100) / 100
      });
    }
    
    res.json({
      unitId: tenant.unitId,
      readings
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
    
    // FAST MODE: Direct access to dataStore
    const tenant = dataStore.tenants.find(t => t.id === id);
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
 * Get AI-generated suggestions for reducing emissions
 */
export async function getAISuggestions(req, res) {
  try {
    const { id } = req.params;
    
    // Get tenant and unit data
    const tenant = dataStore.tenants.find(t => t.id === id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const unit = dataStore.units.find(u => u.id === tenant.unitId);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    
    // Get summary data
    const quota = unit.quota || unit.baselineKgCO2e;
    const progress = quota > 0 ? (unit.currentKgCO2e / quota) * 100 : 0;
    const breakdown = calculateUsageBreakdown(unit.currentKgCO2e);
    
    const summary = {
      cpi: unit.cpi,
      currentKgCO2e: unit.currentKgCO2e,
      quota: quota,
      progress: Math.min(100, progress),
      discount: unit.discount
    };
    
    // Generate AI suggestions
    const suggestions = await generateAISuggestions({
      tenant,
      unit,
      summary,
      usageBreakdown: breakdown
    });
    
    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
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

