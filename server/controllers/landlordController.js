import { Unit, Reading, Tenant, dataStore } from '../data/store.js';
import { processAllUnits } from '../utils/calculations.js';
import { normalizeEmissions, calculateCPI, calculateDiscount } from '../utils/calculations.js';

/**
 * Get building overview
 */
export async function getBuildingOverview(req, res) {
  try {
    const { building_id } = req.params;
    
    // FAST MODE: Direct access to dataStore (no promise overhead)
    const allUnits = dataStore.units.filter(u => u.buildingId === building_id);
    
    // Filter to only active units (those with data/tenants)
    const activeUnits = allUnits.filter(u => !u.inactive && u.currentKgCO2e > 0);
    
    // Use already-calculated values from active units (much faster than recalculating from readings)
    const totalCO2e = activeUnits.reduce((sum, u) => sum + (u.currentKgCO2e || 0), 0);
    const totalBaselineCO2e = activeUnits.reduce((sum, u) => sum + (u.baselineKgCO2e || 0), 0);
    const avgCPI = activeUnits.length > 0
      ? activeUnits.reduce((sum, u) => sum + (u.cpi || 0), 0) / activeUnits.length
      : 0;
    
    // Use the sum of currentKgCO2e from active units (already calculated for the month)
    // No need to recalculate from readings - units already have the monthly totals
    const monthCO2e = totalCO2e;
    
    // Calculate percentage vs baseline for the frontend
    const percentageVsBaseline = totalBaselineCO2e > 0 
      ? (totalCO2e / totalBaselineCO2e) * 100 
      : 0;
    
    res.json({
      buildingId: building_id,
      totalUnits: allUnits.length, // Total units in building (30)
      activeUnits: activeUnits.length, // Active units with data (20)
      totalCO2eThisMonth: monthCO2e,
      totalBaselineCO2e: totalBaselineCO2e,
      percentageVsBaseline: Math.round(percentageVsBaseline * 10) / 10,
      averageCPI: Math.round(avgCPI * 10) / 10,
      units: activeUnits.map(u => ({
        id: u.id,
        cpi: u.cpi,
        currentKgCO2e: u.currentKgCO2e,
        baselineKgCO2e: u.baselineKgCO2e,
        discount: u.discount
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get all units with details
 */
export async function getAllUnits(req, res) {
  try {
    const { building_id } = req.params;
    
    // FAST MODE: Direct access to dataStore (no promise overhead)
    const allUnits = dataStore.units.filter(u => u.buildingId === building_id);
    
    // Filter to only active units (those with data/tenants)
    const units = allUnits.filter(u => !u.inactive && u.currentKgCO2e > 0);
    
    // Create tenant lookup map for O(1) access instead of O(n) find for each unit
    const tenantMap = new Map();
    dataStore.tenants.forEach(tenant => {
      tenantMap.set(tenant.unitId, tenant);
    });
    
    const unitsWithTenants = units.map((unit) => {
      const tenant = tenantMap.get(unit.id);
        const quota = unit.quota || unit.baselineKgCO2e;
        const usageVsQuota = quota > 0 ? (unit.currentKgCO2e / quota) * 100 : 0;
        
        // Determine discount tier
        let discountTier = 'None';
        if (unit.cpi >= 90) discountTier = 'Tier 1 (5%)';
        else if (unit.cpi >= 70) discountTier = 'Tier 2 (2%)';
        else if (unit.cpi >= 50) discountTier = 'Tier 3 (0.5%)';
        
        return {
          id: unit.id,
          buildingType: unit.buildingType || 'Residential',
          area: unit.area,
          occupancy: unit.occupancy,
          medicalFlag: unit.medicalFlag,
          baselineKgCO2e: unit.baselineKgCO2e,
          currentKgCO2e: unit.currentKgCO2e,
          quota: quota,
          usageVsQuota: Math.round(usageVsQuota * 10) / 10,
          cpi: unit.cpi,
          discount: unit.discount,
          discountTier,
          tenant: tenant ? { name: tenant.name, email: tenant.email } : null
        };
    });
    
    res.json({ units: unitsWithTenants });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update unit quota or accommodation settings
 */
export async function updateUnitQuota(req, res) {
  try {
    const { unit_id } = req.params;
    const { quota, medicalFlag } = req.body;
    
    // FAST MODE: Direct access to dataStore (no promise overhead)
    const unit = dataStore.units.find(u => u.id === unit_id);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    
    if (quota !== undefined) {
      unit.quota = quota;
    }
    if (medicalFlag !== undefined) {
      unit.medicalFlag = medicalFlag;
    }
    
    unit.updatedAt = new Date();
    
    // Recalculate CPI and discount instantly using existing emissions data
    // New algorithm uses raw emissions vs quota (no normalization needed)
    const unitQuotaForCPI = unit.quota !== null && unit.quota !== undefined ? unit.quota : null;
    const cpi = calculateCPI(
      unit.currentKgCO2e, // Use raw emissions
      unit.baselineKgCO2e,
      unit.area,
      unit.occupancy,
      unit.medicalFlag,
      unitQuotaForCPI
    );
    
    const discount = calculateDiscount(cpi);
    unit.cpi = cpi;
    unit.discount = discount;
    
    const unitQuota = unit.quota || unit.baselineKgCO2e;
    const usageVsQuota = unitQuota > 0 ? (unit.currentKgCO2e / unitQuota) * 100 : 0;
    
    // Determine discount tier
    let discountTier = 'None';
    if (unit.cpi >= 90) discountTier = 'Tier 1 (5%)';
    else if (unit.cpi >= 70) discountTier = 'Tier 2 (2%)';
    else if (unit.cpi >= 50) discountTier = 'Tier 3 (0.5%)';
    
    res.json({
      success: true,
      unit: {
        id: unit.id,
        quota: unit.quota,
        medicalFlag: unit.medicalFlag,
        cpi: unit.cpi,
        discount: unit.discount,
        currentKgCO2e: unit.currentKgCO2e,
        baselineKgCO2e: unit.baselineKgCO2e,
        usageVsQuota: Math.round(usageVsQuota * 10) / 10,
        discountTier: discountTier
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Export CSV report
 */
export async function exportCSV(req, res) {
  try {
    const { building_id } = req.params;
    
    // FAST MODE: Direct access to dataStore
    const units = dataStore.units.filter(u => u.buildingId === building_id);
    
    // Get tenants
    const tenantMap = new Map();
    units.forEach(unit => {
      const tenant = dataStore.tenants.find(t => t.unitId === unit.id);
      if (tenant) {
        tenantMap.set(unit.id, tenant);
      }
    });
    
    // Generate CSV
    const headers = [
      'Unit ID',
      'Building Type',
      'Tenant Name',
      'Area (sqft)',
      'Occupancy',
      'Medical Accommodation',
      'Baseline CO₂e (kg)',
      'Current CO₂e (kg)',
      'Quota (kg)',
      'Usage vs Quota (%)',
      'CPI Score',
      'Discount (%)',
      'Discount Tier'
    ];
    
    const rows = units.map(unit => {
      const tenant = tenantMap.get(unit.id);
      const quota = unit.quota || unit.baselineKgCO2e;
      const usageVsQuota = quota > 0 ? (unit.currentKgCO2e / quota) * 100 : 0;
      
      let discountTier = 'None';
      if (unit.cpi >= 90) discountTier = 'Tier 1 (5%)';
      else if (unit.cpi >= 70) discountTier = 'Tier 2 (2%)';
      else if (unit.cpi >= 50) discountTier = 'Tier 3 (0.5%)';
      
      return [
        unit.id,
        unit.buildingType || 'Residential',
        tenant ? tenant.name : 'N/A',
        unit.area,
        unit.occupancy,
        unit.medicalFlag ? 'Yes' : 'No',
        unit.baselineKgCO2e.toFixed(2),
        unit.currentKgCO2e.toFixed(2),
        quota.toFixed(2),
        usageVsQuota.toFixed(1),
        unit.cpi,
        (unit.discount * 100).toFixed(1),
        discountTier
      ];
    });
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="verdant-report-${building_id}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

