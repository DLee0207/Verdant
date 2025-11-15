import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import TenantDashboard from './pages/TenantDashboard';
import LandlordDashboard from './pages/LandlordDashboard';
import api from './api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { cn } from './lib/utils';
import { Sparkles, User, Building2, ArrowRight, CheckCircle2 } from 'lucide-react';

function Home() {
  const [initStatus, setInitStatus] = useState(null);

  const handleInit = async () => {
    try {
      setInitStatus('Initializing...');
      const response = await api.post('/init');
      setInitStatus('Success! Data initialized.');
      setTimeout(() => setInitStatus(null), 3000);
    } catch (error) {
      setInitStatus('Error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#2d5a5a]">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-6">
            <h1 className="text-7xl md:text-8xl font-black text-gradient mb-4 tracking-tight">
              🌿 Verdant
            </h1>
            <div className="h-1.5 bg-gradient-to-r from-duolingo-green via-duolingo-blue to-duolingo-purple rounded-full mx-auto w-48"></div>
          </div>
          <p className="text-2xl md:text-3xl text-white font-semibold mb-2 tracking-tight">
            Sustainable Living, Rewarded
          </p>
          <p className="text-lg md:text-xl text-white/80 font-normal">
            Track your carbon footprint and earn rent discounts
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-3xl mx-auto mb-12 animate-slide-up">
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-3xl md:text-4xl font-bold">Get Started</CardTitle>
              </div>
              <CardDescription className="text-base text-muted-foreground leading-relaxed">
                Initialize sample data to explore Verdant's features and see how carbon tracking and rewards work.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleInit}
                variant="verdant"
                size="lg"
                className="w-full text-base h-12 font-semibold"
              >
                Initialize Sample Data
              </Button>
              {initStatus && (
                <div className="mt-6 p-4 bg-primary/10 backdrop-blur-sm rounded-xl border border-primary/20 animate-fade-in flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-primary font-semibold">{initStatus}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          <Link to="/tenant/tenant_01" className="group">
            <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 animate-slide-up shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-xl bg-duolingo-blue/10 group-hover:bg-duolingo-blue/20 transition-colors">
                    <User className="w-6 h-6 text-duolingo-blue" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Tenant Dashboard</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed text-muted-foreground">
                  Monitor your carbon performance, track your eco-score, and view your rent discount status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-duolingo-blue font-semibold text-base group-hover:gap-3 transition-all">
                  <span>View Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/landlord/bldg_01" className="group">
            <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 animate-slide-up shadow-lg" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-xl bg-duolingo-purple/10 group-hover:bg-duolingo-purple/20 transition-colors">
                    <Building2 className="w-6 h-6 text-duolingo-purple" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Building Dashboard</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed text-muted-foreground">
                  Manage building units, monitor performance metrics, and export detailed reports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-duolingo-purple font-semibold text-base group-hover:gap-3 transition-all">
                  <span>View Building</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Demo Info */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Card className="inline-block shadow-lg">
            <CardContent className="pt-6">
              <p className="text-foreground font-semibold text-base mb-4">Demo Accounts</p>
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center text-muted-foreground text-sm">
                <div>
                  <span className="font-semibold text-foreground">Tenants:</span> tenant_01 through tenant_10
                </div>
                <div className="hidden md:block text-muted-foreground/50">•</div>
                <div>
                  <span className="font-semibold text-foreground">Building:</span> bldg_01
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tenant/:id" element={<TenantDashboard />} />
        <Route path="/landlord/:buildingId" element={<LandlordDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
