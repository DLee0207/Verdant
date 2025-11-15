# 🌿 Verdant Quick Start Guide

## 🚀 Quick Setup (5 minutes)

1. **Install MongoDB** (if not already installed)
   ```bash
   # macOS
   brew install mongodb-community
   brew services start mongodb-community
   ```

2. **Install Dependencies**
   ```bash
   # Backend
   cd server && npm install && cd ..
   
   # Frontend
   cd client && npm install && cd ..
   ```

3. **Start Backend** (Terminal 1)
   ```bash
   cd server
   npm run dev
   ```

4. **Start Frontend** (Terminal 2)
   ```bash
   cd client
   npm run dev
   ```

5. **Initialize Data**
   - Open http://localhost:3000
   - Click "Initialize Sample Data"
   - Wait for success message

6. **Explore Dashboards**
   - Tenant: http://localhost:3000/tenant/tenant_01
   - Landlord: http://localhost:3000/landlord/bldg_01

## 📊 Demo Accounts

**Tenants (with discount tiers):**
- tenant_01 (unit_101) - Alex Johnson - **Tier 1 (5%)**
- tenant_04 (unit_204) - Emma Wilson - **Tier 1 (5%)** (medical accommodation)
- tenant_09 (unit_401) - Robert Lee - **Tier 1 (5%)**
- tenant_02 (unit_102) - Sarah Chen - **Tier 2 (2%)**
- tenant_08 (unit_302) - Maria Garcia - **Tier 2 (2%)**
- tenant_03 (unit_103) - Mike Rodriguez - **Tier 3 (0.5%)**
- tenant_05 (unit_205) - David Kim - **Tier 3 (0.5%)**
- tenant_06 (unit_203) - Lisa Park - **No discount**
- tenant_07 (unit_301) - James Taylor - **No discount** (Commercial)
- tenant_10 (unit_402) - Jennifer Brown - **No discount** (Commercial)

**Building:**
- bldg_01

## 🎯 Key Features to Test

### Tenant Dashboard
- ✅ View CPI score and discount percentage
- ✅ See quota progress bar
- ✅ Check daily emissions chart
- ✅ View usage breakdown (pie chart)
- ✅ Read tips and acknowledge them
- ✅ See achievements and badges

### Landlord Dashboard
- ✅ View building overview stats
- ✅ See all units in a table
- ✅ Edit unit quotas (click "Edit Quota")
- ✅ Export CSV report (click "Export CSV")
- ✅ Update data to recalculate CPI scores

## 🔧 Troubleshooting

**MongoDB Connection Error:**
- Make sure MongoDB is running: `brew services list` (macOS)
- Check connection string in `server/.env`

**Port Already in Use:**
- Backend: Change `PORT` in `server/.env`
- Frontend: Change port in `client/vite.config.js`

**Data Not Loading:**
- Make sure you clicked "Initialize Sample Data"
- Check browser console for errors
- Verify backend is running on port 3001

## 📝 Notes

- Sample data includes 30 days of meter readings
- CPI scores are calculated based on improvement from baseline
- Discounts are automatically calculated based on CPI tiers
- Medical accommodations get 1.5x occupancy multiplier for normalization

