# 🌿 Verdant

A gamified, full-stack prototype that tracks per-unit carbon emissions from smart-meter data and rewards tenants with rent discounts when they stay below their customized quota. Inspired by Duolingo's friendly, engaging UI!

## 1. Project Overview

**What does it do?**

Verdant is a carbon emissions tracking and gamification platform that incentivizes sustainable living through rent discounts. The platform provides:

- **For Tenants**: 
  - Real-time carbon performance tracking with an Eco Score (CPI)
  - Personalized AI-powered energy-saving suggestions
  - Gamified rewards system with XP, levels, badges, and streaks
  - Rent discounts based on performance (up to 5% off)
  - Visual dashboards showing usage breakdowns, progress charts, and achievements

- **For Landlords**:
  - Building-wide emissions overview and analytics
  - Unit-by-unit performance monitoring
  - Customizable quota management per unit
  - CSV export for ESG reporting
  - Real-time CPI score tracking across all units

The platform uses an innovative **Carbon Performance Index (CPI)** scoring system that rewards tenants for using 50% or less of their monthly emissions quota, with discount tiers ranging from 0.5% to 5% based on performance.

## 2. Installation/Setup Instructions

**How do we run it?**

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key (optional, for AI-powered suggestions)

### Step 1: Clone the Repository

```bash
git clone https://github.com/DLee0207/Verdant.git
cd Verdant
```

### Step 2: Install Dependencies

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

### Step 3: Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
# Server Configuration
PORT=3001

# Google Gemini API Configuration (Optional - for AI-powered suggestions)
# Get your API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

**Note**: The Gemini API key is optional. The app will work without it, but AI-powered suggestions won't be available. Gemini API has a generous free tier for development.

### Step 4: Start the Application

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```
The backend will run on `http://localhost:3001`

**Terminal 2 - Frontend Server:**
```bash
cd client
npm run dev
```
The frontend will run on `http://localhost:3000`

### Step 5: Initialize Sample Data

1. Open `http://localhost:3000` in your browser
2. Click "Initialize Sample Data" button
3. This will create 30 sample units (20 active, 10 inactive) with pre-calculated CPI scores and discounts

### Restarting the Servers

**To restart the backend server:**
1. In the terminal where the backend is running, press `Ctrl+C` (or `Cmd+C` on Mac) to stop it
2. Run `npm run dev` again:
   ```bash
   cd server
   npm run dev
   ```

**To restart the frontend server:**
1. In the terminal where the frontend is running, press `Ctrl+C` (or `Cmd+C` on Mac) to stop it
2. Run `npm run dev` again:
   ```bash
   cd client
   npm run dev
   ```

**Note**: After updating the `.env` file (e.g., adding a Gemini API key), you **must restart the backend server** for the changes to take effect.

## 3. Usage Guide

**How do we use it once it's running?**

### Tenant Dashboard

Navigate to `/tenant/{tenant_id}` to view your personalized dashboard:

**Features:**
- **Level Progress Card**: Shows your current level, XP, and progress to next level
- **Main Stats**: 
  - Eco Score (CPI) out of 100
  - Current rent discount percentage
  - Current monthly CO₂e emissions
- **Discount Tiers Info**: Visual breakdown of all discount tiers (Tier 1: 5%, Tier 2: 2%, Tier 3: 0.5%)
- **Quota Progress**: Progress bar showing usage vs quota with helpful explanations
- **Daily Progress Chart**: 30-day emissions trend visualization
- **Usage Breakdown**: Pie chart showing emissions by category (HVAC, Lighting, Water, Appliances, Other)
- **AI-Powered Suggestions**: Personalized energy-saving recommendations (requires Gemini API key)
- **Your Achievements**: Badges earned for reaching milestones

**Demo Tenant IDs**: 
- `tenant_01` through `tenant_10` (various discount tiers)

**Example URLs:**
- `http://localhost:3000/tenant/tenant_01` - Tier 1 discount (Eco Score: 92)
- `http://localhost:3000/tenant/tenant_02` - Tier 2 discount
- `http://localhost:3000/tenant/tenant_03` - Tier 3 discount

### Landlord Dashboard

Navigate to `/landlord/{building_id}` to view building management dashboard:

**Features:**
- **Building Overview Cards**:
  - Total CO₂e This Month (with percentage vs baseline)
  - Average Eco Score across all units
  - Total Units (showing active/inactive breakdown)
- **Unit Performance Table**: 
  - Collapsible unit details with expand/collapse functionality
  - Shows: Building Type, Tenant, Area, Eco Score, Usage vs Quota, Discount Tier
  - "See More" dropdown to show all units (initially shows 5)
  - Edit quota functionality with instant recalculation
- **CSV Export**: Download building performance data for ESG reporting

**Demo Building ID**: `bldg_01`

**Example URL:**
- `http://localhost:3000/landlord/bldg_01`

### Key Interactions

- **Mark Complete**: Click "Mark Complete" on AI suggestions to mark them as done (shows checkmark)
- **Edit Quota**: In Landlord Dashboard, expand a unit and click "Edit Quota" to adjust the monthly limit
- **View Details**: Click on any unit row in the Landlord Dashboard to expand and see full details

## 4. Tech Stack

**What technologies, frameworks, and APIs did you use?**

### Programming Languages
- **JavaScript (ES6+)**: Primary language for both frontend and backend
- **JSX**: React component syntax
- **CSS**: Custom styling with TailwindCSS utilities

### Frontend Technologies
- **React 18.2.0**: UI library for building component-based interfaces
- **Vite 5.0.8**: Fast build tool and development server
- **React Router DOM 6.20.1**: Client-side routing and navigation
- **Axios 1.6.2**: HTTP client for API requests
- **Recharts 2.10.3**: Charting library for data visualization (LineChart, PieChart, AreaChart)

### UI Frameworks & Libraries
- **TailwindCSS 3.3.6**: Utility-first CSS framework
- **shadcn/ui**: Pre-built, accessible React components (Card, Button, Badge)
- **Radix UI**: Headless UI primitives (@radix-ui/react-slot, @radix-ui/react-dialog, @radix-ui/react-label)
- **Lucide React 0.553.0**: Icon library (replaced emojis with professional icons)
- **class-variance-authority**: For component variant management
- **tailwind-merge**: Utility for merging Tailwind classes
- **tailwindcss-animate**: Animation utilities

### Backend Technologies
- **Node.js (v18+)**: JavaScript runtime environment
- **Express 4.18.2**: Web application framework for RESTful APIs
- **dotenv 16.3.1**: Environment variable management

### AI & APIs
- **Google Gemini API (@google/generative-ai 0.24.1)**: AI-powered personalized suggestions
  - Model: Gemini 2.0 Flash
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
  - Free tier available for development

### Data Storage
- **In-Memory Data Store**: Custom implementation for MVP (no database required)
  - Mimics MongoDB query patterns for easy migration path
  - Fast, synchronous operations for demo purposes
  - Stores: Units, Tenants, Readings

### Data Processing
- **csv-parse 5.5.3**: CSV file parsing and ingestion
- **Custom Calculation Engine**: Real-time carbon emissions, CPI scoring, and discount calculations

### Development Tools
- **Vite**: Hot module replacement (HMR) for instant updates
- **Node --watch**: Auto-reload backend on file changes
- **PostCSS 8.4.32**: CSS processing
- **Autoprefixer 10.4.16**: Automatic vendor prefixing

### Deployment Platforms
- **Local Development**: Node.js servers (localhost:3000 for frontend, localhost:3001 for backend)
- **Git/GitHub**: Version control and code repository
- **Ready for**: Vercel (frontend), Railway/Heroku/Render (backend), or Docker containerization

### Other Tools & Services
- **Google Fonts**: Sora, Poppins, Space Grotesk typography
- **Git**: Version control
- **npm**: Package management

## 5. AI API Integration (Google Gemini)

**How did we use AI in this project?**

**Note**: While the hackathon mentioned Claude API, we integrated **Google Gemini API** instead due to its generous free tier and excellent performance for our use case.

### Integration Overview

We integrated Google Gemini 2.0 Flash to generate **personalized, contextual energy-saving suggestions** for each tenant based on their unique usage patterns and performance data.

### Implementation Details

**Location**: `server/utils/geminiService.js`

**How it works:**

1. **Data Collection**: When a tenant views their dashboard, the system collects:
   - Current Eco Score (CPI) and performance metrics
   - Energy usage breakdown by category (HVAC, Lighting, Water, Appliances, Other)
   - Unit characteristics (size, occupancy, building type, medical accommodations)
   - Current discount tier and quota status
   - Usage vs quota percentage

2. **AI Prompt Engineering**: We send a structured prompt to Gemini that includes:
   - Tenant and unit information
   - Current performance metrics
   - Energy breakdown percentages
   - Instructions to generate 3-4 personalized, actionable suggestions
   - Format requirements (JSON with title, description, category, impact, difficulty, XP)

3. **Response Processing**: 
   - Gemini returns JSON-formatted suggestions
   - We parse and validate the response
   - Add unique IDs and ensure required fields
   - Return structured suggestion objects to the frontend

4. **Frontend Display**: 
   - Suggestions appear in a dedicated "AI-Powered Suggestions" section
   - Each suggestion shows: category icon, impact estimate, difficulty level, XP reward
   - Users can mark suggestions as complete (hardcoded local state)

### API Endpoint

- `GET /api/tenant/:id/ai-suggestions` - Fetches AI-generated suggestions for a specific tenant

### Key Features

- **Personalization**: Each tenant gets unique suggestions based on their actual usage patterns
- **Context-Aware**: AI considers unit size, occupancy, building type, and current performance
- **Actionable**: Suggestions include specific steps, impact estimates, and difficulty levels
- **Gamified**: Each suggestion has an XP reward for completion
- **Graceful Degradation**: App continues to work if API key is missing or invalid

### Example AI Suggestion

```json
{
  "title": "Optimize HVAC Settings",
  "description": "Your HVAC accounts for 45% of your emissions. Lower your thermostat by 2°F during winter months to save approximately 8.5 kg CO₂e per month.",
  "category": "HVAC",
  "impact": 8.5,
  "difficulty": "Easy",
  "xp": 15
}
```

### Setup Instructions

See `GEMINI_SETUP.md` for detailed setup instructions. Quick steps:

1. Get API key from: https://aistudio.google.com/app/apikey
2. Add to `server/.env`: `GEMINI_API_KEY=your_key_here`
3. Restart backend server

## 6. Challenges & Solutions

**What obstacles did you face and how did you overcome them?**

### Technical Obstacles Encountered

#### 1. **Performance Issues with Data Processing**
**Challenge**: Initial implementation was slow, taking 20+ seconds to load dashboards and edit quotas. CSV processing and calculations were inefficient.

**Solution**: 
- Implemented "fast demo mode" with pre-calculated CPI scores and discounts
- Optimized data processing with single-pass algorithms and pre-grouped data structures
- Switched from async database queries to synchronous in-memory operations
- Added batch operations for CSV ingestion
- **Result**: Dashboard loading reduced from 20+ seconds to <1 second

#### 2. **AI API Integration & Model Compatibility**
**Challenge**: Initially integrated OpenAI API, but encountered quota issues. When switching to Gemini, discovered model name incompatibility (gemini-1.5-flash not available).

**Solution**:
- Pivoted from OpenAI to Google Gemini API for better free tier access
- Discovered available models via REST API (`/v1/models` endpoint)
- Updated to use `gemini-2.0-flash` model (the correct model for the API)
- Implemented graceful degradation - app works without API key
- Added comprehensive error handling with specific error messages

#### 3. **UI Text Visibility Issues**
**Challenge**: Multiple instances of light text on light backgrounds making content invisible (badges, buttons, labels).

**Solution**:
- Systematically audited all UI components for contrast issues
- Fixed all badge variants (outline, secondary) with explicit dark text colors
- Updated button text colors to ensure visibility
- Standardized on `bg-gray-200 text-gray-800` for light backgrounds
- Applied fixes across Tenant Dashboard, Landlord Dashboard, and all interactive elements

#### 4. **Date Filtering Mismatch**
**Challenge**: Sample data was from January 2025, but calculations filtered for current calendar month, resulting in empty results.

**Solution**:
- Modified calculation logic to dynamically determine the relevant month from available data
- Changed from using `new Date()` to finding the most recent date in readings
- Ensured calculations work with historical data regardless of current system date

#### 5. **Dynamic Quota Updates Not Reflecting**
**Challenge**: When landlords edited unit quotas, the Eco Score and other metrics didn't update dynamically.

**Solution**:
- Created `processSingleUnit` function for efficient single-unit recalculation
- Updated backend to return all recalculated metrics in the response
- Modified frontend to immediately update local state instead of refetching all data
- **Result**: Instant updates with no loading delay

#### 6. **CPI Algorithm Refinement**
**Challenge**: Initial algorithm required only 10% of quota usage for Tier 1, which was unrealistic.

**Solution**:
- Redesigned algorithm with inverted cap at 50% usage
- New formula: 50% or less = 100 CPI, then -2 points per 1% over 50%
- Updated all discount tier ranges (Tier 1: 100-90, Tier 2: 90-70, Tier 3: 70-50)
- Adjusted all sample data to reflect realistic usage patterns across all tiers

### What We Learned

1. **Performance Optimization**: Learned the importance of pre-calculating data for demos and using efficient data structures (maps, single-pass algorithms)

2. **API Integration**: Gained experience with multiple AI APIs (OpenAI → Gemini) and the importance of checking model availability and API versions

3. **UI/UX Design**: Discovered the critical importance of contrast ratios and accessibility in dark mode interfaces

4. **State Management**: Learned to optimize React state updates to avoid unnecessary re-renders and API calls

5. **Error Handling**: Implemented graceful degradation patterns so features fail silently when optional services (like AI) are unavailable

### What We'd Do Differently Next Time

1. **Database from Start**: While in-memory storage worked for MVP, we'd use a proper database (PostgreSQL or MongoDB) from the beginning for better data persistence and querying

2. **TypeScript**: Would use TypeScript for better type safety and developer experience, especially for complex calculation logic

3. **Testing**: Would implement unit tests for calculation functions and integration tests for API endpoints

4. **API Versioning**: Would implement API versioning from the start to handle future changes gracefully

5. **Caching Strategy**: Would implement Redis caching for frequently accessed data like building overviews

6. **Error Monitoring**: Would integrate error tracking (Sentry) and logging services for production debugging

7. **Component Library**: Would build a more comprehensive component library earlier to ensure consistency across the app

## 7. Future Plans

**What would you build next with more time?**

### Short-Term Enhancements (1-2 weeks)

1. **Real-Time Data Integration**
   - Connect to actual smart meter APIs (e.g., Nest, Ecobee, Sense)
   - WebSocket support for live energy usage updates
   - Push notifications for quota warnings

2. **Enhanced Gamification**
   - Social features: leaderboards, team challenges, building-wide competitions
   - More badge types and achievement categories
   - Streak tracking with visual calendar
   - Seasonal challenges and special events

3. **Advanced Analytics**
   - Predictive analytics for future emissions
   - Anomaly detection for unusual usage patterns
   - Comparative analytics (how you compare to similar units)
   - Historical trend analysis with year-over-year comparisons

4. **Home Integration System**
   - Using Alexa or other physical home devices to more accurately track ommissions rather than using data and patterns


### Medium-Term Features (1-2 months)

4. **Mobile Application**
   - Native iOS and Android apps
   - Push notifications for daily tips and achievements
   - Quick actions (mark tips complete, view progress)
   - Barcode scanning for energy-efficient product recommendations

5. **Smart Home Integration**
   - IoT device integration (smart thermostats, lights, plugs)
   - Automated energy-saving actions based on AI suggestions
   - Integration with home automation platforms (HomeKit, Alexa, Google Home)

6. **Expanded AI Features**
   - Natural language queries ("How can I save more this month?")
   - Personalized energy reports with AI-generated insights
   - Conversational AI assistant for energy questions
   - Predictive maintenance suggestions for appliances

7. **Financial Features**
   - Integration with payment systems for automatic rent adjustments
   - Savings calculator showing lifetime savings
   - Carbon offset marketplace
   - Energy bill integration and comparison

### Long-Term Vision (3-6 months)

8. **Multi-Building Platform**
   - Support for property management companies with multiple buildings
   - Portfolio-wide analytics and reporting
   - Cross-building competitions and challenges
   - Corporate sustainability dashboards

9. **Community Features**
   - Tenant forums and discussion boards
   - Energy-saving tips sharing
   - Local sustainability events and workshops
   - Partnership with local green energy providers

10. **Advanced Carbon Tracking**
    - Scope 1, 2, 3 emissions tracking
    - Integration with carbon credit systems
    - Lifecycle analysis for building materials
    - Water usage tracking and optimization

11. **Machine Learning Enhancements**
    - Personalized quota recommendations using ML
    - Anomaly detection for equipment failures
    - Predictive maintenance scheduling
    - Optimal energy usage pattern learning

12. **Enterprise Features**
    - White-label solutions for property management companies
    - Custom branding and theming
    - Advanced reporting and analytics dashboards
    - API access for third-party integrations

## 8. Team Members & Contributions

**Who built what?**

### Development Team

**Primary Developes**: Dave Lee and Evan Walker
- Full-stack development (frontend and backend)
- UI/UX design and implementation
- AI integration (Gemini API)
- Carbon calculation engine
- Data modeling and architecture
- Performance optimization

### Key Contributions

- **Frontend Development**: React components, routing, state management, data visualization
- **Backend Development**: RESTful API design, calculation logic, data processing
- **AI Integration**: Gemini API integration, prompt engineering, response parsing
- **UI/UX Design**: Duolingo-inspired design system, gamification elements, responsive layouts
- **Performance Optimization**: Fast demo mode, efficient algorithms, optimized data structures
- **Documentation**: Comprehensive README, setup guides, API documentation

### Technologies Mastered

- React ecosystem (Hooks, Router, State Management)
- Node.js and Express.js
- Google Gemini API integration
- TailwindCSS and modern CSS techniques
- Data visualization with Recharts
- Performance optimization techniques
- UI/UX design principles

---

## Additional Resources

- **Setup Guide**: See `GEMINI_SETUP.md` for detailed AI integration setup
- **API Documentation**: See "API Endpoints" section above
- **Carbon Calculation**: See "Carbon Calculation Logic" section above

## License

MIT
