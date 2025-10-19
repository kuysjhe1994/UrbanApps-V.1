import { Home, Camera, BookOpen, BarChart3, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "scanner", icon: Camera, label: "AR Scan" },
    { id: "library", icon: BookOpen, label: "Plants" },
    { id: "monitoring", icon: BarChart3, label: "Monitor" },
    { id: "profile", icon: User, label: "Profile" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50 p-2 z-50" role="navigation" aria-label="Primary">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="icon"
            onClick={() => onTabChange(tab.id)}
            className={`flex-col h-auto py-2 px-3 transition-all duration-300 ${
              activeTab === tab.id 
                ? "bg-gradient-primary text-primary-foreground shadow-ar-glow scale-105" 
                : "text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:scale-100"
            }`}
            aria-current={activeTab === tab.id ? "page" : undefined}
            aria-label={tab.label}
          >
            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
            <span className="text-xs mt-0.5 font-medium">{tab.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;