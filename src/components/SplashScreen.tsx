import { useEffect, useState } from "react";
import { Leaf, Sparkles } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 300);
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-primary flex items-center justify-center">
      <div className="text-center space-y-8 animate-in fade-in duration-1000">
        {/* Logo */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto bg-primary-foreground/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-primary-foreground/30">
            <Leaf className="w-12 h-12 text-primary-foreground animate-bounce" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-6 h-6 text-primary-glow animate-pulse" />
          </div>
        </div>

        {/* App Name */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-primary-foreground tracking-wide">
            UrbanBloom
          </h1>
          <p className="text-primary-foreground/80 text-lg font-medium">
            AR Garden Assistant
          </p>
        </div>

        {/* Loading Progress */}
        <div className="w-64 mx-auto space-y-3">
          <div className="h-1 bg-primary-foreground/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-foreground transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-primary-foreground/60 text-sm">
            {progress < 30 ? "Initializing AR..." : 
             progress < 60 ? "Loading plant database..." :
             progress < 90 ? "Setting up sensors..." : "Ready to bloom!"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;