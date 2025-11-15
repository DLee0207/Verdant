/**
 * Calculate carbon emissions from kWh
 */
export function calculateEmissions(kwh, gridIntensity) {
  return kwh * gridIntensity;
}

/**
 * Calculate occupancy factor for normalization
 * Medical accommodations get a 1.5x multiplier
 */
export function getOccupancyFactor(occupancy, medicalFlag) {
  const baseFactor = Math.max(1, occupancy);
  return medicalFlag ? baseFactor * 1.5 : baseFactor;
}

/**
 * Normalize emissions by area and occupancy
 */
export function normalizeEmissions(emissionsKg, area, occupancy, medicalFlag) {
  const occupancyFactor = getOccupancyFactor(occupancy, medicalFlag);
  return emissionsKg / (area * occupancyFactor);
}

/**
 * Calculate CPI (Carbon Performance Index) score 0-100
 * Based on improvement from baseline or quota (whichever is more challenging)
 */
export function calculateCPI(adjustedEmissions, baselineKgCO2e, area, occupancy, medicalFlag, quotaKgCO2e = null) {
  // Use quota if available and valid, otherwise use baseline
  const targetKgCO2e = (quotaKgCO2e !== null && quotaKgCO2e !== undefined && quotaKgCO2e > 0) 
    ? quotaKgCO2e 
    : baselineKgCO2e;
  const adjustedTarget = normalizeEmissions(targetKgCO2e, area, occupancy, medicalFlag);
  
  // Prevent division by zero
  if (adjustedTarget <= 0) {
    return 0;
  }
  
  const improvement = Math.max(0, (adjustedTarget - adjustedEmissions) / adjustedTarget);
  return Math.round(100 * improvement);
}

/**
 * Calculate discount based on CPI score
 */
export function calculateDiscount(cpi) {
  if (cpi >= 90) return 0.05;
  if (cpi >= 75) return 0.02;
  if (cpi >= 60) return 0.005;
  return 0;
}

/**
 * Process all units and update their CPI and discounts
 */
export async function processAllUnits(Unit, Reading) {
  const units = await Unit.find({});
  
  // Get all readings once and find the most recent month efficiently
  const allReadings = await Reading.find({});
  let startOfMonth;
  
  if (allReadings.length > 0) {
    // Find the most recent date more efficiently (single pass)
    let maxTimestamp = 0;
    for (const reading of allReadings) {
      const timestamp = new Date(reading.date).getTime();
      if (timestamp > maxTimestamp) {
        maxTimestamp = timestamp;
      }
    }
    const mostRecentDate = new Date(maxTimestamp);
    startOfMonth = new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth(), 1);
  } else {
    // Fallback to current month if no readings
    const now = new Date();
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  // Pre-filter readings by month once (more efficient)
  const monthReadings = allReadings.filter(r => {
    const readingDate = new Date(r.date);
    return readingDate >= startOfMonth;
  });
  
  // Group readings by unitId for O(1) lookup
  const readingsByUnit = new Map();
  for (const reading of monthReadings) {
    if (!readingsByUnit.has(reading.unitId)) {
      readingsByUnit.set(reading.unitId, []);
    }
    readingsByUnit.get(reading.unitId).push(reading);
  }
  
  // Process each unit
  for (const unit of units) {
    // Get readings for this unit (O(1) lookup)
    const readings = readingsByUnit.get(unit.id) || [];
    
    // Calculate total emissions for the month
    const totalKwh = readings.reduce((sum, r) => sum + r.kwh, 0);
    const avgIntensity = readings.length > 0 
      ? readings.reduce((sum, r) => sum + r.gridIntensity, 0) / readings.length 
      : 0.42;
    const currentEmissions = calculateEmissions(totalKwh, avgIntensity);
    
    // Normalize emissions
    const adjustedEmissions = normalizeEmissions(
      currentEmissions,
      unit.area,
      unit.occupancy,
      unit.medicalFlag
    );
    
    // Calculate CPI (use quota if available, otherwise baseline)
    const quota = unit.quota !== null && unit.quota !== undefined ? unit.quota : null;
    const cpi = calculateCPI(
      adjustedEmissions,
      unit.baselineKgCO2e,
      unit.area,
      unit.occupancy,
      unit.medicalFlag,
      quota
    );
    
    // Calculate discount
    const discount = calculateDiscount(cpi);
    
    // Update unit in store
    unit.currentKgCO2e = currentEmissions;
    unit.cpi = cpi;
    unit.discount = discount;
    unit.updatedAt = new Date();
  }
}

