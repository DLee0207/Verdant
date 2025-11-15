import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { 
  Building2, Globe, Award, Home, BarChart3, RefreshCw, 
  Download, Edit, Check, X, DollarSign, Loader2, ChevronDown, ChevronUp, TrendingUp, TrendingDown
} from 'lucide-react';

// Count-up animation hook
function useCountUp(end, duration = 2000, start = 0) {
  const [count, setCount] = useState(start);
  const prevEndRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (end === null || end === undefined) {
      setCount(start);
      return;
    }
    
    // Reset if end value changed
    if (prevEndRef.current !== end) {
      setCount(start);
      prevEndRef.current = end;
    }
    
    const startTime = Date.now();
    const startValue = start;
    const endValue = end;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOut;
      
      setCount(current);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [end, duration, start]);

  return Math.round(count * 10) / 10;
}

// Circular Progress Component
function CircularProgress({ value, max = 100, size = 80, strokeWidth = 8, color = '#58cc02', children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default function LandlordDashboard() {
  const { buildingId } = useParams();
  const [overview, setOverview] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUnit, setEditingUnit] = useState(null);
  const [quotaValue, setQuotaValue] = useState('');
  const [expandedUnits, setExpandedUnits] = useState(new Set());
  const [showAllUnits, setShowAllUnits] = useState(false);
  
  // Count-up animations
  const animatedCO2 = useCountUp(overview?.totalCO2eThisMonth, 2000);
  const animatedCPI = useCountUp(overview?.averageCPI, 2000);
  const animatedUnits = useCountUp(overview?.activeUnits || overview?.totalUnits, 1500);
  const totalUnits = overview?.totalUnits || 30;
  const activeUnits = overview?.activeUnits || overview?.totalUnits || 20;

  useEffect(() => {
    fetchData();
  }, [buildingId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, unitsRes] = await Promise.all([
        api.get(`/landlord/${buildingId}/overview`),
        api.get(`/landlord/${buildingId}/units`)
      ]);
      setOverview(overviewRes.data);
      setUnits(unitsRes.data.units);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuota = async (unitId) => {
    try {
      const response = await api.patch(`/landlord/unit/${unitId}/quota`, {
        quota: parseFloat(quotaValue)
      });
      
      // Immediately update the unit in the state with the new values
      setUnits(prevUnits => 
        prevUnits.map(unit => 
          unit.id === unitId 
            ? { 
                ...unit, 
                quota: response.data.unit.quota,
                cpi: response.data.unit.cpi,
                discount: response.data.unit.discount,
                currentKgCO2e: response.data.unit.currentKgCO2e,
                baselineKgCO2e: response.data.unit.baselineKgCO2e,
                usageVsQuota: response.data.unit.usageVsQuota,
                discountTier: response.data.unit.discountTier
              }
            : unit
        )
      );
      
      setEditingUnit(null);
      setQuotaValue('');
      
      // No need to refetch all data - we already updated the state immediately
    } catch (error) {
      console.error('Error updating quota:', error);
      alert('Error updating quota: ' + error.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/landlord/${buildingId}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `verdant-report-${buildingId}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV: ' + error.message);
    }
  };

  const handleUpdateData = async () => {
    try {
      await api.post('/update');
      fetchData();
      alert('Data updated successfully!');
    } catch (error) {
      console.error('Error updating data:', error);
      alert('Error updating data: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-xl font-semibold text-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              Loading building data...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="border-0 shadow-xl border-destructive">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">Error loading data</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getDiscountTierVariant = (tier) => {
    if (tier.includes('Tier 1')) return 'verdant';
    if (tier.includes('Tier 2')) return 'default';
    if (tier.includes('Tier 3')) return 'secondary';
    return 'outline';
  };

  const getDiscountTierClassName = (tier) => {
    if (tier.includes('Tier 1')) return ''; // verdant variant is fine
    if (tier.includes('Tier 2')) return ''; // default variant is fine
    if (tier.includes('Tier 3')) return 'bg-gray-200 text-gray-800'; // Fix secondary variant
    return 'bg-gray-200 text-gray-800 border-gray-400'; // Fix outline variant
  };

  const getCPIColor = (cpi) => {
    if (cpi >= 90) return 'text-primary';      // Tier 1: 100-90
    if (cpi >= 70) return 'text-duolingo-blue'; // Tier 2: 90-70
    if (cpi >= 50) return 'text-duolingo-yellow'; // Tier 3: 70-50
    return 'text-destructive';                  // No discount: < 50
  };

  const toggleUnit = (unitId) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId);
    } else {
      newExpanded.add(unitId);
    }
    setExpandedUnits(newExpanded);
  };

  // Generate mini trend data (simulated - in real app, fetch historical data)
  const trendData = units.length > 0 ? units.slice(0, 7).map((unit, idx) => ({
    day: `Day ${idx + 1}`,
    emissions: unit.currentKgCO2e + (Math.random() * 20 - 10),
    cpi: unit.cpi + (Math.random() * 5 - 2.5)
  })) : [];

  return (
    <div className="min-h-screen bg-[#2d5a5a]">
      {/* Modern Navigation */}
      <nav className="bg-[#1e3d3d] border-b border-[#3a6b6b] sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-3xl font-black text-gradient hover:scale-105 transition-transform">
            🌿 Verdant
          </Link>
          <div className="flex items-center gap-2 text-base font-semibold text-white/90">
            <Building2 className="w-4 h-4" />
            <span>Building: {buildingId}</span>
          </div>
        </div>
      </nav>

      {/* Gradient Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-duolingo-blue/20 to-duolingo-purple/20 animate-gradient-shift"></div>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          {/* Header with Mini Trend Chart */}
          <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 animate-fade-in">
            <div className="flex-1">
              <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                Building Dashboard
              </h1>
              <p className="text-xl text-white/90 font-medium mb-4">Monitor your building's eco-performance</p>
              
              {/* Mini Trend Chart */}
              {trendData.length > 0 && (
                <div className="mt-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 max-w-md">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">7-Day Trend</span>
                  </div>
                  <ResponsiveContainer width="100%" height={60}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#58cc02" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#58cc02" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="cpi" 
                        stroke="#58cc02" 
                        strokeWidth={2}
                        fill="url(#trendGradient)"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px',
                        }}
                        labelStyle={{ color: '#fff', fontSize: '10px' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleUpdateData}
                variant="outline"
                size="lg"
                className="bg-card/80 backdrop-blur-sm border-white/20 hover:bg-card"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="verdant"
                size="lg"
                className="shadow-lg shadow-primary/30"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8 -mt-8 relative z-10">

        {/* Enhanced Overview Cards with Circular Progress */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* CO₂ Card */}
          <Card className="shadow-2xl transform hover:scale-[1.02] transition-all duration-300 animate-slide-up relative overflow-hidden group" style={{ animationDelay: '0.1s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b6b]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff8787]/10 group-hover:scale-110 transition-transform">
                    <Globe className="w-7 h-7 text-[#ff6b6b]" />
                  </div>
                  <div className="flex-1">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Total CO₂e This Month
                    </CardDescription>
                    <CardTitle className="text-5xl font-black bg-gradient-to-r from-[#ff6b6b] to-[#ff8787] bg-clip-text text-transparent">
                      {animatedCO2.toFixed(1)}
                    </CardTitle>
                  </div>
                </div>
                <CircularProgress 
                  value={Math.min(overview.percentageVsBaseline || 0, 100)} 
                  max={100} 
                  size={90} 
                  strokeWidth={8}
                  color="#ff6b6b"
                >
                  <div className="text-center">
                    <div className="text-xs font-bold text-[#ff6b6b]">
                      {Math.round(overview.percentageVsBaseline || 0)}%
                    </div>
                  </div>
                </CircularProgress>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">kg CO₂e</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  <span>vs baseline</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eco Score Card */}
          <Card className="shadow-2xl transform hover:scale-[1.02] transition-all duration-300 animate-slide-up relative overflow-hidden group" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#58cc02]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#58cc02]/20 to-[#7ed321]/10 group-hover:scale-110 transition-transform">
                    <Award className="w-7 h-7 text-[#58cc02]" />
                  </div>
                  <div className="flex-1">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Average Eco Score
                    </CardDescription>
                    <CardTitle className="text-5xl font-black bg-gradient-to-r from-[#58cc02] to-[#7ed321] bg-clip-text text-transparent">
                      {animatedCPI.toFixed(1)}
                    </CardTitle>
                  </div>
                </div>
                <CircularProgress 
                  value={overview.averageCPI} 
                  max={100} 
                  size={90} 
                  strokeWidth={8}
                  color="#58cc02"
                >
                  <div className="text-center">
                    <div className="text-xs font-bold text-[#58cc02]">
                      {Math.round(overview.averageCPI)}%
                    </div>
                  </div>
                </CircularProgress>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Out of 100</p>
                <Badge variant="verdant" className="text-xs">
                  Excellent
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Total Units Card */}
          <Card className="shadow-2xl transform hover:scale-[1.02] transition-all duration-300 animate-slide-up relative overflow-hidden group" style={{ animationDelay: '0.3s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#ce82ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#ce82ff]/20 to-[#e0a5ff]/10 group-hover:scale-110 transition-transform">
                    <Home className="w-7 h-7 text-[#ce82ff]" />
                  </div>
                  <div className="flex-1">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Total Units
                    </CardDescription>
                    <CardTitle className="text-5xl font-black bg-gradient-to-r from-[#ce82ff] to-[#e0a5ff] bg-clip-text text-transparent">
                      {activeUnits}/{totalUnits}
                    </CardTitle>
                  </div>
                </div>
                <CircularProgress 
                  value={(activeUnits / totalUnits) * 100} 
                  max={100} 
                  size={90} 
                  strokeWidth={8}
                  color="#ce82ff"
                >
                  <div className="text-center">
                    <div className="text-xs font-bold text-[#ce82ff]">
                      {activeUnits}
                    </div>
                  </div>
                </CircularProgress>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Active units</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Home className="w-3 h-3" />
                  <span>{activeUnits} of {totalUnits} active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Units Dropdown */}
        <Card className="mb-6 shadow-xl animate-slide-up overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary to-duolingo-blue p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">Unit Performance</CardTitle>
                <p className="text-sm text-white/80 mt-1">Click on a unit to view details</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {(showAllUnits ? units : units.slice(0, 5)).map((unit, idx) => {
                const isExpanded = expandedUnits.has(unit.id);
                return (
                  <div key={unit.id} className="bg-card">
                    {/* Unit Header - Clickable */}
                    <button
                      onClick={() => toggleUnit(unit.id)}
                      className="w-full px-6 py-4 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="grid grid-cols-7 gap-4 items-center">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                          <span className="text-sm font-bold text-foreground">{unit.id}</span>
                        </div>
                        
                        <div className="hidden md:block">
                          <Badge 
                            variant={unit.buildingType === 'Commercial' ? 'default' : 'secondary'}
                            className={unit.buildingType === 'Residential' ? 'bg-gray-200 text-gray-800' : ''}
                          >
                            {unit.buildingType || 'Residential'}
                          </Badge>
                        </div>
                        
                        <div className="hidden md:block">
                          <p className="text-xs text-muted-foreground mb-1">Tenant</p>
                          <p className="text-sm font-medium text-foreground truncate">{unit.tenant ? unit.tenant.name : 'N/A'}</p>
                        </div>
                        
                        <div className="hidden md:block">
                          <p className="text-xs text-muted-foreground mb-1">Area</p>
                          <p className="text-sm font-medium text-foreground">{unit.area} sqft</p>
                        </div>
                        
                        <div className="hidden md:block">
                          <p className="text-xs text-muted-foreground mb-1">Eco Score</p>
                          <span className={cn("text-xl font-bold", getCPIColor(unit.cpi))}>
                            {unit.cpi}
                          </span>
                        </div>
                        
                        <div className="hidden md:block">
                          <p className="text-xs text-muted-foreground mb-1">Usage vs Quota</p>
                          <p className="text-sm font-semibold text-foreground">{unit.usageVsQuota.toFixed(1)}%</p>
                        </div>
                        
                        <div className="hidden md:block">
                          <p className="text-xs text-muted-foreground mb-1">Discount</p>
                          <Badge 
                            variant={getDiscountTierVariant(unit.discountTier)}
                            className={getDiscountTierClassName(unit.discountTier)}
                          >
                            {unit.discountTier}
                          </Badge>
                        </div>
                        
                        {/* Mobile view - condensed */}
                        <div className="md:hidden col-span-6 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Eco Score</p>
                            <span className={cn("text-xl font-bold", getCPIColor(unit.cpi))}>
                              {unit.cpi}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Discount</p>
                            <Badge 
                              variant={getDiscountTierVariant(unit.discountTier)}
                              className={getDiscountTierClassName(unit.discountTier)}
                            >
                              {unit.discountTier}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-6 py-5 bg-muted/20 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Left Column */}
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Unit Information</p>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Building Type:</span>
                                  <Badge 
                                    variant={unit.buildingType === 'Commercial' ? 'default' : 'secondary'}
                                    className={unit.buildingType === 'Residential' ? 'bg-gray-200 text-gray-800' : ''}
                                  >
                                    {unit.buildingType || 'Residential'}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Tenant:</span>
                                  <span className="text-sm font-medium text-foreground">{unit.tenant ? unit.tenant.name : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Area:</span>
                                  <span className="text-sm font-medium text-foreground">{unit.area} sqft</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Occupancy:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">{unit.occupancy}</span>
                                    {unit.medicalFlag && (
                                      <Badge variant="outline" className="bg-gray-200 text-gray-800 border-gray-400">Medical</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Performance</p>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Eco Score:</span>
                                  <span className={cn("text-2xl font-bold", getCPIColor(unit.cpi))}>
                                    {unit.cpi}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Usage vs Quota:</span>
                                  <span className="text-sm font-semibold text-foreground">{unit.usageVsQuota.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Discount Tier:</span>
                                  <Badge 
                                    variant={getDiscountTierVariant(unit.discountTier)}
                                    className={getDiscountTierClassName(unit.discountTier)}
                                  >
                                    {unit.discountTier}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Column */}
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Emissions</p>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center bg-muted/50 rounded-lg p-3">
                                  <span className="text-sm font-medium text-foreground">Current Emissions:</span>
                                  <span className="font-bold text-primary text-lg">{unit.currentKgCO2e.toFixed(2)} kg CO₂e</span>
                                </div>
                                <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                                  <div>
                                    <span className="text-sm text-muted-foreground">Baseline:</span>
                                    <p className="text-xs text-muted-foreground/70 mt-0.5">Historical average</p>
                                  </div>
                                  <span className="font-semibold">{unit.baselineKgCO2e.toFixed(2)} kg CO₂e</span>
                                </div>
                                <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                                  <div>
                                    <span className="text-sm text-muted-foreground">Monthly Quota:</span>
                                    <p className="text-xs text-muted-foreground/70 mt-0.5">Target limit</p>
                                  </div>
                                  <span className="font-semibold">{unit.quota.toFixed(2)} kg CO₂e</span>
                                </div>
                                <div className="flex justify-between items-center bg-primary/10 rounded-lg p-3 border border-primary/20">
                                  <span className="text-sm font-medium text-foreground">Discount:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-primary text-xl">
                                      {(unit.discount * 100).toFixed(1)}%
                                    </span>
                                    <DollarSign className="w-5 h-5 text-primary" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Actions</p>
                              {editingUnit === unit.id ? (
                                <div className="flex flex-col gap-3">
                                  <input
                                    type="number"
                                    value={quotaValue}
                                    onChange={(e) => setQuotaValue(e.target.value)}
                                    placeholder="New quota"
                                    className="border border-input bg-background rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-ring"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleUpdateQuota(unit.id)}
                                      variant="verdant"
                                      size="sm"
                                      className="flex-1"
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setEditingUnit(null);
                                        setQuotaValue('');
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 text-gray-800 bg-white"
                                    >
                                      <X className="w-4 h-4 mr-1 text-gray-800" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingUnit(unit.id);
                                    setQuotaValue(unit.quota || unit.baselineKgCO2e);
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-gray-800 bg-white"
                                >
                                  <Edit className="w-4 h-4 mr-2 text-gray-800" />
                                  Edit Quota
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {units.length > 5 && (
              <div className="border-t border-border/50">
                <button
                  onClick={() => setShowAllUnits(!showAllUnits)}
                  className="w-full px-6 py-4 hover:bg-muted/30 transition-colors text-left flex items-center justify-center gap-2 text-sm font-medium text-foreground"
                >
                  {showAllUnits ? (
                    <>
                      <span>Show Less</span>
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>See More ({units.length - 5} more units)</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
