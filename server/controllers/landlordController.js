import { Unit, Reading, Tenant, dataStore } from '../data/store.js';
import { processAllUnits } from '../utils/calculations.js';

/**
 * Get building overview
 */
export async function getBuildingOverview(req, res) {
  try {
    const { building_id } = req.params;
    
    const units = await Unit.find({ buildingId: building_id });
    
    const totalCO2e = units.reduce((sum, u) => sum + u.currentKgCO2e, 0);
    const avgCPI = units.length > 0
      ? units.reduce((sum, u) => sum + u.cpi, 0) / units.length
      : 0;
    
    // Get most recent month's total from readings
    const allReadings = await Reading.find({});
    let startOfMonth;
    if (allReadings.length > 0) {
      const mostRecentDate = new Date(Math.max(...allReadings.map(r => new Date(r.date).getTime())));
      startOfMonth = new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth(), 1);
    } else {
      const now = new Date();
      startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const monthReadings = await Reading.find({
      unitId: { $in: units.map(u => u.id) },
      date: { $gte: startOfMonth }
    });
    const monthCO2e = monthReadings.reduce((sum, r) => sum + r.emissionsKg, 0);
    
    res.json({
      buildingId: building_id,
      totalUnits: units.length,
      totalCO2eThisMonth: monthCO2e,
      averageCPI: Math.round(avgCPI * 10) / 10,
      units: units.map(u => ({
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
    const units = await Unit.find({ buildingId: building_id });
    
    const unitsWithTenants = units.map((unit) => {
      const tenant = dataStore.tenants.find(t => t.unitId === unit.id);
        const quota = unit.quota || unit.baselineKgCO2e;
        const usageVsQuota = quota > 0 ? (unit.currentKgCO2e / quota) * 100 : 0;
        
        // Determine discount tier
        let discountTier = 'None';
        if (unit.cpi >= 90) discountTier = 'Tier 1 (5%)';
        else if (unit.cpi >= 75) discountTier = 'Tier 2 (2%)';
        else if (unit.cpi >= 60) discountTier = 'Tier 3 (0.5%)';
        
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
    
    const unit = await Unit.findOne({ id: unit_id });
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
    
    // Recalculate CPI and discount for all units
    await processAllUnits(Unit, Reading);
    
    // Get updated unit
    const updatedUnit = await Unit.findOne({ id: unit_id });
    
    // Calculate usage vs quota
    const unitQuota = updatedUnit.quota || updatedUnit.baselineKgCO2e;
    const usageVsQuota = unitQuota > 0 ? (updatedUnit.currentKgCO2e / unitQuota) * 100 : 0;
    
    // Determine discount tier
    let discountTier = 'None';
    if (updatedUnit.cpi >= 90) discountTier = 'Tier 1 (5%)';
    else if (updatedUnit.cpi >= 75) discountTier = 'Tier 2 (2%)';
    else if (updatedUnit.cpi >= 60) discountTier = 'Tier 3 (0.5%)';
    
    res.json({
      success: true,
      unit: {
        id: updatedUnit.id,
        quota: updatedUnit.quota,
        medicalFlag: updatedUnit.medicalFlag,
        cpi: updatedUnit.cpi,
        discount: updatedUnit.discount,
        currentKgCO2e: updatedUnit.currentKgCO2e,
        baselineKgCO2e: updatedUnit.baselineKgCO2e,
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
    const units = await Unit.find({ buildingId: building_id });
    
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
      else if (unit.cpi >= 75) discountTier = 'Tier 2 (2%)';
      else if (unit.cpi >= 60) discountTier = 'Tier 3 (0.5%)';
      
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

