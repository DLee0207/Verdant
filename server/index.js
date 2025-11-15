import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import tenantRoutes from './routes/tenantRoutes.js';
import landlordRoutes from './routes/landlordRoutes.js';
import { ingestCSV, initializeSampleData, updateTenantRewards } from './utils/dataIngestion.js';
import { processAllUnits } from './utils/calculations.js';
import { Unit, Reading, dataStore } from './data/store.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tenant', tenantRoutes);
app.use('/api/landlord', landlordRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize data endpoint (for demo setup - FAST MODE)
app.post('/api/init', async (req, res) => {
  try {
    // Check if data already exists - if so, skip re-initialization for instant response
    // FAST MODE: Direct access to dataStore (no promise overhead)
    if (dataStore.units.length > 0) {
      // Data already exists, return immediately without re-processing
      res.json({ success: true, message: 'Data already initialized' });
      return;
    }
    
    // FAST MODE: Initialize with pre-calculated values (skips CSV and processing)
    // Make it synchronous - no need for await since it's all in-memory
    initializeSampleData();
    
    // Skip CSV ingestion and processing for demo speed
    // All values are pre-calculated in initializeSampleData()
    
    // Update tenant rewards based on pre-calculated values
    updateTenantRewards();
    
    res.json({ success: true, message: 'Data initialized (fast mode)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update data endpoint (recalculate all units)
app.post('/api/update', async (req, res) => {
  try {
    await processAllUnits(Unit, Reading);
    updateTenantRewards();
    res.json({ success: true, message: 'Data updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Using in-memory data store (no database required)');
});

