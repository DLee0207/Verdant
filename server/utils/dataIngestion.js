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
  
  const readings = [];
  for (const record of records) {
    const emissionsKg = calculateEmissions(
      parseFloat(record.kwh),
      parseFloat(record.gridIntensity)
    );
    
    const reading = {
      unitId: record.unitId,
      date: new Date(record.date),
      kwh: parseFloat(record.kwh),
      gridIntensity: parseFloat(record.gridIntensity),
      emissionsKg,
      createdAt: new Date()
    };
    
    dataStore.readings.push(reading);
    readings.push(reading);
  }
  
  return readings;
}

/**
 * Initialize sample data (units and tenants)
 */
export async function initializeSampleData() {
  // Clear existing data to allow re-initialization with new schema
  await Unit.deleteMany({});
  await Tenant.deleteMany({});
  await Reading.deleteMany({});
  console.log('Cleared existing data');
  
  const units = [
    // Tier 1 (5% discount) - CPI >= 90
    {
      id: 'unit_101',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 600,
      occupancy: 1,
      medicalFlag: false,
      baselineKgCO2e: 200 // Tier 1: will use ~18 (91% reduction = CPI ~91)
    },
    {
      id: 'unit_204',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 950,
      occupancy: 3,
      medicalFlag: true,
      baselineKgCO2e: 450 // Tier 1: will use ~40 (91% reduction = CPI ~91)
    },
    {
      id: 'unit_401',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 700,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 280 // Tier 1: will use ~25 (91% reduction = CPI ~91)
    },
    
    // Tier 2 (2% discount) - CPI >= 75
    {
      id: 'unit_102',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 800,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 320 // Tier 2: will use ~70 (78% reduction = CPI ~78)
    },
    {
      id: 'unit_302',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 1100,
      occupancy: 3,
      medicalFlag: false,
      baselineKgCO2e: 420 // Tier 2: will use ~92 (78% reduction = CPI ~78)
    },
    
    // Tier 3 (0.5% discount) - CPI >= 60
    {
      id: 'unit_103',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 650,
      occupancy: 1,
      medicalFlag: false,
      baselineKgCO2e: 190 // Tier 3: will use ~70 (63% reduction = CPI ~63)
    },
    {
      id: 'unit_205',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 850,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 300 // Tier 3: will use ~110 (63% reduction = CPI ~63)
    },
    
    // No discount - CPI < 60
    {
      id: 'unit_203',
      buildingId: 'bldg_01',
      buildingType: 'Residential',
      area: 900,
      occupancy: 2,
      medicalFlag: false,
      baselineKgCO2e: 360 // No discount: will use ~340 (5.5% reduction = CPI ~5)
    },
    {
      id: 'unit_301',
      buildingId: 'bldg_01',
      buildingType: 'Commercial',
      area: 1200,
      occupancy: 4,
      medicalFlag: false,
      baselineKgCO2e: 550 // No discount: will use ~600 (9% over = CPI ~0)
    },
    {
      id: 'unit_402',
      buildingId: 'bldg_01',
      buildingType: 'Commercial',
      area: 1000,
      occupancy: 3,
      medicalFlag: false,
      baselineKgCO2e: 480 // No discount: will use ~450 (6% reduction = CPI ~6)
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
    { id: 'tenant_10', unitId: 'unit_402', name: 'Jennifer Brown', email: 'jennifer@example.com' }
  ];
  
  for (const unitData of units) {
    const unit = {
      ...unitData,
      currentKgCO2e: 0,
      cpi: 0,
      discount: 0,
      // Set quota to 90% of baseline to encourage reduction (landlord can adjust later)
      quota: Math.round(unitData.baselineKgCO2e * 0.9 * 100) / 100,
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
        streak: unit && unit.cpi >= 75 ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 5),
        badges: []
      },
      acknowledgedTips: [],
      createdAt: new Date()
    };
    dataStore.tenants.push(tenant);
  }
  
  console.log('Sample data initialized');
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
      } else if (unit.cpi >= 75) {
        tenant.rewards.badges = ['Green Warrior'];
      } else if (unit.cpi >= 60) {
        tenant.rewards.badges = ['Eco Explorer'];
      }
    }
  });
}

