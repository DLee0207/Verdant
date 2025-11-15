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
 * Based on quota usage percentage with inverted cap at 50%
 * - 50% or less of quota = 100 CPI (perfect score)
 * - Every 1% over 50% = -2 CPI points
 * - Formula: CPI = 100 if usage <= 50%, else CPI = 200 - (2 * usagePercentage)
 * 
 * @param {number} currentEmissionsKg - Raw current emissions in kg CO2e (not normalized)
 * @param {number} baselineKgCO2e - Baseline emissions (fallback if no quota)
 * @param {number} area - Unit area (not used in new algorithm but kept for compatibility)
 * @param {number} occupancy - Unit occupancy (not used in new algorithm but kept for compatibility)
 * @param {boolean} medicalFlag - Medical flag (not used in new algorithm but kept for compatibility)
 * @param {number|null} quotaKgCO2e - Quota emissions in kg CO2e
 */
export function calculateCPI(currentEmissionsKg, baselineKgCO2e, area, occupancy, medicalFlag, quotaKgCO2e = null) {
  // Use quota if available and valid, otherwise use baseline
  const targetKgCO2e = (quotaKgCO2e !== null && quotaKgCO2e !== undefined && quotaKgCO2e > 0) 
    ? quotaKgCO2e 
    : baselineKgCO2e;
  
  // Prevent division by zero
  if (targetKgCO2e <= 0) {
    return 0;
  }
  
  // Calculate usage percentage (current emissions vs quota/baseline)
  const usagePercentage = (currentEmissionsKg / targetKgCO2e) * 100;
  
  // New algorithm: inverted cap at 50%
  if (usagePercentage <= 50) {
    return 100; // Perfect score for using 50% or less
  } else {
    // For every 1% over 50%, lose 2 CPI points
    const cpi = 200 - (2 * usagePercentage);
    return Math.max(0, Math.round(cpi)); // Cap at 0 minimum
  }
}

/**
 * Calculate discount based on CPI score
 * Tier 1: CPI 100-90 (5% discount)
 * Tier 2: CPI 90-70 (2% discount)
 * Tier 3: CPI 70-50 (0.5% discount)
 */
export function calculateDiscount(cpi) {
  if (cpi >= 90) return 0.05;  // Tier 1: 100-90
  if (cpi >= 70) return 0.02;  // Tier 2: 90-70
  if (cpi >= 50) return 0.005; // Tier 3: 70-50
  return 0; // No discount: < 50
}

/**
 * Process a single unit and update its CPI and discount
 */
export async function processSingleUnit(unit, allReadings, startOfMonth) {
  // Get readings for this unit from the month - avoid creating new Date objects
  const startOfMonthTime = startOfMonth.getTime();
  const readings = allReadings.filter(r => {
    if (r.unitId !== unit.id) return false;
    const readingTime = r.date instanceof Date ? r.date.getTime() : new Date(r.date).getTime();
    return readingTime >= startOfMonthTime;
  });
  
  // Calculate total emissions for the month
  const totalKwh = readings.reduce((sum, r) => sum + r.kwh, 0);
  const avgIntensity = readings.length > 0 
    ? readings.reduce((sum, r) => sum + r.gridIntensity, 0) / readings.length 
    : 0.42;
  const currentEmissions = calculateEmissions(totalKwh, avgIntensity);
  
  // Calculate CPI using raw emissions (new algorithm: usage percentage vs quota)
  const quota = unit.quota !== null && unit.quota !== undefined ? unit.quota : null;
  const cpi = calculateCPI(
    currentEmissions, // Use raw emissions for usage percentage calculation
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
  
  return unit;
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
    // Find the most recent date efficiently - use existing Date objects
    let maxTimestamp = 0;
    for (const reading of allReadings) {
      // reading.date is already a Date object, just get timestamp
      const timestamp = reading.date instanceof Date ? reading.date.getTime() : new Date(reading.date).getTime();
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
  
  // Pre-filter readings by month once (more efficient) - avoid creating new Date objects
  const startOfMonthTime = startOfMonth.getTime();
  const monthReadings = allReadings.filter(r => {
    const readingTime = r.date instanceof Date ? r.date.getTime() : new Date(r.date).getTime();
    return readingTime >= startOfMonthTime;
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
    
    // Calculate CPI using raw emissions (new algorithm doesn't use normalization)
    const quota = unit.quota !== null && unit.quota !== undefined ? unit.quota : null;
    const cpi = calculateCPI(
      currentEmissions, // Use raw emissions, not normalized
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

