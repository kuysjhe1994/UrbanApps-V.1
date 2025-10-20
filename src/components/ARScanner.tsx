import { Camera, Zap, Thermometer, Droplets, Sun } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ARScanner = () => {
  const sensorData = [
    { icon: Thermometer, label: "Temperature", value: "72°F", status: "optimal" },
    { icon: Droplets, label: "Humidity", value: "45%", status: "good" },
    { icon: Sun, label: "Light", value: "6h direct", status: "optimal" }
  ];

  return (
    <div className="relative h-screen bg-gradient-to-b from-background to-muted overflow-hidden">
      {/* AR Camera Viewfinder */}
      <div className="absolute inset-0 bg-gradient-to-br from-ar-overlay to-transparent">
        <div className="absolute inset-4 border-2 border-ar-green/50 rounded-lg">
          <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-ar-green"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-ar-green"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-ar-green"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-ar-green"></div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-card/80 backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-foreground">AR Plant Scanner</h1>
        <Button variant="ghost" size="icon" className="text-primary">
          <Camera className="h-5 w-5" />
        </Button>
      </div>

      {/* AR Overlay Cards */}
      <div className="absolute top-32 left-4 right-4 space-y-3">
        <Card className="p-4 bg-card/90 backdrop-blur-md shadow-ar-glow border border-ar-green/30">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-ar-green rounded-full animate-pulse"></div>
            <div>
              <h3 className="font-medium text-card-foreground">Optimal Spot Detected</h3>
              <p className="text-sm text-muted-foreground">Perfect for herbs and small plants</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {sensorData.map((sensor, index) => (
            <Card key={index} className="p-3 bg-card/85 backdrop-blur-md border-ar-blue/20 shadow-soft">
              <div className="flex items-center gap-2">
                <sensor.icon className="h-4 w-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{sensor.label}</p>
                  <p className="font-medium text-card-foreground">{sensor.value}</p>
                </div>
                <Badge 
                  variant={sensor.status === "optimal" ? "default" : "secondary"}
                  className="h-5 text-xs"
                >
                  {sensor.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* AR Plant Suggestion */}
      <div className="absolute bottom-32 left-4 right-4">
        <Card className="p-4 bg-gradient-card backdrop-blur-md shadow-card border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-primary rounded-full"></div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-card-foreground">Recommended: Basil</h3>
              <p className="text-sm text-muted-foreground mb-2">
                95% compatibility with current conditions
              </p>
              <p className="text-xs text-muted-foreground">
                Projected growth: 12 inches in 30 days
              </p>
            </div>
            <Button size="sm" className="bg-gradient-primary">
              Add Plant
            </Button>
          </div>
        </Card>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-4 right-4 flex items-center justify-center gap-4">
        <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full">
          <Camera className="h-5 w-5" />
        </Button>
        <Button size="icon" className="h-16 w-16 rounded-full bg-gradient-primary shadow-ar-glow">
          <div className="w-8 h-8 bg-primary-foreground rounded-full"></div>
        </Button>
        <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full">
          <Zap className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ARScanner;