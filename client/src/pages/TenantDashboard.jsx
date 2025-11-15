import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { 
  Leaf, DollarSign, BarChart3, Target, TrendingUp, Award, 
  Zap, Lightbulb, Droplets, Home, Activity, Trophy, 
  Sparkles, ArrowRight, CheckCircle2, AlertCircle, Brain, Loader2
} from 'lucide-react';

const COLORS = ['#58cc02', '#1cb0f6', '#ce82ff', '#ffc800', '#ff9600'];

export default function TenantDashboard() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [usage, setUsage] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedItems, setCompletedItems] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, usageRes] = await Promise.all([
        api.get(`/tenant/${id}/summary`),
        api.get(`/tenant/${id}/usage`)
      ]);
      setSummary(summaryRes.data);
      setUsage(usageRes.data);
      
      // Fetch AI suggestions after main data loads
      fetchAISuggestions();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAISuggestions = async () => {
    try {
      setLoadingAiSuggestions(true);
      const response = await api.get(`/tenant/${id}/ai-suggestions`);
      console.log('AI Suggestions response:', response.data);
      setAiSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Don't show error to user, just silently fail (graceful degradation)
      setAiSuggestions([]);
    } finally {
      setLoadingAiSuggestions(false);
    }
  };

  const handleAcknowledge = (tipId) => {
    // Hardcoded: just toggle the completed state locally
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tipId)) {
        newSet.delete(tipId);
      } else {
        newSet.add(tipId);
      }
      return newSet;
    });
  };

  // Map category to icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'HVAC': return Activity;
      case 'Lighting': return Lightbulb;
      case 'Water': return Droplets;
      case 'Appliances': return Home;
      default: return Zap;
    }
  };

  // Map difficulty to color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-500';
      case 'Medium': return 'text-yellow-500';
      case 'Hard': return 'text-orange-500';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2d5a5a] flex items-center justify-center">
        <Card className="border-0 shadow-xl max-w-md">
          <CardContent className="pt-6 p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <div className="text-xl font-semibold text-foreground">Loading your dashboard...</div>
              <p className="text-sm text-muted-foreground text-center">Fetching your carbon performance data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-[#2d5a5a] flex items-center justify-center">
        <Card className="border-0 shadow-xl border-destructive max-w-md">
          <CardContent className="pt-6 p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <div className="text-xl font-bold text-destructive">Unable to load data</div>
              <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gamification calculations
  const xp = Math.floor(summary.cpi * 10);
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const xpForNextLevel = 100;
  const levelProgress = (xpInLevel / xpForNextLevel) * 100;

  const breakdownData = [
    { name: 'HVAC', value: summary.breakdown.hvac },
    { name: 'Lights', value: summary.breakdown.lights },
    { name: 'Water', value: summary.breakdown.water },
    { name: 'Appliances', value: summary.breakdown.appliances },
    { name: 'Other', value: summary.breakdown.other }
  ];

  const chartData = usage?.readings?.length > 0 
    ? usage.readings.map(r => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        emissions: r.emissionsKg || 0
      }))
    : [];

  const progressPercentage = summary.progress;
  const isUnderQuota = progressPercentage < 100;
  const discountPercent = (summary.discount * 100).toFixed(1);
  const streak = summary.rewards?.streak || 0;

  // Calculate badges
  const badges = [];
  if (summary.cpi >= 90) badges.push({ name: 'Eco Champion', emoji: '🏆', variant: 'verdant' });
  if (summary.cpi >= 70 && summary.cpi < 90) badges.push({ name: 'Green Warrior', emoji: '🌿', variant: 'default' });
  if (summary.cpi >= 50 && summary.cpi < 70) badges.push({ name: 'Eco Explorer', emoji: '🌍', variant: 'secondary' });
  if (streak >= 7) badges.push({ name: 'Week Warrior', emoji: '🔥', variant: 'outline' });
  if (streak >= 30) badges.push({ name: 'Month Master', emoji: '⭐', variant: 'outline' });
  if (isUnderQuota) badges.push({ name: 'Quota Crusher', emoji: '✅', variant: 'verdant' });
  if (level >= 5) badges.push({ name: 'Level Up Legend', emoji: '🎖️', variant: 'outline' });

  const getEncouragement = () => {
    if (summary.cpi >= 90) return { text: "Incredible! You're an eco-hero! 🌟", gradient: 'from-duolingo-yellow to-duolingo-orange' };
    if (summary.cpi >= 70) return { text: "Amazing work! Keep it up! 🎉", gradient: 'from-duolingo-green to-duolingo-blue' };
    if (summary.cpi >= 50) return { text: "Great progress! You're doing well! 👍", gradient: 'from-duolingo-blue to-duolingo-purple' };
    return { text: "You've got this! Every step counts! 💪", gradient: 'from-duolingo-orange to-duolingo-red' };
  };

  const encouragement = getEncouragement();

  return (
    <div className="min-h-screen bg-[#2d5a5a]">
      {/* Modern Navigation */}
      <nav className="bg-[#1e3d3d] border-b border-[#3a6b6b] sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-3xl font-black text-gradient hover:scale-105 transition-transform">
            🌿 Verdant
          </Link>
          <div className="flex items-center gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="py-2 px-4">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold">Level {level}</div>
                    <div className="text-base font-black text-primary">{xp} XP</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {streak > 0 && (
              <Card className="border-0 shadow-sm bg-gradient-to-r from-duolingo-orange to-duolingo-red">
                <CardContent className="py-2 px-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-white" />
                    <div>
                      <div className="text-xs text-white/90 font-semibold">Streak</div>
                      <div className="text-base font-black text-white">{streak} days</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-5 tracking-tight">
            Dashboard
          </h1>
          <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${encouragement.gradient} text-white px-6 py-3 rounded-xl shadow-lg`}>
            <CheckCircle2 className="w-6 h-6" />
            <p className="text-lg font-bold">{encouragement.text}</p>
          </div>
        </div>

        {/* Level Progress Card */}
        <Card className="mb-6 shadow-xl animate-slide-up">
          <CardHeader className="p-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-xl bg-primary/10">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle 
                    className="text-3xl font-black"
                    style={{
                      background: 'linear-gradient(to right, hsl(var(--primary)), #1cb0f6, #ce82ff)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Level {level}
                  </CardTitle>
                  <CardDescription className="text-base font-medium mt-1">{xpInLevel} / {xpForNextLevel} XP to next level</CardDescription>
                </div>
              </div>
              <div 
                className="text-4xl font-black"
                style={{
                  background: 'linear-gradient(to right, hsl(var(--primary)), #1cb0f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {xp} XP
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-8 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary via-duolingo-blue to-duolingo-purple transition-all duration-1000 rounded-full flex items-center justify-end pr-3"
                style={{ width: `${levelProgress}%` }}
              >
                {levelProgress > 15 && (
                  <span className="text-sm font-black text-white">{Math.round(levelProgress)}%</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card className="shadow-lg transform hover:scale-[1.02] transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="p-8">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-xl bg-primary/10">
                  <Leaf className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <CardDescription className="text-sm font-semibold mb-2">Eco Score</CardDescription>
                  <CardTitle className="text-6xl font-black text-primary leading-none">{summary.cpi}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className="text-base font-medium text-muted-foreground">Out of 100 points</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg transform hover:scale-[1.02] transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="p-8">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-xl bg-duolingo-blue/10">
                  <DollarSign className="w-8 h-8 text-duolingo-blue" />
                </div>
                <div className="flex-1">
                  <CardDescription className="text-sm font-semibold mb-2">Rent Discount</CardDescription>
                  <CardTitle className="text-6xl font-black text-duolingo-blue leading-none">{discountPercent}%</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className="text-base font-medium text-muted-foreground">
                {summary.cpi >= 90 ? 'Tier 1 - Maximum discount' :
                 summary.cpi >= 70 ? 'Tier 2 - Great performance' :
                 summary.cpi >= 50 ? 'Tier 3 - Good progress' :
                 'No discount - Continue improving'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg transform hover:scale-[1.02] transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="p-8">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-xl bg-duolingo-purple/10">
                  <BarChart3 className="w-8 h-8 text-duolingo-purple" />
                </div>
                <div className="flex-1">
                  <CardDescription className="text-sm font-semibold mb-2">This Month</CardDescription>
                  <CardTitle className="text-6xl font-black text-duolingo-purple leading-none">{summary.currentKgCO2e.toFixed(1)}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className="text-base font-medium text-muted-foreground">kg CO₂e</p>
            </CardContent>
          </Card>
        </div>

        {/* Discount Tiers Info */}
        <Card className="mb-6 shadow-xl animate-slide-up">
          <CardHeader className="p-8 pb-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] bg-clip-text text-transparent">Discount Tiers</CardTitle>
                <CardDescription className="text-base font-medium mt-1">Earn rent discounts by improving your Eco Score</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="grid md:grid-cols-4 gap-4">
              {/* Tier 1 - Gold */}
              <div className={cn(
                "p-6 rounded-xl border-2 transition-all bg-[#1e4d3e] hover:bg-gray-800/80",
                summary.cpi >= 90 
                  ? "border-[#FFD700] shadow-lg shadow-[#FFD700]/20" 
                  : "border-[#FFD700]/30"
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className={cn("w-6 h-6", summary.cpi >= 90 ? "text-[#FFD700]" : "text-[#FFD700]/60")} />
                  <h4 className={cn("font-bold text-lg", summary.cpi >= 90 ? "text-[#FFD700]" : "text-[#FFD700]/80")}>Tier 1</h4>
                </div>
                <p className={cn("text-5xl font-black mb-3 leading-none", summary.cpi >= 90 ? "text-[#FFD700]" : "text-[#FFD700]/70")}>5%</p>
                <p className="text-sm font-medium text-muted-foreground mb-4">CPI 100-90</p>
                {summary.cpi >= 90 && (
                  <Badge className="text-sm bg-[#FFD700] text-black font-semibold border-[#FFD700]">Current Tier</Badge>
                )}
              </div>
              
              {/* Tier 2 - Silver */}
              <div className={cn(
                "p-6 rounded-xl border-2 transition-all bg-[#1e4d3e] hover:bg-gray-800/80",
                summary.cpi >= 70 && summary.cpi < 90
                  ? "border-[#E8E8E8] shadow-xl shadow-[#E8E8E8]/30" 
                  : "border-[#C0C0C0]"
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className={cn("w-6 h-6", summary.cpi >= 70 && summary.cpi < 90 ? "text-[#E8E8E8]" : "text-[#C0C0C0]")} />
                  <h4 className={cn("font-bold text-lg", summary.cpi >= 70 && summary.cpi < 90 ? "text-[#E8E8E8]" : "text-[#C0C0C0]")}>Tier 2</h4>
                </div>
                <p className={cn("text-5xl font-black mb-3 leading-none", summary.cpi >= 70 && summary.cpi < 90 ? "text-[#E8E8E8]" : "text-[#C0C0C0]")}>2%</p>
                <p className="text-sm font-medium text-muted-foreground mb-4">CPI 90-70</p>
                {summary.cpi >= 70 && summary.cpi < 90 && (
                  <Badge className="text-sm bg-[#E8E8E8] text-black font-semibold border-[#E8E8E8] shadow-md">Current Tier</Badge>
                )}
              </div>
              
              {/* Tier 3 - Bronze */}
              <div className={cn(
                "p-6 rounded-xl border-2 transition-all bg-[#1e4d3e] hover:bg-gray-800/80",
                summary.cpi >= 50 && summary.cpi < 70
                  ? "border-[#D4A574] shadow-xl shadow-[#D4A574]/30" 
                  : "border-[#CD7F32]"
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className={cn("w-6 h-6", summary.cpi >= 50 && summary.cpi < 70 ? "text-[#D4A574]" : "text-[#CD7F32]")} />
                  <h4 className={cn("font-bold text-lg", summary.cpi >= 50 && summary.cpi < 70 ? "text-[#D4A574]" : "text-[#CD7F32]")}>Tier 3</h4>
                </div>
                <p className={cn("text-5xl font-black mb-3 leading-none", summary.cpi >= 50 && summary.cpi < 70 ? "text-[#D4A574]" : "text-[#CD7F32]")}>0.5%</p>
                <p className="text-sm font-medium text-muted-foreground mb-4">CPI 70-50</p>
                {summary.cpi >= 50 && summary.cpi < 70 && (
                  <Badge className="text-sm bg-[#D4A574] text-white font-semibold border-[#D4A574] shadow-md">Current Tier</Badge>
                )}
              </div>
              
              {/* No Discount */}
              <div className={cn(
                "p-6 rounded-xl border-2 transition-all bg-[#1e4d3e] hover:bg-gray-800/80",
                summary.cpi < 50
                  ? "border-muted-foreground/40 shadow-md" 
                  : "border-border/40"
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-6 h-6 text-muted-foreground" />
                  <h4 className="font-bold text-lg">No Discount</h4>
                </div>
                <p className="text-5xl font-black text-muted-foreground mb-3 leading-none">0%</p>
                <p className="text-sm font-medium text-muted-foreground mb-4">CPI &lt; 50</p>
                {summary.cpi < 50 && (
                  <Badge variant="outline" className="text-sm bg-gray-200 text-gray-800 border-gray-400">Current</Badge>
                )}
              </div>
            </div>
            
            {summary.cpi < 90 && (
              <div className="mt-6 p-5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/20 shrink-0">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold mb-2 text-foreground">Next Goal</p>
                    {summary.cpi < 50 ? (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Reach <span className="font-bold text-foreground">CPI 50</span> to unlock Tier 3 (0.5% discount). 
                        You need <span className="font-bold text-primary">{50 - summary.cpi}</span> more points.
                      </p>
                    ) : summary.cpi < 70 ? (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Reach <span className="font-bold text-foreground">CPI 70</span> to unlock Tier 2 (2% discount). 
                        You need <span className="font-bold text-primary">{70 - summary.cpi}</span> more points.
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Reach <span className="font-bold text-foreground">CPI 90</span> to unlock Tier 1 (5% discount). 
                        You need <span className="font-bold text-primary">{90 - summary.cpi}</span> more points.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quota Progress */}
        <Card className="mb-6 shadow-xl animate-slide-up">
          <CardHeader className="p-8 pb-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-3xl font-black">Quota Status</CardTitle>
                </div>
                <CardDescription className="text-base font-medium mt-2">
                  {isUnderQuota 
                    ? `You're ${((1 - progressPercentage / 100) * 100).toFixed(1)}% under your monthly quota`
                    : `You're ${((progressPercentage - 100) * 100).toFixed(1)}% over your monthly quota`}
                </CardDescription>
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/40">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Quota</span> is your monthly target limit set by your landlord. 
                    <span className="font-semibold text-foreground"> Baseline</span> is the historical average. 
                    Your <span className="font-semibold text-foreground">Eco Score (CPI)</span> is calculated based on your usage vs quota: 
                    using 50% or less of quota = 100 CPI, then decreases by 2 points for each 1% over 50%.
                  </p>
                </div>
              </div>
              <div className="text-right ml-6">
                <CardDescription className="text-sm font-semibold mb-2">Monthly Usage</CardDescription>
                <CardTitle className="text-3xl font-black text-primary">
                  {summary.currentKgCO2e.toFixed(1)} / {summary.quota.toFixed(1)}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">kg CO₂e</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="relative w-full h-10 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "absolute inset-0 rounded-full transition-all duration-1000 flex items-center justify-center font-black text-white",
                  isUnderQuota 
                    ? 'bg-gradient-to-r from-primary to-duolingo-blue' 
                    : 'bg-gradient-to-r from-duolingo-orange to-duolingo-red'
                )}
                style={{ width: `${Math.min(100, progressPercentage)}%` }}
              >
                {progressPercentage > 20 && (
                  <span className="text-lg">{Math.round(progressPercentage)}%</span>
                )}
              </div>
              {isUnderQuota && progressPercentage < 20 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-lg animate-slide-up">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  Daily Progress
                </CardTitle>
              </div>
              <CardDescription className="text-sm mt-2">Carbon emissions over time</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      style={{ fontSize: '12px' }}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      style={{ fontSize: '12px' }}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="emissions" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                      name="kg CO₂e" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No usage data available</p>
                    <p className="text-muted-foreground/70 text-sm mt-1">Data will appear once readings are recorded</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg animate-slide-up">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-duolingo-purple/10">
                    <BarChart3 className="w-5 h-5 text-duolingo-purple" />
                  </div>
                  Energy Breakdown
                </CardTitle>
              </div>
              <CardDescription className="text-sm mt-2">Usage by category</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={100}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="mb-6 shadow-xl animate-slide-up">
          <CardHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle 
                  className="text-2xl font-bold"
                  style={{
                    background: 'linear-gradient(to right, hsl(var(--primary)), #1cb0f6, #ce82ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Your Achievements
                </CardTitle>
                <CardDescription className="text-sm mt-1">Unlock badges by reaching milestones</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {badges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge, idx) => (
                  <Card key={idx} className="border-0 shadow-md text-center hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <CardContent className="pt-6 pb-6">
                      <div className="text-5xl mb-4">{badge.emoji}</div>
                      <Badge variant={badge.variant} className="text-sm font-semibold px-3 py-1">
                        {badge.name}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="p-4 rounded-full bg-muted/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground font-semibold text-base">Continue improving to unlock achievements</p>
                <p className="text-muted-foreground/70 text-sm mt-2">Complete challenges and reach goals to earn badges</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI-Powered Suggestions */}
        {aiSuggestions.length > 0 && (
          <Card className="border-0 shadow-xl animate-slide-up">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                  <Brain className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold" style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    AI-Powered Suggestions
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">Personalized recommendations based on your usage</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-3">
                {aiSuggestions.map((suggestion) => {
                  const IconComponent = getCategoryIcon(suggestion.category);
                  return (
                    <Card key={suggestion.id} className="border shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all duration-300 bg-gradient-to-r from-purple-500/5 to-transparent">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <div className="p-2.5 rounded-lg bg-purple-500/10">
                                <IconComponent className="w-5 h-5 text-purple-400" />
                              </div>
                              <Badge variant="outline" className="text-xs font-medium bg-gray-200 text-gray-800 border-gray-400">
                                {suggestion.category}
                              </Badge>
                              <Badge variant="verdant" className="text-xs font-semibold">
                                +{suggestion.xp} XP
                              </Badge>
                              {suggestion.impact > 0 && (
                                <Badge variant="outline" className="text-xs font-medium text-green-500 border-green-500/30">
                                  Save ~{suggestion.impact.toFixed(1)} kg CO₂e/month
                                </Badge>
                              )}
                              <span className={`text-xs font-semibold ${getDifficultyColor(suggestion.difficulty)}`}>
                                {suggestion.difficulty}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-foreground mb-2">{suggestion.title}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.description}</p>
                          </div>
                      <Button
                        onClick={() => handleAcknowledge(suggestion.id)}
                        variant={completedItems.has(suggestion.id) ? "verdant" : "outline"}
                        size="sm"
                        className={cn(
                          "text-xs font-semibold shrink-0 text-gray-800 bg-white",
                          completedItems.has(suggestion.id) && "bg-gradient-to-r from-duolingo-green to-duolingo-blue text-white"
                        )}
                        disabled={completedItems.has(suggestion.id)}
                      >
                        {completedItems.has(suggestion.id) ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Complete
                          </>
                        ) : (
                          "Mark Complete"
                        )}
                      </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading AI Suggestions */}
        {loadingAiSuggestions && (
          <Card className="border-0 shadow-xl animate-slide-up">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                  <Brain className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold" style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    AI-Powered Suggestions
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">Generating personalized recommendations...</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug: Show if AI suggestions failed to load */}
        {!loadingAiSuggestions && aiSuggestions.length === 0 && !loading && (
          <Card className="border-0 shadow-xl animate-slide-up border-yellow-500/30">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                  <Brain className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold" style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    AI-Powered Suggestions
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">AI suggestions unavailable</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  AI suggestions are temporarily unavailable. This could be due to:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                  <li>OpenAI API quota exceeded (check your billing)</li>
                  <li>API key not configured or invalid</li>
                  <li>Network connectivity issues</li>
                </ul>
                <p className="text-xs text-muted-foreground/70 mt-3">
                  Check the server console for detailed error messages. The app will continue to work without AI suggestions.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
