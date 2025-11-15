# 🌿 Verdant

A gamified, full-stack prototype that tracks per-unit carbon emissions from smart-meter data and rewards tenants with rent discounts when they stay below their customized quota. Inspired by Duolingo's friendly, engaging UI!

## Features

- **Tenant Dashboard**: View carbon performance, quota progress, usage breakdowns, tips, and gamified rewards
- **Landlord Dashboard**: Building overview, unit management, quota customization, and CSV export
- **Carbon Calculation Engine**: Real-time emissions tracking, normalization, and CPI scoring

## Tech Stack

- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express
- Database: MongoDB
- Charts: Recharts

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Setup

### 1. Install Dependencies

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd client
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```
MONGODB_URI=mongodb://localhost:27017/verdant
PORT=3001
```

For MongoDB Atlas, use your connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/verdant
```

### 3. Start MongoDB

If using local MongoDB:
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or run directly
mongod
```

### 4. Start the Application

#### Terminal 1 - Backend
```bash
cd server
npm run dev
```

The backend will run on `http://localhost:3001`

#### Terminal 2 - Frontend
```bash
cd client
npm run dev
```

The frontend will run on `http://localhost:3000`

### 5. Initialize Sample Data

1. Open `http://localhost:3000` in your browser
2. Click "Initialize Sample Data" button
3. This will:
   - Create 5 sample units and tenants
   - Import 30 days of meter readings from `server/data/sample_meter.csv`
   - Calculate initial CPI scores and discounts

## Usage

### Tenant Dashboard

Navigate to `/tenant/{tenant_id}` to view:
- Carbon Performance Index (CPI) score
- Current rent discount percentage
- Quota progress bar
- Daily emissions chart
- Usage breakdown (HVAC, lights, water, etc.)
- Tips and nudges
- Achievements and badges

**Demo Tenant IDs**: `tenant_01`, `tenant_02`, `tenant_03`, `tenant_04`, `tenant_05`

### Landlord Dashboard

Navigate to `/landlord/{building_id}` to view:
- Building-level CO₂e statistics
- Average CPI across all units
- Unit performance table with CPI scores
- Edit unit quotas
- Export CSV reports for ESG tracking

**Demo Building ID**: `bldg_01`

## API Endpoints

### Tenant Endpoints
- `GET /api/tenant/:id/summary` - Get tenant summary (CPI, quota, progress, discount)
- `GET /api/tenant/:id/usage` - Get daily emissions data
- `POST /api/tenant/:id/acknowledge` - Acknowledge a tip/goal

### Landlord Endpoints
- `GET /api/landlord/:building_id/overview` - Get building overview
- `GET /api/landlord/:building_id/units` - Get all units with details
- `PATCH /api/landlord/unit/:unit_id/quota` - Update unit quota
- `GET /api/landlord/:building_id/export` - Export CSV report

### Utility Endpoints
- `POST /api/init` - Initialize sample data
- `POST /api/update` - Recalculate all unit CPI scores and discounts

## Carbon Calculation Logic

1. **Emissions Calculation**: `emissions_kg = kwh * grid_intensity_factor`
2. **Normalization**: `adjusted = emissions_kg / (area * occupancy_factor)`
   - Medical accommodations get 1.5x occupancy multiplier
3. **CPI Score**: Based on improvement from baseline (0-100)
   - `CPI = 100 * (baseline - current) / baseline`
4. **Discount Tiers**:
   - CPI ≥ 90: 5% discount
   - CPI ≥ 75: 2% discount
   - CPI ≥ 60: 0.5% discount
   - CPI < 60: No discount

## Project Structure

```
verdant/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Dashboard pages
│   │   ├── api/            # API client
│   │   └── styles/         # CSS styles
├── server/                 # Node backend
│   ├── routes/             # API routes
│   ├── controllers/        # Route handlers
│   ├── models/             # MongoDB models
│   ├── utils/              # Calculation utilities
│   └── data/               # Sample CSV data
└── README.md
```

## Demo Data

The application comes with sample data for 5 units:
- `unit_101`: 600 sqft, 1 occupant
- `unit_102`: 800 sqft, 2 occupants
- `unit_203`: 900 sqft, 2 occupants
- `unit_204`: 950 sqft, 3 occupants (medical accommodation)
- `unit_301`: 1200 sqft, 4 occupants

Each unit has 30 days of simulated meter readings with realistic variations.

## Development

### Backend Development
- Server auto-reloads on file changes (using `--watch`)
- MongoDB connection is established on startup
- All calculations are performed server-side

### Frontend Development
- Hot module replacement enabled
- API proxy configured to forward `/api/*` to backend
- TailwindCSS for styling

## License

MIT

