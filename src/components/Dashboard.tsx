import { Thermometer, Droplets, Sun, Zap, Camera, Bell, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const gardenZones = [
    {
      id: 1,
      name: "Kitchen Window",
      plants: 3,
      temperature: 72,
      humidity: 45,
      soilMoisture: 60,
      lightHours: 6,
      status: "healthy"
    },
    {
      id: 2,
      name: "Balcony Shelf",
      plants: 5,
      temperature: 68,
      humidity: 55,
      soilMoisture: 30,
      lightHours: 8,
      status: "warning"
    },
    {
      id: 3,
      name: "Living Room",
      plants: 2,
      temperature: 70,
      humidity: 40,
      soilMoisture: 75,
      lightHours: 4,
      status: "good"
    }
  ];

  const alerts = [
    { message: "Low moisture in Balcony Shelf", type: "warning", time: "2 min ago" },
    { message: "Optimal growing conditions detected", type: "success", time: "15 min ago" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-primary";
      case "warning": return "bg-destructive";
      case "good": return "bg-accent";
      default: return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">UrbanBloom AR</h1>
          <p className="text-muted-foreground">Your smart garden dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-destructive">
              {alerts.length}
            </Badge>
          </Button>
          <Button size="icon" className="bg-gradient-primary shadow-soft">
            <Camera className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-card shadow-card border-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Thermometer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Temperature</p>
                <p className="text-xl font-bold text-foreground">70°F</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-accent/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Droplets className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Humidity</p>
                <p className="text-xl font-bold text-foreground">47%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Garden Zones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Garden Zones</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            <Plus className="h-4 w-4 mr-1" />
            Add Zone
          </Button>
        </div>

        <div className="space-y-3">
          {gardenZones.map((zone) => (
            <Card key={zone.id} className="bg-card/80 backdrop-blur-sm shadow-soft border border-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-card-foreground">{zone.name}</h3>
                    <p className="text-sm text-muted-foreground">{zone.plants} plants</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(zone.status)}`}></div>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {zone.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <Thermometer className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Temp</p>
                    <p className="text-sm font-medium">{zone.temperature}°F</p>
                  </div>
                  <div className="text-center">
                    <Droplets className="h-4 w-4 text-accent mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Humidity</p>
                    <p className="text-sm font-medium">{zone.humidity}%</p>
                  </div>
                  <div className="text-center">
                    <Zap className="h-4 w-4 text-ar-blue mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Soil</p>
                    <p className="text-sm font-medium">{zone.soilMoisture}%</p>
                  </div>
                  <div className="text-center">
                    <Sun className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Light</p>
                    <p className="text-sm font-medium">{zone.lightHours}h</p>
                  </div>
                </div>

                {zone.status === "warning" && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-destructive" />
                      <p className="text-sm text-destructive">Low soil moisture - Water needed</p>
                    </div>
                    <Progress value={zone.soilMoisture} className="mt-2 h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Alerts */}
      <Card className="bg-card/80 backdrop-blur-sm shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 ${alert.type === 'warning' ? 'bg-destructive' : 'bg-primary'}`}></div>
              <div className="flex-1">
                <p className="text-sm text-card-foreground">{alert.message}</p>
                <p className="text-xs text-muted-foreground">{alert.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AR Scanner Button */}
      <div className="fixed bottom-6 right-6">
        <Button 
          size="lg" 
          className="h-14 w-14 rounded-full bg-gradient-primary shadow-ar-glow border-2 border-primary-glow/20"
        >
          <Camera className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;