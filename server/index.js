import express from 'express';
import cors from 'cors';
import tenantRoutes from './routes/tenantRoutes.js';
import landlordRoutes from './routes/landlordRoutes.js';
import { ingestCSV, initializeSampleData, updateTenantRewards } from './utils/dataIngestion.js';
import { processAllUnits } from './utils/calculations.js';
import { Unit, Reading } from './data/store.js';
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

// Initialize data endpoint (for demo setup)
app.post('/api/init', async (req, res) => {
  try {
    // Initialize sample units and tenants
    await initializeSampleData();
    
    // Ingest CSV data
    const csvPath = path.join(__dirname, 'data', 'sample_meter.csv');
    await ingestCSV(csvPath);
    
    // Process all units to calculate CPI and discounts
    await processAllUnits(Unit, Reading);
    
    // Update tenant rewards based on calculated values
    updateTenantRewards();
    
    res.json({ success: true, message: 'Data initialized and processed' });
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

