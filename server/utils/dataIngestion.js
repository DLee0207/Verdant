import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { calculateEmissions } from './calculations.js';
import { dataStore, Unit, Tenant, Reading } from '../data/store.js';

/**
 * Ingest CSV data and create readings
 */
export async function ingestCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  // Batch push all readings at once (much faster than individual pushes)
  const readings = records.map(record => {
    const emissionsKg = calculateEmissions(
      parseFloat(record.kwh),
      parseFloat(record.gridIntensity)
    );
    
    return {
      unitId: record.unitId,
      date: new Date(record.date),
      kwh: parseFloat(record.kwh),
      gridIntensity: parseFloat(record.gridIntensity),
      emissionsKg,
      createdAt: new Date()
    };
  });
  
  // Push all at once instead of one by one
  dataStore.readings.push(...readings);
  
  return readings;
}

/**
 * Initialize sample data (units and tenants)
 * FAST MODE: Synchronous operation for instant initialization
 */
export function initializeSampleData() {
  // Clear existing data to allow re-initialization with new schema
  // Direct array clearing (faster than async operations)
  dataStore.units = [];
  dataStore.tenants = [];
  dataStore.readings = [];
  
  const units = [
    // Tier 1 (5% discount) - CPI 100-90 (≤50% of quota usage)
    {
      id: 'unit_101',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 600,
      occupancy: 1,
      medicalFlag: false,
      baselineKgCO2e: 200 // Tier 1: quota 180, will use ~99 (55% of quota = CPI 90)
    },
    {
      id: 'unit_204',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 950,
      occupancy: 3,
      medicalFlag: true,
      baselineKgCO2e: 450 // Tier 1: quota 405, will use ~223 (55% of quota = CPI 90)
    },
    {
      id: 'unit_401',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 700,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 280 // Tier 1: quota 252, will use ~139 (55% of quota = CPI 90)
    },
    
    // Tier 2 (2% discount) - CPI 90-70 (55-65% of quota usage)
    {
      id: 'unit_102',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 800,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 320 // Tier 2: quota 288, will use ~180 (62.5% of quota = CPI 75)
    },
    {
      id: 'unit_302',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 1100,
      occupancy: 3,
      medicalFlag: false,
      baselineKgCO2e: 420 // Tier 2: quota 378, will use ~236 (62.5% of quota = CPI 75)
    },
    
    // Tier 3 (0.5% discount) - CPI 70-50 (65-75% of quota usage)
    {
      id: 'unit_103',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 650,
      occupancy: 1,
      medicalFlag: false,
      baselineKgCO2e: 190 // Tier 3: quota 171, will use ~120 (70% of quota = CPI 60)
    },
    {
      id: 'unit_205',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 850,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 300 // Tier 3: quota 270, will use ~189 (70% of quota = CPI 60)
    },
    
    // No discount - CPI < 60 (>70% of quota usage)
    {
      id: 'unit_203',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 900,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 360 // No discount: quota 324, will use ~259 (80% of quota = CPI 40)
    },
    {
      id: 'unit_301',
      buildingId: 'bldg_01',
      buildingType: 'Commercial',
      area: 1200,
      occupancy: 4,
      medicalFlag: false,
      baselineKgCO2e: 550 // No discount: quota 495, will use ~446 (90% of quota = CPI 20)
    },
    {
      id: 'unit_402',
      buildingId: 'bldg_01',
      buildingType: 'Commercial',
      area: 1000,
      occupancy: 3,
      medicalFlag: false,
      baselineKgCO2e: 480 // No discount: quota 432, will use ~367 (85% of quota = CPI 30)
    },
    
    // Additional Tier 1 units
    {
      id: 'unit_501',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 750,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 250 // Tier 1: quota 225, will use ~124 (55% of quota = CPI 90)
    },
    {
      id: 'unit_502',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 550,
      occupancy: 1,
      medicalFlag: true,
      baselineKgCO2e: 180 // Tier 1: quota 162, will use ~89 (55% of quota = CPI 90)
    },
    {
      id: 'unit_503',
      buildingId: 'bldg_01',
      buildingType: 'Commercial',
      area: 850,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 380 // Tier 1: quota 342, will use ~188 (55% of quota = CPI 90)
    },
    
    // Additional Tier 2 units
    {
      id: 'unit_504',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 680,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 270 // Tier 2: quota 243, will use ~152 (62.5% of quota = CPI 75)
    },
    {
      id: 'unit_505',
      buildingId: 'bldg_01',
      buildingType: 'Commercial',
      area: 1050,
      occupancy: 3,
      medicalFlag: false,
      baselineKgCO2e: 400 // Tier 2: quota 360, will use ~225 (62.5% of quota = CPI 75)
    },
    {
      id: 'unit_506',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 920,
      occupancy: 3,
      medicalFlag: true,
      baselineKgCO2e: 420 // Tier 2: quota 378, will use ~236 (62.5% of quota = CPI 75)
    },
    
    // Additional Tier 3 units
    {
      id: 'unit_507',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 580,
      occupancy: 1,
      medicalFlag: false,
      baselineKgCO2e: 170 // Tier 3: quota 153, will use ~107 (70% of quota = CPI 60)
    },
    {
      id: 'unit_508',
      buildingId: 'bldg_01',
      buildingType: 'Commercial',
      area: 950,
      occupancy: 4,
      medicalFlag: false,
      baselineKgCO2e: 440 // Tier 3: quota 396, will use ~277 (70% of quota = CPI 60)
    },
    
    // Additional No discount units
    {
      id: 'unit_509',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 780,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 310 // No discount: quota 279, will use ~251 (90% of quota = CPI 20)
    },
    {
      id: 'unit_510',
      buildingId: 'bldg_01',
      buildingType: 'Commercial',
      area: 1150,
      occupancy: 5,
      medicalFlag: false,
      baselineKgCO2e: 520 // No discount: quota 468, will use ~421 (90% of quota = CPI 20)
    },
    
    // Inactive units (no tenants, no data - for demo purposes)
    {
      id: 'unit_511',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 650,
      occupancy: 1,
      medicalFlag: false,
      baselineKgCO2e: 200,
      inactive: true
    },
    {
      id: 'unit_512',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 800,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 300,
      inactive: true
    },
    {
      id: 'unit_513',
      buildingId: 'bldg_01',
      buildingType: 'Commercial',
      area: 900,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 350,
      inactive: true
    },
    {
      id: 'unit_514',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 720,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 260,
      inactive: true
    },
    {
      id: 'unit_515',
      buildingId: 'bldg_01',
      buildingType: 'Commercial',
      area: 1100,
      occupancy: 4,
      medicalFlag: false,
      baselineKgCO2e: 480,
      inactive: true
    },
    {
      id: 'unit_516',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 580,
      occupancy: 1,
      medicalFlag: false,
      baselineKgCO2e: 190,
      inactive: true
    },
    {
      id: 'unit_517',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 850,
      occupancy: 3,
      medicalFlag: true,
      baselineKgCO2e: 400,
      inactive: true
    },
    {
      id: 'unit_518',
      buildingId: 'bldg_01',
      buildingType: 'Commercial',
      area: 980,
      occupancy: 3,
      medicalFlag: false,
      baselineKgCO2e: 420,
      inactive: true
    },
    {
      id: 'unit_519',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 690,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 250,
      inactive: true
    },
    {
      id: 'unit_520',
      buildingId: 'bldg_01',
      buildingType: 'Commercial',
      area: 1050,
      occupancy: 4,
      medicalFlag: false,
      baselineKgCO2e: 460,
      inactive: true
    }
  ];
  
  const tenants = [
    { id: 'tenant_01', unitId: 'unit_101', name: 'Alex Johnson', email: 'alex@example.com' },
    { id: 'tenant_02', unitId: 'unit_102', name: 'Sarah Chen', email: 'sarah@example.com' },
    { id: 'tenant_03', unitId: 'unit_103', name: 'Mike Rodriguez', email: 'mike@example.com' },
    { id: 'tenant_04', unitId: 'unit_204', name: 'Emma Wilson', email: 'emma@example.com' },
    { id: 'tenant_05', unitId: 'unit_205', name: 'David Kim', email: 'david@example.com' },
    { id: 'tenant_06', unitId: 'unit_203', name: 'Lisa Park', email: 'lisa@example.com' },
    { id: 'tenant_07', unitId: 'unit_301', name: 'James Taylor', email: 'james@example.com' },
    { id: 'tenant_08', unitId: 'unit_302', name: 'Maria Garcia', email: 'maria@example.com' },
    { id: 'tenant_09', unitId: 'unit_401', name: 'Robert Lee', email: 'robert@example.com' },
    { id: 'tenant_10', unitId: 'unit_402', name: 'Jennifer Brown', email: 'jennifer@example.com' },
    { id: 'tenant_11', unitId: 'unit_501', name: 'Chris Anderson', email: 'chris@example.com' },
    { id: 'tenant_12', unitId: 'unit_502', name: 'Patricia Martinez', email: 'patricia@example.com' },
    { id: 'tenant_13', unitId: 'unit_503', name: 'Kevin White', email: 'kevin@example.com' },
    { id: 'tenant_14', unitId: 'unit_504', name: 'Amanda Thompson', email: 'amanda@example.com' },
    { id: 'tenant_15', unitId: 'unit_505', name: 'Daniel Harris', email: 'daniel@example.com' },
    { id: 'tenant_16', unitId: 'unit_506', name: 'Michelle Clark', email: 'michelle@example.com' },
    { id: 'tenant_17', unitId: 'unit_507', name: 'Ryan Lewis', email: 'ryan@example.com' },
    { id: 'tenant_18', unitId: 'unit_508', name: 'Nicole Walker', email: 'nicole@example.com' },
    { id: 'tenant_19', unitId: 'unit_509', name: 'Brandon Hall', email: 'brandon@example.com' },
    { id: 'tenant_20', unitId: 'unit_510', name: 'Stephanie Allen', email: 'stephanie@example.com' }
  ];
  
  // Define unique Eco Scores for each active unit (distributed across tiers)
  // Tier 1 (100-90): 6 units with scores 100, 98, 96, 95, 93, 91
  // Tier 2 (90-70): 6 units with scores 88, 85, 82, 78, 76, 72
  // Tier 3 (70-50): 4 units with scores 68, 65, 62, 55
  // No discount (<50): 4 units with scores 45, 35, 28, 20
  // Special: unit_101 (tenant_01) gets score 92 for demo
  const ecoScores = [
    100, 98, 96, 95, 93, 91,  // Tier 1 (6 units)
    88, 85, 82, 78, 76, 72,  // Tier 2 (6 units)
    68, 65, 62, 55,          // Tier 3 (4 units)
    45, 35, 28, 20           // No discount (4 units)
  ];
  let ecoScoreIndex = 0;
  
  for (const unitData of units) {
    // Pre-calculate quota (90% of baseline)
    const quota = Math.round(unitData.baselineKgCO2e * 0.9 * 100) / 100;
    
    // Skip inactive units (no data, no calculations)
    if (unitData.inactive) {
      const unit = {
        ...unitData,
        currentKgCO2e: 0,
        cpi: 0,
        discount: 0,
        quota,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dataStore.units.push(unit);
      continue;
    }
    
    // Special case: tenant_01 (unit_101) gets score 92 for demo (not perfect)
    let cpi;
    if (unitData.id === 'unit_101') {
      cpi = 92; // tenant_01 gets 92 for demo
    } else {
      // Assign unique Eco Score from array
      cpi = ecoScores[ecoScoreIndex++];
    }
    
    // Calculate discount based on CPI
    let discount;
    if (cpi >= 90) discount = 0.05;
    else if (cpi >= 70) discount = 0.02;
    else if (cpi >= 50) discount = 0.005;
    else discount = 0;
    
    // Calculate current emissions based on CPI
    // CPI formula: CPI = 200 - (2 * usagePercentage) when usage > 50%
    // Or CPI = 100 when usage <= 50%
    // Reverse: usagePercentage = (200 - CPI) / 2 when CPI < 100
    let usagePercentage;
    if (cpi >= 100) {
      usagePercentage = 50; // Perfect score = 50% usage
    } else {
      usagePercentage = (200 - cpi) / 2;
    }
    
    const currentKgCO2e = Math.round(quota * (usagePercentage / 100) * 100) / 100;
    
    const unit = {
      ...unitData,
      currentKgCO2e,
      cpi,
      discount,
      quota,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    dataStore.units.push(unit);
  }
  
  for (const tenantData of tenants) {
    // Get the unit to calculate realistic rewards (will be updated after processing)
    const unit = dataStore.units.find(u => u.id === tenantData.unitId);
    const tenant = {
      ...tenantData,
      rewards: {
        currentDiscount: 0, // Will be updated after processing
        lifetimeSavedUSD: 0,
        streak: unit && unit.cpi >= 70 ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 5),
        badges: []
      },
      acknowledgedTips: [],
      createdAt: new Date()
    };
    dataStore.tenants.push(tenant);
  }
  
  // Sample data initialized (no console.log for speed)
}

/**
 * Update tenant rewards after units are processed
 */
export function updateTenantRewards() {
  dataStore.tenants.forEach(tenant => {
    const unit = dataStore.units.find(u => u.id === tenant.unitId);
    if (unit) {
      tenant.rewards.currentDiscount = unit.discount;
      tenant.rewards.lifetimeSavedUSD = Math.round((unit.discount * 2000 * 3) * 100) / 100; // Assuming $2000/month rent, 3 months
      
      // Update badges based on CPI
      if (unit.cpi >= 90) {
        tenant.rewards.badges = ['Eco Champion'];
      } else if (unit.cpi >= 70) {
        tenant.rewards.badges = ['Green Warrior'];
      } else if (unit.cpi >= 50) {
        tenant.rewards.badges = ['Eco Explorer'];
      }
    }
  });
}

