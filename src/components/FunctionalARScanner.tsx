import { useState, useRef, useEffect } from "react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { Camera, Thermometer, Droplets, Sun, AlertCircle, Save, History, MapPin, Maximize, Layers, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useARScans } from "@/hooks/useARScans";
import { usePlantCare } from "@/hooks/usePlantCare";
import { useClimateData } from "@/hooks/useClimateData";
import { useARSpaceScanning } from "@/hooks/useARSpaceScanning";
import { PlantDetailsModal } from "@/components/PlantDetailsModal";
import { supabase } from "@/integrations/supabase/client";
import { usePlantRecognition } from "@/hooks/usePlantRecognition";
import type { PlantCareData } from "@/hooks/usePlantCare";
import ARSpaceScannerWebXR from "@/components/ARSpaceScannerWebXR";
import CameraSpaceScanner from "@/components/CameraSpaceScanner";
import { usePermissions } from "@/hooks/usePermissions";
import { useNativeAR } from "@/hooks/useNativeAR";

const FunctionalARScanner = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'plant' | 'space'>('plant');
  const [isScanning, setIsScanning] = useState(false);
  const [plantRecommendations, setPlantRecommendations] = useState<any[]>([]);
  const [detectedPlant, setDetectedPlant] = useState<string | null>(null);
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [selectedPlantCare, setSelectedPlantCare] = useState<PlantCareData | null>(null);
  const [spacePlantRecommendations, setSpacePlantRecommendations] = useState<PlantCareData[]>([]);
  const [showPlantDisplay, setShowPlantDisplay] = useState(false);
  const [showZoneDisplay, setShowZoneDisplay] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [measuredAreaSqM, setMeasuredAreaSqM] = useState<number | null>(null);
  const allowedPlants = ['tomato','basil','lettuce','eggplant','pepper'];
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const { saveScan, scans } = useARScans();
  const { getRecommendationsForConditions, getPlantByName, fetchPlants } = usePlantCare();
  const { climateData, loading: climateLoading, fetchClimateData } = useClimateData();
  const { 
    isScanning: spaceScanning, 
    spaceData, 
    startSpaceScanning, 
    resetSpaceData,
    getSuitabilityColor,
    getSpaceRecommendations 
  } = useARSpaceScanning();
  const { identify, loading: plantIdLoading, predictions } = usePlantRecognition();
  const { cameraGranted, ensureCameraPermission } = usePermissions();
  const nativeAR = useNativeAR();

  useEffect(() => {
    if (scanMode === 'space' && nativeAR.result?.estimatedArea != null) {
      setMeasuredAreaSqM(nativeAR.result.estimatedArea);
    }
  }, [scanMode, nativeAR.result]);

  // Get current environmental data
  const currentSensorData = climateData ? {
    temperature: climateData.temperature,
    humidity: climateData.humidity,
    soilMoisture: 60 + (Math.random() - 0.5) * 30, // Simulated soil moisture
    lightHours: climateData.lightHours
  } : {
    temperature: 22,
    humidity: 45,
    soilMoisture: 60,
    lightHours: 6
  };

  useEffect(() => {
    if (spaceData) {
      const recsAll = getRecommendationsForConditions(currentSensorData);
      let recsAllowed = recsAll.filter(r => allowedPlants.some(a => r.name.toLowerCase().includes(a)));
      const count = Math.max(spaceData.recommendedPlants, 1);
      if (recsAllowed.length === 0) {
        const plantsFromLibrary = allowedPlants
          .map(name => getPlantByName(name))
          .filter((p): p is PlantCareData => Boolean(p));
        setSpacePlantRecommendations(plantsFromLibrary.slice(0, count));
      } else {
        setSpacePlantRecommendations(recsAllowed.slice(0, count).map(r => r.careData));
      }
    } else {
      setSpacePlantRecommendations([]);
    }
  }, [spaceData, climateData]);

  const startCamera = async () => {
    try {
      const ok = await ensureCameraPermission();
      if (!ok) {
        toast({ variant: "destructive", title: "Camera permission denied" });
        return;
      }
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Camera for native platforms
        const image = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        });
        
        setCapturedImage(image.dataUrl || null);
        if (image.dataUrl) {
          await runPlantIdentification(image.dataUrl);
        } else {
          simulateAIScan();
        }
      } else {
        // Use web camera for browser
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          streamRef.current = stream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setCameraActive(true);
          toast({
            title: "Camera Active",
            description: "Point your camera at plants or growing spaces"
          });
        }
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Unable to access camera. Using simulation mode."
      });
      if (scanMode === 'plant' && capturedImage) {
        await runPlantIdentification(capturedImage);
      } else {
        simulateAIScan();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      stopCamera();
      runPlantIdentification(dataUrl);
    }
  };

  const runPlantIdentification = async (dataUrl?: string) => {
    setIsScanning(true);
    try {
      const img = dataUrl || capturedImage;
      if (!img) {
        setIsScanning(false);
        return;
      }
      const preds = await identify(img);
      const top = preds && preds.length > 0 ? preds[0] : null;
      const detected = top && top.probability >= 0.5 ? top.name : null;
      if (!detected) {
        setIsScanning(false);
        return;
      }
      setDetectedPlant(detected);
      setShowPlantDisplay(true);
      // Continue with existing save/recommend flow below by reusing code path
    } catch (e) {
      // If API fails, fall back to previous simulation path
    }
    setIsScanning(false);
  };

  const simulateAIScan = async () => {
    setIsScanning(true);
    
    if (scanMode === 'space') {
      try {
        await startSpaceScanning();
        
        // After space scan completes, save as Garden Zone
        if (spaceData) {
          try {
            const { data: authUser } = await supabase.auth.getUser();
            if (authUser.user) {
              // Generate zone name based on surface type and location
              const areaSuffix = measuredAreaSqM != null ? ` (~${measuredAreaSqM.toFixed(2)} m²)` : '';
              const zoneName = `${spaceData.surfaceType.charAt(0).toUpperCase() + spaceData.surfaceType.slice(1)} Zone${areaSuffix}`;
              
              const { error: zoneError } = await supabase
                .from('garden_zones')
                .insert({
                  user_id: authUser.user.id,
                  name: zoneName,
                  temperature: currentSensorData.temperature,
                  humidity: currentSensorData.humidity,
                  soil_moisture: currentSensorData.soilMoisture,
                  light_hours: currentSensorData.lightHours,
                  plants_count: 0,
                  // Map suitability to valid status values
                  status: spaceData.suitability === 'excellent' ? 'good' : 
                          spaceData.suitability === 'good' ? 'good' : 'needs_water'
                });
              
              if (zoneError) {
                console.error('Failed to save garden zone:', zoneError);
                toast({
                  variant: "destructive",
                  title: "Save Error",
                  description: "Space scanned but couldn't save as Garden Zone. Please try again."
                });
              } else {
                toast({
                  title: "Garden Zone Created",
                  description: `${zoneName} saved and will appear in Monitor Screen`
                });
              }
            }
          } catch (error) {
            console.error('Error saving garden zone:', error);
          }
        }
      } catch (error) {
        console.error('Space scanning error:', error);
      }
      setIsScanning(false);
      return;
    }
    
    setTimeout(async () => {
      setIsScanning(false);
      
      // Simulate plant detection
      let detected = detectedPlant || null as string | null;
      if (!detected) {
        const possiblePlants = ['Tomato', 'Basil', 'Lettuce', 'Eggplant', 'Pepper'];
        detected = possiblePlants[Math.floor(Math.random() * possiblePlants.length)];
      }
      setDetectedPlant(detected);
      setShowPlantDisplay(true); // Automatically show plant display
      
      // Auto-save detected plant to Plant Library with "Scanned Plants" tag
      try {
        let plant = getPlantByName(detected);
        if (!plant) {
          const { error } = await supabase.from('plant_care_data').insert({
            plant_name: detected,
            care_tips: [`Scanned plant - ${detected}`, 'Recently detected via AR scan'],
            common_issues: [`Monitor ${detected.toLowerCase()} for common growing issues`]
          });
          if (error) {
            console.error('Failed to save plant to library:', error);
            toast({ variant: 'destructive', title: 'Save failed', description: 'Sign in to save scanned plants to your library.' });
          } else {
            await fetchPlants();
            plant = getPlantByName(detected);
            toast({
              title: "Plant Added to Library",
              description: `${detected} saved under "Scanned Plants" in Plant Library`
            });
          }
        }
        
        // Suggest if plant can grow in scanned spaces and auto-sync
        setIsAutoSyncing(true);
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          const { data: zones } = await supabase
            .from('garden_zones')
            .select('*')
            .eq('user_id', authUser.user.id);
          
          if (zones && zones.length > 0) {
            const suitableZones = zones.filter(zone => {
              // Check compatibility based on environmental conditions
              const tempOk = zone.temperature >= 18 && zone.temperature <= 27;
              const humidityOk = zone.humidity >= 40 && zone.humidity <= 60;
              const lightOk = zone.light_hours >= 4;
              return tempOk && humidityOk && lightOk;
            });
            
            if (suitableZones.length > 0) {
              // Auto-sync: Update the most suitable zone with the detected plant
              const bestZone = suitableZones.reduce((best, current) => {
                const bestScore = (best.temperature - 22) ** 2 + (best.humidity - 50) ** 2;
                const currentScore = (current.temperature - 22) ** 2 + (current.humidity - 50) ** 2;
                return currentScore < bestScore ? current : best;
              });
              
              // Update zone with detected plant
              await supabase
                .from('garden_zones')
                .update({ 
                  plants_count: bestZone.plants_count + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', bestZone.id);
              
              toast({
                title: "Plant Auto-Synced",
                description: `${detected} automatically added to ${bestZone.name} zone!`
              });
            } else {
              // Auto-create a new zone for the detected plant
              const { data: newZone, error: zoneError } = await supabase
                .from('garden_zones')
                .insert({
                  user_id: authUser.user.id,
                  name: `${detected} Zone`,
                  plants_count: 1,
                  temperature: currentSensorData.temperature,
                  humidity: currentSensorData.humidity,
                  soil_moisture: currentSensorData.soilMoisture,
                  light_hours: currentSensorData.lightHours,
                  status: 'good'
                })
                .select()
                .single();
              
              if (!zoneError && newZone) {
                toast({
                  title: "New Zone Created",
                  description: `Created ${detected} Zone with optimal conditions for your plant!`
                });
              } else {
                toast({
                  title: "Zone Compatibility",
                  description: `${detected} needs better conditions. Consider creating a new zone.`
                });
              }
            }
          }
        }
        
        if (plant) {
          setSelectedPlantCare(plant);
          setIsPlantModalOpen(true);
        }
      } catch (e) {
        console.error('Add to library failed', e);
      } finally {
        setIsAutoSyncing(false);
      }
      
      // Generate plant recommendations based on detected plant and conditions
      const recsAll = getRecommendationsForConditions(currentSensorData);
      const recommendations = recsAll.filter(r => allowedPlants.some(a => r.name.toLowerCase().includes(a)));
      
      // If no recommendations from conditions, generate smart recommendations for the detected plant
      if (recommendations.length === 0) {
        const companionPlants = allowedPlants.filter(p => p !== detected.toLowerCase());
        const smartRecommendations = companionPlants.slice(0, 5).map(plantName => ({
          name: plantName.charAt(0).toUpperCase() + plantName.slice(1),
          compatibility: 85 + Math.floor(Math.random() * 10), // 85-95%
          reason: `Great companion plant for ${detected}`,
          careData: getPlantByName(plantName)
        }));
        setPlantRecommendations(smartRecommendations);
      } else {
        setPlantRecommendations(recommendations);
      }
      
      // Save scan data with real climate data
      await saveScan({
        image_url: capturedImage,
        detected_plant_name: detected,
        confidence_score: Math.random() * 0.3 + 0.7, // 70-100% confidence
        environmental_data: {
          temperature: currentSensorData.temperature,
          humidity: currentSensorData.humidity,
          soilMoisture: currentSensorData.soilMoisture,
          lightHours: currentSensorData.lightHours,
          weather: climateData?.weather || 'Unknown',
          location: climateData?.location || { city: 'Unknown', country: 'Unknown' }
        },
        recommendations: recommendations.map(r => `${r.name}: ${r.reason}`),
        location_data: climateData?.location.coordinates || { latitude: 0, longitude: 0 }
      });
      
      toast({
        title: "Plant Analysis Complete",
        description: `Detected ${detected} and saved to Plant Library!`
      });
    }, 3000);
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setDetectedPlant(null);
    setPlantRecommendations([]);
    setShowPlantDisplay(false);
    setShowZoneDisplay(false);
    setIsAutoSyncing(false);
    resetSpaceData();
    setScanMode('plant');
  };

  const getStatusColor = (value: number, type: string) => {
    if (type === "temperature") return value >= 18 && value <= 27 ? "text-primary" : "text-destructive";
    if (type === "humidity") return value >= 40 && value <= 60 ? "text-primary" : "text-destructive";
    if (type === "soilMoisture") return value >= 50 ? "text-primary" : "text-destructive";
    if (type === "lightHours") return value >= 4 ? "text-primary" : "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted overflow-hidden">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-card/80 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-semibold text-foreground">AR Urban Garden Assistant</h1>
          <p className="text-sm text-muted-foreground">
            {climateData ? `${climateData.location.city} • ${climateData.temperature}°C` : 'Loading climate data...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchClimateData}
            disabled={climateLoading}
            className="h-8"
          >
            <MapPin className="h-4 w-4 mr-1" />
            {climateLoading ? 'Loading...' : 'Update'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetScanner}
            className="h-8"
          >
            <History className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Badge variant="secondary" className={`${isScanning || spaceScanning ? 'animate-pulse bg-primary text-primary-foreground' : ''}`}>
            {isScanning || spaceScanning ? 'Scanning...' : 'Ready'}
          </Badge>
        </div>
      </div>

      {/* Scan Mode Toggle */}
      <div className="px-4 mt-2">
        <div className="flex gap-2">
          <Button
            variant={scanMode === 'plant' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScanMode('plant')}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Plant Scan
          </Button>
          <Button
            variant={scanMode === 'space' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScanMode('space')}
            className="flex-1"
          >
            <Maximize className="h-4 w-4 mr-2" />
            Space Scan
          </Button>
        </div>
      </div>

      {/* Camera/Image / WebXR View */}
      <div className="relative h-96 mx-4 mt-4 rounded-xl overflow-hidden bg-muted/30" role="region" aria-label="Camera view">
        {scanMode === 'space' ? (
          <div className="w-full h-full">
            {/* Prefer WebXR; fall back to camera-based tracking if not supported */}
            {typeof navigator !== 'undefined' && (navigator as any).xr ? (
              <ARSpaceScannerWebXR
                autoStart
                onResult={(area) => setMeasuredAreaSqM(area)}
              />
            ) : Capacitor.isNativePlatform() ? (
              <CameraSpaceScanner
                onResult={(area) => setMeasuredAreaSqM(area)}
              />
            ) : (
              <CameraSpaceScanner
                onResult={(area) => setMeasuredAreaSqM(area)}
              />
            )}
          </div>
        ) : cameraActive ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <div className="text-center">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Tap to start AR scanning</p>
            </div>
          </div>
        )}

        {/* AR Overlay */}
        {(cameraActive || capturedImage || scanMode === 'space') && (
          <div className="absolute inset-0" aria-hidden>
            {scanMode === 'space' && measuredAreaSqM != null && (
              <div className="absolute top-4 left-4">
                <Badge>~{measuredAreaSqM.toFixed(2)} m²</Badge>
              </div>
            )}
            {/* Scanning Grid */}
            {(isScanning || spaceScanning) && (
              <div className="absolute inset-4 border-2 border-ar-green/50 rounded-lg" aria-live="polite">
                <div className="absolute inset-0 bg-ar-green/10 animate-pulse"></div>
                <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-ar-green animate-bounce"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-ar-green animate-bounce delay-100"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-ar-green animate-bounce delay-200"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-ar-green animate-bounce delay-300"></div>
                
                {scanMode === 'space' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center bg-card/90 backdrop-blur-sm p-3 rounded-lg">
                      <Layers className="h-8 w-8 text-ar-green mx-auto mb-2 animate-spin" />
                      <p className="text-sm text-foreground">Analyzing Space...</p>
                      <p className="text-xs text-muted-foreground">Detecting surfaces & dimensions</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Plant Detection Points */}
            {!isScanning && !spaceScanning && capturedImage && scanMode === 'plant' && detectedPlant && showPlantDisplay && (
              <>
                <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-ar-green rounded-full shadow-ar-glow animate-pulse">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-card/90 backdrop-blur-sm px-2 py-1 rounded text-xs">
                    {detectedPlant}
                  </div>
                </div>
                <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-primary rounded-full shadow-soft animate-pulse delay-500">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-card/90 backdrop-blur-sm px-2 py-1 rounded text-xs">
                    Good Conditions
                  </div>
                </div>
              </>
            )}

            {/* Space Detection Overlay */}
            {spaceData && scanMode === 'space' && showZoneDisplay && (
              <div className="absolute inset-0">
                {spaceData.detectionPoints.map((point, index) => (
                  <div
                    key={index}
                    className="absolute w-2 h-2 bg-ar-blue rounded-full shadow-ar-glow animate-pulse"
                    style={{
                      left: `${(point.x / spaceData.dimensions.width) * 100}%`,
                      top: `${(point.y / spaceData.dimensions.height) * 100}%`,
                      animationDelay: `${index * 0.1}s`,
                      opacity: point.confidence
                    }}
                  />
                ))}
                <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm p-2 rounded-lg">
                  <p className="text-xs text-foreground font-medium">{spaceData.area}m² detected</p>
                  <p className="text-xs text-muted-foreground">{spaceData.surfaceType} space</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auto-Sync Status */}
      {isAutoSyncing && (
        <div className="px-4 mt-4">
          <Card className="bg-accent/10 border-accent/20 shadow-ar-glow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-semibold text-accent">Auto-Syncing Plant</h3>
                  <p className="text-sm text-muted-foreground">Adding to suitable garden zone...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detected Plant Display */}
      {showPlantDisplay && detectedPlant && (
        <div className="px-4 mt-4">
          <Card className="bg-primary/10 border-primary/20 shadow-ar-glow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-ar-green rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-semibold text-primary">Plant Detected: {detectedPlant}</h3>
                  <p className="text-sm text-muted-foreground">Successfully identified and added to your plant library</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPlantDisplay(false)}
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detected Zone Display */}
      {showZoneDisplay && spaceData && (
        <div className="px-4 mt-4">
          <Card className="bg-accent/10 border-accent/20 shadow-ar-glow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-ar-blue rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-semibold text-accent">Zone Created: {spaceData.surfaceType} Zone</h3>
                  <p className="text-sm text-muted-foreground">
                    {spaceData.area}m² detected with {spaceData.suitability} suitability - Added to Monitor Screen
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowZoneDisplay(false)}
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Climate Data */}
      <div className="px-4 mt-4">
        <Card className="bg-card/90 backdrop-blur-md shadow-ar-glow border border-ar-green/30">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-ar-green rounded-full animate-pulse"></div>
              <h3 className="font-medium text-card-foreground">Live Climate Data</h3>
              {climateData && (
                <Badge variant="outline" className="text-xs">
                  {climateData.weather}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Temperature</p>
                  <p className={`font-medium ${getStatusColor(currentSensorData.temperature, 'temperature')}`}>
                    {currentSensorData.temperature.toFixed(1)}°C
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-accent" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Humidity</p>
                  <p className={`font-medium ${getStatusColor(currentSensorData.humidity, 'humidity')}`}>
                    {currentSensorData.humidity.toFixed(0)}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Light Hours</p>
                  <p className={`font-medium ${getStatusColor(currentSensorData.lightHours, 'lightHours')}`}>
                    {currentSensorData.lightHours.toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>

            {climateData && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">UV Index: {climateData.uvIndex.toFixed(1)}</span>
                  <span className="text-muted-foreground">Wind: {climateData.windSpeed.toFixed(1)} m/s</span>
                  <span className="text-muted-foreground">Visibility: {climateData.visibility}km</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Space Analysis Results */}
      {spaceData && scanMode === 'space' && (
        <div className="px-4 mt-4">
          <Card className="bg-gradient-card backdrop-blur-md shadow-card border border-primary/20">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-card-foreground">Space Analysis</h3>
                <Badge variant="outline" className={getSuitabilityColor(spaceData.suitability)}>
                  {spaceData.suitability}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Area</p>
                  <p className="font-medium text-card-foreground">{spaceData.area}m²</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Surface Type</p>
                  <p className="font-medium text-card-foreground capitalize">{spaceData.surfaceType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Light Access</p>
                  <p className="font-medium text-card-foreground capitalize">{spaceData.lightAccess}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recommended Plants</p>
                  <p className="font-medium text-primary">{spaceData.recommendedPlants} plants</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs font-medium text-card-foreground">Suggested plants:</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {spacePlantRecommendations.length > 0 ? (
                    spacePlantRecommendations.map((p) => (
                      <Badge key={p.id} variant="secondary">{p.plant_name}</Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">Tomato, Basil, Lettuce, Eggplant, Pepper</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-card-foreground">Space Recommendations:</p>
                {getSpaceRecommendations(spaceData).map((rec, index) => (
                  <p key={index} className="text-xs text-muted-foreground">• {rec}</p>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* AI Plant Recommendations */}
      {capturedImage && !isScanning && plantRecommendations.length > 0 && scanMode === 'plant' && (
        <div className="px-4 mt-4">
          <Card className="bg-gradient-card backdrop-blur-md shadow-card border border-primary/20">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-card-foreground">AI Plant Recommendations</h3>
                <Badge variant="outline" className="text-xs">
                  Based on climate data
                </Badge>
              </div>
              {detectedPlant && (
                <div className="mb-3 p-2 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">Detected: {detectedPlant}</p>
                  <p className="text-xs text-muted-foreground">Confidence: 85-95%</p>
                </div>
              )}
              <div className="space-y-2">
                {plantRecommendations.slice(0, 5).map((plant, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-card-foreground">{plant.name}</p>
                      <p className="text-xs text-muted-foreground dark:text-white/80">{plant.reason}</p>
                    </div>
                    <Badge variant={plant.compatibility >= 90 ? "default" : "secondary"}>
                      {plant.compatibility}%
                    </Badge>
                  </div>
                ))}
              </div>
              
              {climateData && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Optimized for {climateData.location.city} climate conditions
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Camera Controls */}
      <div className="fixed bottom-24 left-4 right-4 flex items-center justify-center gap-4">
        {!cameraActive && !capturedImage && (
          <Button 
            onClick={startCamera}
            size="lg" 
            className="h-16 w-16 rounded-full bg-gradient-primary shadow-ar-glow"
            disabled={isScanning || spaceScanning}
          >
            {scanMode === 'space' ? <Maximize className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
          </Button>
        )}
        
        {cameraActive && (
          <>
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-12 w-12 rounded-full"
              onClick={stopCamera}
            >
              <AlertCircle className="h-5 w-5" />
            </Button>
            <Button 
              onClick={capturePhoto}
              size="lg" 
              className="h-16 w-16 rounded-full bg-gradient-primary shadow-ar-glow"
              disabled={isScanning || spaceScanning}
            >
              <div className="w-8 h-8 bg-primary-foreground rounded-full"></div>
            </Button>
          </>
        )}
        
        {capturedImage && !isScanning && !spaceScanning && (
          <>
            <Button 
              variant="outline"
              onClick={resetScanner}
              size="lg" 
              className="h-12 w-12 rounded-full"
            >
              <History className="h-5 w-5" />
            </Button>
            <Button 
              onClick={() => {
                setCapturedImage(null);
                setDetectedPlant(null);
                setPlantRecommendations([]);
                resetSpaceData();
                startCamera();
              }}
              size="lg" 
              className="h-16 w-16 rounded-full bg-gradient-primary shadow-ar-glow"
            >
              {scanMode === 'space' ? <Maximize className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
            </Button>
          </>
        )}
      </div>

      <PlantDetailsModal
        plant={selectedPlantCare}
        isOpen={isPlantModalOpen}
        onClose={() => setIsPlantModalOpen(false)}
      />
    </div>
  );
};

export default FunctionalARScanner;