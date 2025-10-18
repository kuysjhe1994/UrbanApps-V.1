import { useState, useEffect } from "react";
import { Thermometer, Droplets, Sun, Zap, Camera, Bell, Plus, TrendingUp, Activity, Trash2, AlertTriangle, Leaf, Star, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useARScans } from "@/hooks/useARScans";
import { usePlantCare } from "@/hooks/usePlantCare";
import { supabase } from "@/integrations/supabase/client";

interface GardenZone {
  id: string;
  user_id: string;
  name: string;
  plants_count: number;
  temperature: number;
  humidity: number;
  soil_moisture: number;
  light_hours: number;
  status: 'good' | 'needs_water' | 'critical';
  last_watered: string;
  created_at: string;
  updated_at: string;
}

interface Alert {
  id: number;
  message: string;
  type: 'warning' | 'success' | 'critical';
  time: string;
  active: boolean;
}

const FunctionalDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { scans, getRecentScans } = useARScans();
  const { getRecommendationsForConditions } = usePlantCare();
  const [gardenZones, setGardenZones] = useState<GardenZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [newZoneIds, setNewZoneIds] = useState<Set<string>>(new Set());
  const [zoneRecommendations, setZoneRecommendations] = useState<{[key: string]: any[]}>({});

  // Load garden zones from database and dismissed alerts from localStorage
  useEffect(() => {
    if (user) {
      fetchGardenZones();
      setupRealtimeSubscription();
      
      // Load dismissed alerts from localStorage
      const savedDismissedAlerts = localStorage.getItem(`dismissedAlerts_${user.id}`);
      if (savedDismissedAlerts) {
        setDismissedAlerts(new Set(JSON.parse(savedDismissedAlerts)));
      }
    }
  }, [user]);

  // Update recommendations when zones change
  useEffect(() => {
    if (gardenZones.length > 0) {
      const newRecommendations: {[key: string]: any[]} = {};
      
      gardenZones.forEach(zone => {
        const conditions = {
          temperature: zone.temperature,
          humidity: zone.humidity,
          soilMoisture: zone.soil_moisture,
          lightHours: zone.light_hours
        };
        
        const recommendations = getRecommendationsForConditions(conditions);
        newRecommendations[zone.id] = recommendations.slice(0, 3); // Top 3 recommendations
      });
      
      setZoneRecommendations(newRecommendations);
    }
  }, [gardenZones, getRecommendationsForConditions]);

  const fetchGardenZones = async () => {
    try {
      const { data, error } = await supabase
        .from('garden_zones')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const zones = (data || []).map(zone => ({
        ...zone,
        status: zone.status as 'good' | 'needs_water' | 'critical'
      }));
      
      setGardenZones(zones);
      
      // Generate synchronized alerts based on real garden zone data
      const newAlerts = zones
        .filter(zone => {
          const needsWater = (zone.soil_moisture || 0) < 30;
          const tempIssue = (zone.temperature || 0) < 15 || (zone.temperature || 0) > 30;
          const humidityIssue = (zone.humidity || 0) < 30 || (zone.humidity || 0) > 70;
          return needsWater || tempIssue || humidityIssue;
        })
        .map((zone, index) => {
          const alertId = `${zone.id}-${zone.soil_moisture || 0}-${zone.temperature || 0}-${zone.humidity || 0}`;
          let message = '';
          let type: 'warning' | 'success' | 'critical' = 'warning';
          
          if ((zone.soil_moisture || 0) < 30) {
            message = `${zone.name} needs watering (${zone.soil_moisture || 0}% moisture)`;
            type = 'critical';
          } else if ((zone.temperature || 0) < 15 || (zone.temperature || 0) > 30) {
            message = `${zone.name} temperature issue (${zone.temperature || 0}°C)`;
          } else if ((zone.humidity || 0) < 30 || (zone.humidity || 0) > 70) {
            message = `${zone.name} humidity issue (${zone.humidity || 0}%)`;
          }
          
          return {
            id: index + 1,
            type,
            message,
            time: new Date().toLocaleTimeString(),
            active: !dismissedAlerts.has(alertId)
          };
        })
        .filter(alert => alert.active);
      
      setAlerts(newAlerts);
    } catch (error: any) {
      console.error('Error fetching garden zones:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load garden zones"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('garden-zones-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'garden_zones',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newZone = payload.new as GardenZone;
            setGardenZones(prev => [newZone, ...prev]);
            setNewZoneIds(prev => new Set([...prev, newZone.id]));
            
            // Show notification for new zone
            toast({
              title: "New Garden Zone Created",
              description: `${newZone.name} has been added to your monitor screen`,
              duration: 5000
            });
            
            // Remove "new" indicator after 10 seconds
            setTimeout(() => {
              setNewZoneIds(prev => {
                const updated = new Set(prev);
                updated.delete(newZone.id);
                return updated;
              });
            }, 10000);
          } else if (payload.eventType === 'UPDATE') {
            setGardenZones(prev => prev.map(zone => 
              zone.id === payload.new.id ? payload.new as GardenZone : zone
            ));
          } else if (payload.eventType === 'DELETE') {
            setGardenZones(prev => prev.filter(zone => zone.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Real sensor data integration - DHT11 and Soil Moisture sensors
  const readSensorData = async (zoneId: string) => {
    try {
      // In a real implementation, this would connect to actual DHT11 and soil moisture sensors
      // For now, we'll simulate realistic sensor readings that would come from hardware
      
      // DHT11 sensor readings (temperature and humidity)
      const dht11Data = await fetch(`/api/sensors/dht11/${zoneId}`).catch(() => null);
      // Soil moisture sensor readings
      const soilData = await fetch(`/api/sensors/soil/${zoneId}`).catch(() => null);
      // Light sensor readings (from AR scan or connected sensor)
      const lightData = await fetch(`/api/sensors/light/${zoneId}`).catch(() => null);
      
      // For now, return null to indicate no sensor data available
      // Real implementation would parse actual sensor values
      return null;
    } catch (error) {
      console.error('Sensor reading error:', error);
      return null;
    }
  };

  // Calculate health status based on actual sensor readings
  const calculateHealthStatus = (zone: GardenZone): 'good' | 'needs_water' | 'critical' => {
    // Soil Moisture < 20% → Critical
    if (zone.soil_moisture < 20) return 'critical';
    if (zone.soil_moisture < 40) return 'needs_water';
    
    // Temperature/Humidity out of optimal range
    if (zone.temperature < 10 || zone.temperature > 35) return 'needs_water';
    if (zone.humidity < 30) return 'needs_water';
    
    return 'good';
  };

  // Check for alerts based on sensor data and sync with database
  useEffect(() => {
    if (!user) return;
    
    const newAlerts: Alert[] = [];
    
    gardenZones.forEach(zone => {
      const healthStatus = calculateHealthStatus(zone);
      
      // Update zone status if needed
      if (zone.status !== healthStatus) {
        supabase
          .from('garden_zones')
          .update({ status: healthStatus })
          .eq('id', zone.id);
      }
      
      // Create unique alert IDs based on zone and condition
      const criticalAlertId = `critical_${zone.id}`;
      const warningAlertId = `warning_${zone.id}`;
      
      // Create alerts for critical conditions
      if (healthStatus === 'critical' && !dismissedAlerts.has(criticalAlertId)) {
        const newAlert: Alert = {
          id: Date.now(),
          message: `CRITICAL: ${zone.name} needs immediate attention - ${zone.soil_moisture.toFixed(0)}% moisture`,
          type: "critical",
          time: "Now",
          active: true
        };
        newAlerts.push(newAlert);
        
        // Only show toast for new critical alerts
        if (!alerts.some(alert => alert.message.includes(zone.name) && alert.type === "critical")) {
          toast({
            variant: "destructive",
            title: "Critical Alert",
            description: `${zone.name} requires immediate watering!`
          });
        }
      } else if (healthStatus === 'needs_water' && !dismissedAlerts.has(warningAlertId)) {
        const newAlert: Alert = {
          id: Date.now(),
          message: `${zone.name} needs water - moisture at ${zone.soil_moisture.toFixed(0)}%`,
          type: "warning",
          time: "Now",
          active: true
        };
        newAlerts.push(newAlert);
      }
    });
    
    // Update alerts with new ones, filtering out dismissed alerts
    setAlerts(newAlerts);
  }, [gardenZones, dismissedAlerts, user]);

  const waterPlant = async (zoneId: string) => {
    try {
      const zone = gardenZones.find(z => z.id === zoneId);
      if (!zone) return;
      
      const newSoilMoisture = Math.min(85, zone.soil_moisture + 40);
      const newStatus = calculateHealthStatus({ ...zone, soil_moisture: newSoilMoisture });
      
      const { error } = await supabase
        .from('garden_zones')
        .update({
          soil_moisture: newSoilMoisture,
          last_watered: new Date().toISOString(),
          status: newStatus
        })
        .eq('id', zoneId);

      if (error) throw error;

      toast({
        title: "Plant Watered",
        description: `${zone.name} has been watered successfully!`
      });

      // Clear dismissed alerts for this zone since watering fixes the issue
      const updatedDismissed = new Set(dismissedAlerts);
      updatedDismissed.delete(`critical_${zoneId}`);
      updatedDismissed.delete(`warning_${zoneId}`);
      setDismissedAlerts(updatedDismissed);
      
      // Save to localStorage
      if (user) {
        localStorage.setItem(`dismissedAlerts_${user.id}`, JSON.stringify([...updatedDismissed]));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update watering status"
      });
    }
  };

  const addNewZone = async () => {
    try {
      const newZone = {
        user_id: user?.id,
        name: `Zone ${gardenZones.length + 1}`,
        plants_count: 0,
        temperature: 22,
        humidity: 50,
        soil_moisture: 65,
        light_hours: 6,
        status: "good" as const
      };

      const { data, error } = await supabase
        .from('garden_zones')
        .insert(newZone)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "New Zone Added",
        description: "Connect your sensors to start monitoring!"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add new zone"
      });
    }
  };

  const addRecommendedPlantToZone = async (zoneId: string, plantId: string) => {
    try {
      const zone = gardenZones.find(z => z.id === zoneId);
      if (!zone) return;

      const { error } = await supabase
        .from('garden_zones')
        .update({
          plants_count: (zone.plants_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', zoneId);

      if (error) throw error;

      toast({
        title: "Plant Added!",
        description: "Recommended plant has been added to this zone"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add plant to zone"
      });
    }
  };

  const deleteZone = async (zoneId: string) => {
    try {
      const zone = gardenZones.find(z => z.id === zoneId);
      if (!zone) return;

      const { error } = await supabase
        .from('garden_zones')
        .delete()
        .eq('id', zoneId);

      if (error) throw error;

      toast({
        title: "Zone Deleted",
        description: `${zone.name} has been removed successfully`
      });

      // Clear any dismissed alerts for this zone
      const updatedDismissed = new Set(dismissedAlerts);
      updatedDismissed.delete(`critical_${zoneId}`);
      updatedDismissed.delete(`warning_${zoneId}`);
      setDismissedAlerts(updatedDismissed);
      
      // Save to localStorage
      if (user) {
        localStorage.setItem(`dismissedAlerts_${user.id}`, JSON.stringify([...updatedDismissed]));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete zone"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good": return "bg-primary";
      case "needs_water": return "bg-yellow-500";
      case "critical": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "good": return "Healthy";
      case "needs_water": return "Needs Water";
      case "critical": return "Critical";
      default: return "Unknown";
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Recently";
  };

  const dismissAlert = (alertMessage: string, zoneId?: string) => {
    if (zoneId && user) {
      // Determine alert type and create unique ID
      const alertId = alertMessage.includes('CRITICAL') ? `critical_${zoneId}` : `warning_${zoneId}`;
      
      const updatedDismissed = new Set(dismissedAlerts);
      updatedDismissed.add(alertId);
      setDismissedAlerts(updatedDismissed);
      
      // Save to localStorage
      localStorage.setItem(`dismissedAlerts_${user.id}`, JSON.stringify([...updatedDismissed]));
    }
    
    // Remove from current alerts
    setAlerts(prev => prev.filter(alert => alert.message !== alertMessage));
  };

  // Global averages - show -- if no zones exist
  const avgTemp = gardenZones.length > 0 ? gardenZones.reduce((acc, zone) => acc + zone.temperature, 0) / gardenZones.length : null;
  const avgHumidity = gardenZones.length > 0 ? gardenZones.reduce((acc, zone) => acc + zone.humidity, 0) / gardenZones.length : null;
  const avgSoilMoisture = gardenZones.length > 0 ? gardenZones.reduce((acc, zone) => acc + zone.soil_moisture, 0) / gardenZones.length : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-muted/70 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">UrbanBloom AR</h1>
          <p className="text-muted-foreground">Live data • {scans.length} AR scans • {gardenZones.length} zones</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {alerts.filter(alert => alert.active).length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-destructive animate-pulse">
                {alerts.filter(alert => alert.active).length}
              </Badge>
            )}
          </Button>
          <Button size="icon" className="bg-gradient-primary shadow-soft">
            <Camera className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-card shadow-card border-primary/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Thermometer className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Temp</p>
                <p className="text-lg font-bold text-foreground">
                  {avgTemp !== null ? `${avgTemp.toFixed(0)}°C` : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-accent/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Droplets className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Humidity</p>
                <p className="text-lg font-bold text-foreground">
                  {avgHumidity !== null ? `${avgHumidity.toFixed(0)}%` : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-ar-blue/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-ar-blue/10 rounded-lg">
                <Zap className="h-4 w-4 text-ar-blue" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Soil</p>
                <p className="text-lg font-bold text-foreground">
                  {avgSoilMoisture !== null ? `${avgSoilMoisture.toFixed(0)}%` : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Garden Zones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Garden Zones</h2>
          <Button onClick={addNewZone} variant="hero" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Zone
          </Button>
        </div>

        {gardenZones.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm shadow-soft border border-primary/10">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No garden zones yet</h3>
              <p className="text-muted-foreground mb-6">Add a zone to start monitoring your plants with real sensor data</p>
              <Button onClick={addNewZone} variant="hero" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Zone
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {gardenZones.map((zone) => (
              <Card key={zone.id} className="bg-card/80 backdrop-blur-sm shadow-soft border border-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-card-foreground">{zone.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {zone.plants_count} plants • Last watered {getTimeAgo(new Date(zone.last_watered))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusColor(zone.status)}`}></div>
                      <Badge variant={zone.status === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                        {getStatusLabel(zone.status)}
                      </Badge>
                      {newZoneIds.has(zone.id) && (
                        <Badge variant="default" className="text-xs bg-primary animate-pulse">
                          New
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteZone(zone.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div className="text-center">
                      <Thermometer className="h-4 w-4 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Temp</p>
                      <p className="text-sm font-medium">{zone.temperature.toFixed(0)}°C</p>
                    </div>
                    <div className="text-center">
                      <Droplets className="h-4 w-4 text-accent mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Humidity</p>
                      <p className="text-sm font-medium">{zone.humidity.toFixed(0)}%</p>
                    </div>
                    <div className="text-center">
                      <Zap className="h-4 w-4 text-ar-blue mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Soil</p>
                      <p className="text-sm font-medium">{zone.soil_moisture.toFixed(0)}%</p>
                    </div>
                    <div className="text-center">
                      <Sun className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Light</p>
                      <p className="text-sm font-medium">{zone.light_hours.toFixed(1)}h</p>
                    </div>
                  </div>

                  {zone.status === 'critical' && (
                    <div className="space-y-3 pt-3 border-t border-destructive/20 bg-destructive/5 -m-4 mt-3 p-4 rounded-b-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive animate-bounce" />
                          <p className="text-sm text-destructive font-medium">Critical - Immediate action needed</p>
                        </div>
                        <Button 
                          onClick={() => waterPlant(zone.id)}
                          size="sm" 
                          variant="destructive"
                        >
                          Water Now
                        </Button>
                      </div>
                      <Progress value={zone.soil_moisture} className="h-2" />
                    </div>
                  )}

                  {zone.status === 'needs_water' && (
                    <div className="space-y-3 pt-3 border-t border-yellow-500/20 bg-yellow-500/5 -m-4 mt-3 p-4 rounded-b-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-yellow-600 animate-bounce" />
                          <p className="text-sm text-yellow-700 font-medium">Water needed</p>
                        </div>
                        <Button 
                          onClick={() => waterPlant(zone.id)}
                          size="sm" 
                          className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        >
                          Water Now
                        </Button>
                      </div>
                      <Progress value={zone.soil_moisture} className="h-2" />
                    </div>
                  )}

                  {/* Plant Recommendations for this Zone */}
                  {zoneRecommendations[zone.id] && zoneRecommendations[zone.id].length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-primary/20 bg-primary/5 -m-4 mt-3 p-4 rounded-b-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Leaf className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-medium text-foreground">Recommended Plants</h4>
                        <Badge variant="secondary" className="text-xs">
                          Perfect for this zone
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {zoneRecommendations[zone.id].map((rec, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-card/50 rounded-lg border border-primary/10">
                            <div className="flex items-center gap-2">
                              <div className="text-lg">🌱</div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{rec.name}</p>
                                <p className="text-xs text-muted-foreground">{rec.reason}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs font-medium text-yellow-600">{rec.compatibility}%</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs border-primary/30 hover:bg-primary/10"
                                onClick={() => addRecommendedPlantToZone(zone.id, rec.careData.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-primary hover:bg-primary/10"
                        onClick={() => {
                          // Navigate to plants screen with this zone's conditions
                          window.location.hash = '#library';
                        }}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        View All Recommendations
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Live Alerts */}
      {alerts.filter(alert => alert.active).length > 0 && (
        <Card className="bg-card/80 backdrop-blur-sm shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Live Alerts
              <Badge variant={alerts.some(a => a.active && a.type === 'critical') ? 'destructive' : 'secondary'}>
                {alerts.filter(alert => alert.active).length} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.filter(alert => alert.active).slice(0, 3).map((alert) => (
              <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg ${
                alert.type === 'critical' ? 'bg-destructive/10 border border-destructive/20' :
                alert.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                'bg-primary/10 border border-primary/20'
              }`}>
                <div className={`w-2 h-2 rounded-full mt-2 animate-pulse ${
                  alert.type === 'critical' ? 'bg-destructive' :
                  alert.type === 'warning' ? 'bg-yellow-500' : 'bg-primary'
                }`}></div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    alert.type === 'critical' ? 'text-destructive' :
                    alert.type === 'warning' ? 'text-yellow-700' : 'text-primary'
                  }`}>{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    // Extract zone ID from alert message
                    const zoneName = alert.message.split(' ')[1]?.replace(':', '');
                    const zone = gardenZones.find(z => z.name === zoneName);
                    dismissAlert(alert.message, zone?.id);
                  }}
                >
                  Dismiss
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent AR Scans */}
      {getRecentScans(3).length > 0 && (
        <Card className="bg-card/80 backdrop-blur-sm shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Recent AR Scans
              <Badge variant="secondary">{getRecentScans(3).length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {getRecentScans(3).map((scan) => (
              <div key={scan.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">
                    {scan.detected_plant_name || 'Plant detected'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(scan.created_at).toLocaleDateString()} • 
                    Confidence: {Math.round((scan.confidence_score || 0) * 100)}%
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {scan.environmental_data?.temperature?.toFixed(0)}°C
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Overall Plant Recommendations */}
      {gardenZones.length > 0 && (
        <Card className="bg-gradient-card backdrop-blur-sm shadow-card border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" />
              Smart Plant Recommendations
              <Badge variant="secondary" className="text-xs">
                AI-Powered
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Based on your garden zones' current conditions, here are the best plants to add:
            </p>
            
            <div className="grid gap-3">
              {Object.entries(zoneRecommendations).slice(0, 2).map(([zoneId, recommendations]) => {
                const zone = gardenZones.find(z => z.id === zoneId);
                if (!zone || recommendations.length === 0) return null;
                
                return (
                  <div key={zoneId} className="bg-card/50 rounded-lg p-3 border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm text-foreground">{zone.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {zone.temperature}°C • {zone.humidity}% • {zone.soil_moisture}% soil
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {recommendations.slice(0, 2).map((rec, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-sm">🌱</div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{rec.name}</p>
                              <p className="text-xs text-muted-foreground">{rec.reason}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs font-medium text-yellow-600">{rec.compatibility}%</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => addRecommendedPlantToZone(zoneId, rec.careData.id)}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              className="w-full border-primary/30 hover:bg-primary/10"
              onClick={() => {
                window.location.hash = '#library';
              }}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Explore All Plant Recommendations
            </Button>
          </CardContent>
        </Card>
      )}

      {gardenZones.length > 0 && alerts.filter(alert => alert.active).length === 0 && (
        <Card className="bg-primary/5 backdrop-blur-sm shadow-soft border border-primary/10">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium text-foreground mb-1">All Systems Healthy</h3>
            <p className="text-sm text-muted-foreground">Your garden is thriving! 🌱</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FunctionalDashboard;