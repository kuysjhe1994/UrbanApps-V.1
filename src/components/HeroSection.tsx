import { Camera, Scan, Smartphone, Leaf, ArrowRight, Play, BookOpen, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@/assets/hero-ar-garden.jpg";
import arScanningImage from "@/assets/ar-scanning.jpg";
import urbanGardenImage from "@/assets/urban-garden.jpg";

interface HeroSectionProps {
  onNavigate: (tab: string) => void;
}

const HeroSection = ({ onNavigate }: HeroSectionProps) => {
  const features = [
    {
      icon: Camera,
      title: "AR Plant Scanner",
      description: "Point your camera to analyze growing conditions and get instant plant recommendations"
    },
    {
      icon: Scan,
      title: "Real-time Monitoring",
      description: "Live sensor data for temperature, humidity, and light exposure"
    },
    {
      icon: Smartphone,
      title: "Smart Notifications",
      description: "Get alerts when your plants need water, fertilizer, or environmental adjustments"
    },
    {
      icon: Leaf,
      title: "Urban Gardening",
      description: "Optimized for small spaces like balconies, windowsills, and indoor shelves"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5"></div>
        
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-6 sm:space-y-8">
              <div className="space-y-3 sm:space-y-4">
                <h1 className="px-4">UrbanBloom AR</h1>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                  Transform your small urban spaces into thriving gardens with augmented reality 
                  and smart climate monitoring
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <Button
                  aria-label="Start AR Scanning"
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-primary shadow-ar-glow hover:shadow-ar-glow transition-smooth"
                  onClick={() => onNavigate('scanner')}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Start AR Scanning
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full sm:w-auto border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-smooth"
                  onClick={() => onNavigate('library')}
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  Explore Plants
                </Button>
              </div>

              {/* Hero Image */}
              <div className="mt-8 sm:mt-12 lg:mt-16 relative px-4">
                <div className="relative mx-auto max-w-xs sm:max-w-md lg:max-w-2xl">
                  <img 
                    src={heroImage} 
                    alt="AR gardening app showing plant monitoring interface" 
                    className="w-full rounded-xl sm:rounded-2xl shadow-ar-glow border border-primary/20"
                  />
                  <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-6 h-6 sm:w-8 sm:h-8 bg-ar-green rounded-full animate-pulse shadow-ar-glow"></div>
                  <div className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-4 w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-4">
              Smart Gardening Made Simple
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Use cutting-edge AR technology to optimize your urban garden with real-time environmental data
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-gradient-card backdrop-blur-sm shadow-card border border-primary/10 hover:shadow-ar-glow transition-smooth cursor-pointer group"
                onClick={() => {
                  if (index === 0) onNavigate('scanner');
                  else if (index === 1) onNavigate('monitoring');
                  else if (index === 2) onNavigate('profile');
                  else if (index === 3) onNavigate('library');
                }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-smooth flex-shrink-0">
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:scale-110 transition-smooth" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm sm:text-base text-card-foreground mb-2">{feature.title}</h3>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-smooth flex-shrink-0" />
                      </div>
                      <p className="text-muted-foreground text-xs sm:text-sm">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-transparent to-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-4">
              See It In Action
            </h2>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            <div className="space-y-3 sm:space-y-4">
              <img 
                src={arScanningImage} 
                alt="Person using AR to scan plants" 
                className="w-full rounded-lg sm:rounded-xl shadow-card"
              />
              <div className="text-center px-4">
                <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1 sm:mb-2">AR Plant Identification</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Point your camera at any space to get instant growing recommendations
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <img 
                src={urbanGardenImage} 
                alt="Small urban garden on balcony" 
                className="w-full rounded-lg sm:rounded-xl shadow-card"
              />
              <div className="text-center px-4">
                <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1 sm:mb-2">Urban Garden Optimization</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Perfect for balconies, windowsills, and small indoor spaces
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-gradient-primary text-primary-foreground shadow-ar-glow border-primary-glow/20 max-w-lg mx-auto">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">Ready to Start Growing?</h2>
              <p className="text-sm sm:text-base mb-4 sm:mb-6 opacity-90">
                Join thousands of urban gardeners already using AR technology to optimize their growing spaces
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="w-full sm:flex-1 bg-white/20 hover:bg-white/30 transition-smooth"
                  onClick={() => onNavigate('scanner')}
                >
                  <Scan className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Start Scanning</span>
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="w-full sm:w-auto bg-white/20 hover:bg-white/30 transition-smooth"
                  onClick={() => onNavigate('monitoring')}
                >
                  <BarChart3 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Dashboard</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;