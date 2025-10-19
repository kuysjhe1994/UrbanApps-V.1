import { useState, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import FunctionalDashboard from "@/components/FunctionalDashboard";
import FunctionalARScanner from "@/components/FunctionalARScanner";
import PlantLibrary from "@/components/PlantLibrary";
import Navigation from "@/components/Navigation";
import ThemeToggle from "@/components/ThemeToggle";
import SplashScreen from "@/components/SplashScreen";
import AuthScreen from "@/components/AuthScreen";
import Profile from "@/components/Profile";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HeroSection onNavigate={setActiveTab} />;
      case "scanner":
        return <FunctionalARScanner />;
      case "library":
        return <PlantLibrary />;
      case "monitoring":
        return <FunctionalDashboard />;
      case "profile":
        return <Profile />;
      default:
        return <HeroSection onNavigate={setActiveTab} />;
    }
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return (
    <div className="relative" id="main-content">
      {/* Sticky top app header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary/20" aria-hidden="true" />
            <span className="font-semibold">UrbanBloom AR</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {renderContent()}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="h-16"></div>
    </div>
  );
};

export default Index;
