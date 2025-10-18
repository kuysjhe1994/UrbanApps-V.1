import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface SpaceDetection {
  area: number; // in square meters
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  surfaceType: 'balcony' | 'floor' | 'table' | 'shelf' | 'wall' | 'unknown';
  lightAccess: 'direct' | 'indirect' | 'artificial' | 'low';
  suitability: 'excellent' | 'good' | 'fair' | 'poor';
  recommendedPlants: number;
  detectionPoints: Array<{
    x: number;
    y: number;
    z: number;
    confidence: number;
  }>;
}

export const useARSpaceScanning = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [spaceData, setSpaceData] = useState<SpaceDetection | null>(null);
  const [scanHistory, setScanHistory] = useState<SpaceDetection[]>([]);
  const [showZoneDisplay, setShowZoneDisplay] = useState(false);
  const { toast } = useToast();

  const simulateARSpaceDetection = async (): Promise<SpaceDetection> => {
    // Simulate AR space detection with realistic data
    const width = 0.5 + Math.random() * 3; // 0.5-3.5 meters
    const height = 0.3 + Math.random() * 2; // 0.3-2.3 meters
    const depth = 0.3 + Math.random() * 1.5; // 0.3-1.8 meters
    const area = width * depth;

    const surfaceTypes: SpaceDetection['surfaceType'][] = ['balcony', 'floor', 'table', 'shelf', 'wall'];
    const lightTypes: SpaceDetection['lightAccess'][] = ['direct', 'indirect', 'artificial', 'low'];
    
    const surfaceType = surfaceTypes[Math.floor(Math.random() * surfaceTypes.length)];
    const lightAccess = lightTypes[Math.floor(Math.random() * lightTypes.length)];

    // Calculate suitability based on space characteristics
    let suitabilityScore = 0;
    if (area > 1) suitabilityScore += 25;
    if (area > 2) suitabilityScore += 25;
    if (lightAccess === 'direct') suitabilityScore += 30;
    else if (lightAccess === 'indirect') suitabilityScore += 20;
    else if (lightAccess === 'artificial') suitabilityScore += 10;
    if (surfaceType === 'balcony' || surfaceType === 'floor') suitabilityScore += 20;

    const suitability: SpaceDetection['suitability'] = 
      suitabilityScore >= 75 ? 'excellent' :
      suitabilityScore >= 50 ? 'good' :
      suitabilityScore >= 25 ? 'fair' : 'poor';

    // Generate detection points
    const detectionPoints = Array.from({ length: 8 + Math.floor(Math.random() * 12) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * depth,
      confidence: 0.7 + Math.random() * 0.3
    }));

    const recommendedPlants = Math.max(1, Math.round(area * (suitabilityScore / 100) * 3));

    return {
      area: Math.round(area * 100) / 100,
      dimensions: {
        width: Math.round(width * 100) / 100,
        height: Math.round(height * 100) / 100,
        depth: Math.round(depth * 100) / 100
      },
      surfaceType,
      lightAccess,
      suitability,
      recommendedPlants,
      detectionPoints
    };
  };

  const startSpaceScanning = async () => {
    setIsScanning(true);
    
    try {
      toast({
        title: "AR Space Scanning",
        description: "Analyzing your space for optimal plant placement..."
      });

      // Simulate scanning time
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

      const detection = await simulateARSpaceDetection();
      setSpaceData(detection);
      setScanHistory(prev => [detection, ...prev.slice(0, 9)]); // Keep last 10 scans
      setShowZoneDisplay(true); // Automatically show zone display

      toast({
        title: "Space Analysis Complete",
        description: `Detected ${detection.area}m² ${detection.surfaceType} with ${detection.suitability} suitability`
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Scanning Error",
        description: "Failed to analyze space. Using fallback detection."
      });
    } finally {
      setIsScanning(false);
    }
  };

  const resetSpaceData = () => {
    setSpaceData(null);
  };

  const getSuitabilityColor = (suitability: SpaceDetection['suitability']) => {
    switch (suitability) {
      case 'excellent': return 'text-primary';
      case 'good': return 'text-accent';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getSpaceRecommendations = (space: SpaceDetection) => {
    const recommendations: string[] = [];

    if (space.area < 0.5) {
      recommendations.push("Consider vertical growing with wall-mounted planters");
      recommendations.push("Small herbs like basil, mint, or cilantro would work well");
    } else if (space.area < 1.5) {
      recommendations.push("Perfect for 2-4 medium plants or 6-8 small plants");
      recommendations.push("Mix of leafy greens and herbs recommended");
    } else {
      recommendations.push("Excellent space for diverse vegetable garden");
      recommendations.push("Consider larger plants like tomatoes or peppers");
    }

    if (space.lightAccess === 'low') {
      recommendations.push("Add grow lights for better plant health");
      recommendations.push("Focus on low-light tolerant plants");
    } else if (space.lightAccess === 'direct') {
      recommendations.push("Excellent for sun-loving vegetables");
      recommendations.push("Consider shade cloth for sensitive plants");
    }

    if (space.surfaceType === 'balcony') {
      recommendations.push("Ensure proper drainage for containers");
      recommendations.push("Consider wind protection for tall plants");
    }

    return recommendations;
  };

  return {
    isScanning,
    spaceData,
    scanHistory,
    showZoneDisplay,
    setShowZoneDisplay,
    startSpaceScanning,
    resetSpaceData,
    getSuitabilityColor,
    getSpaceRecommendations
  };
};