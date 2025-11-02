/**
 * AI Recommendation Service
 * Provides intelligent plant recommendations based on:
 * - Detected plants (companion planting)
 * - Space characteristics (size, light, surface type)
 * - Environmental conditions (temperature, humidity, light)
 */

import type { PlantCareData } from "@/hooks/usePlantCare";

export interface SpaceAnalysis {
  area: number;
  surfaceType: 'balcony' | 'floor' | 'table' | 'shelf' | 'wall' | 'unknown';
  lightAccess: 'direct' | 'indirect' | 'artificial' | 'low';
  suitability: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface EnvironmentalConditions {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightHours: number;
}

export interface PlantRecommendation {
  name: string;
  compatibility: number; // 0-100
  reason: string;
  careData: PlantCareData | null;
  priority: 'high' | 'medium' | 'low';
}

class AIRecommendationService {
  /**
   * Get AI-powered recommendations for a scanned space
   */
  getSpaceRecommendations(
    space: SpaceAnalysis,
    conditions: EnvironmentalConditions,
    availablePlants: PlantCareData[]
  ): PlantRecommendation[] {
    const recommendations: PlantRecommendation[] = [];

    // Filter plants based on space characteristics
    const suitablePlants = availablePlants.filter(plant => {
      return this.isPlantSuitableForSpace(plant, space, conditions);
    });

    // Score each plant
    suitablePlants.forEach(plant => {
      const score = this.calculateSpaceCompatibility(plant, space, conditions);
      if (score.compatibility >= 60) {
        recommendations.push({
          name: plant.plant_name,
          compatibility: score.compatibility,
          reason: score.reason,
          careData: plant,
          priority: score.compatibility >= 85 ? 'high' : 
                   score.compatibility >= 75 ? 'medium' : 'low'
        });
      }
    });

    // Sort by compatibility and limit results
    return recommendations
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, Math.max(3, Math.min(space.recommendedPlants || 5, 10)));
  }

  /**
   * Get AI-powered companion plant recommendations for a detected plant
   */
  getPlantRecommendations(
    detectedPlant: string,
    conditions: EnvironmentalConditions,
    availablePlants: PlantCareData[]
  ): PlantRecommendation[] {
    const recommendations: PlantRecommendation[] = [];

    // Companion planting rules (AI-enhanced)
    const companionRules: Record<string, string[]> = {
      'tomato': ['basil', 'lettuce', 'pepper', 'marigold'],
      'basil': ['tomato', 'pepper', 'oregano', 'lettuce'],
      'lettuce': ['tomato', 'basil', 'radish', 'carrot'],
      'eggplant': ['basil', 'pepper', 'beans', 'marigold'],
      'pepper': ['basil', 'tomato', 'eggplant', 'oregano']
    };

    const companions = companionRules[detectedPlant.toLowerCase()] || [];

    // Find companion plants
    companions.forEach(companionName => {
      const plant = availablePlants.find(p => 
        p.plant_name.toLowerCase().includes(companionName.toLowerCase())
      );
      
      if (plant) {
        const score = this.calculateCompanionScore(detectedPlant, plant, conditions);
        recommendations.push({
          name: plant.plant_name,
          compatibility: score.compatibility,
          reason: score.reason,
          careData: plant,
          priority: 'high'
        });
      }
    });

    // Add plants with similar environmental needs
    const detectedPlantData = availablePlants.find(p => 
      p.plant_name.toLowerCase().includes(detectedPlant.toLowerCase())
    );

    if (detectedPlantData) {
      const similarPlants = availablePlants.filter(plant => {
        if (plant.id === detectedPlantData.id) return false;
        if (recommendations.some(r => r.name === plant.plant_name)) return false;
        
        return this.haveSimilarNeeds(detectedPlantData, plant);
      });

      similarPlants.forEach(plant => {
        const score = this.calculateEnvironmentalMatch(plant, conditions);
        if (score.compatibility >= 70) {
          recommendations.push({
            name: plant.plant_name,
            compatibility: score.compatibility,
            reason: `Similar growing conditions to ${detectedPlant}`,
            careData: plant,
            priority: 'medium'
          });
        }
      });
    }

    return recommendations
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, 5);
  }

  /**
   * Check if plant is suitable for the scanned space
   */
  private isPlantSuitableForSpace(
    plant: PlantCareData,
    space: SpaceAnalysis,
    conditions: EnvironmentalConditions
  ): boolean {
    // Size compatibility
    const plantSize = this.estimatePlantSize(plant);
    const spaceSuitable = this.checkSpaceSizeCompatibility(plantSize, space.area);

    // Light compatibility
    const lightCompatible = this.checkLightCompatibility(plant, space.lightAccess);

    // Surface compatibility
    const surfaceCompatible = this.checkSurfaceCompatibility(plant, space.surfaceType);

    return spaceSuitable && lightCompatible && surfaceCompatible;
  }

  /**
   * Calculate compatibility score for space
   */
  private calculateSpaceCompatibility(
    plant: PlantCareData,
    space: SpaceAnalysis,
    conditions: EnvironmentalConditions
  ): { compatibility: number; reason: string } {
    let score = 0;
    const reasons: string[] = [];

    // Environmental match (40%)
    const envScore = this.calculateEnvironmentalMatch(plant, conditions);
    score += envScore.compatibility * 0.4;
    if (envScore.compatibility >= 80) reasons.push("Perfect environmental match");

    // Space size (30%)
    const plantSize = this.estimatePlantSize(plant);
    const sizeScore = this.calculateSizeScore(plantSize, space.area);
    score += sizeScore * 30;
    if (sizeScore >= 0.8) reasons.push(`Fits well in ${space.area}m² space`);

    // Light compatibility (20%)
    const lightScore = this.calculateLightScore(plant, space.lightAccess);
    score += lightScore * 20;
    if (lightScore >= 0.8) reasons.push(`Thrives in ${space.lightAccess} light`);

    // Surface type (10%)
    const surfaceScore = this.calculateSurfaceScore(plant, space.surfaceType);
    score += surfaceScore * 10;

    const compatibility = Math.round(score);
    const reason = reasons.length > 0 
      ? reasons.slice(0, 2).join(", ") 
      : `${compatibility}% compatible with your space`;

    return { compatibility, reason };
  }

  /**
   * Calculate companion planting score
   */
  private calculateCompanionScore(
    detected: string,
    companion: PlantCareData,
    conditions: EnvironmentalConditions
  ): { compatibility: number; reason: string } {
    let score = 85; // Base score for known companions

    const envScore = this.calculateEnvironmentalMatch(companion, conditions);
    score = (score + envScore.compatibility) / 2;

    const reasons = [
      `Great companion for ${detected}`,
      envScore.compatibility >= 75 ? "Similar growing conditions" : "Good environmental match"
    ];

    return {
      compatibility: Math.round(score),
      reason: reasons.join(" • ")
    };
  }

  /**
   * Calculate environmental compatibility
   */
  private calculateEnvironmentalMatch(
    plant: PlantCareData,
    conditions: EnvironmentalConditions
  ): { compatibility: number; reason: string } {
    if (!plant.temperature_range || !plant.humidity_range) {
      return { compatibility: 70, reason: "Generally suitable" };
    }

    let score = 0;
    
    // Temperature (40%)
    const tempRange = plant.temperature_range;
    const tempDiff = Math.min(
      Math.abs(conditions.temperature - tempRange.min),
      Math.abs(conditions.temperature - tempRange.max)
    );
    const tempScore = Math.max(0, 100 - (tempDiff * 3));
    score += tempScore * 0.4;

    // Humidity (30%)
    const humidityRange = plant.humidity_range;
    const humidityDiff = Math.min(
      Math.abs(conditions.humidity - humidityRange.min),
      Math.abs(conditions.humidity - humidityRange.max)
    );
    const humidityScore = Math.max(0, 100 - (humidityDiff * 2));
    score += humidityScore * 0.3;

    // Light hours (30%)
    const lightHours = conditions.lightHours;
    const lightScore = plant.light_requirements?.includes('full') 
      ? (lightHours >= 6 ? 100 : lightHours * 15)
      : (lightHours >= 4 ? 100 : lightHours * 20);
    score += lightScore * 0.3;

    const compatibility = Math.round(score);
    const reason = compatibility >= 85 
      ? "Perfect environmental match" 
      : compatibility >= 75 
        ? "Good environmental conditions"
        : "Acceptable conditions";

    return { compatibility, reason };
  }

  private estimatePlantSize(plant: PlantCareData): 'small' | 'medium' | 'large' {
    const name = plant.plant_name.toLowerCase();
    if (name.includes('basil') || name.includes('herb') || name.includes('lettuce')) {
      return 'small';
    }
    if (name.includes('tomato') || name.includes('pepper') || name.includes('eggplant')) {
      return 'large';
    }
    return 'medium';
  }

  private checkSpaceSizeCompatibility(
    plantSize: 'small' | 'medium' | 'large',
    area: number
  ): boolean {
    return (plantSize === 'small' && area >= 0.3) ||
           (plantSize === 'medium' && area >= 0.5) ||
           (plantSize === 'large' && area >= 1.0);
  }

  private calculateSizeScore(
    plantSize: 'small' | 'medium' | 'large',
    area: number
  ): number {
    const minSizes = { small: 0.3, medium: 0.5, large: 1.0 };
    const idealSizes = { small: 0.5, medium: 1.0, large: 2.0 };
    
    const min = minSizes[plantSize];
    const ideal = idealSizes[plantSize];
    
    if (area < min) return 0;
    if (area >= ideal) return 1;
    return (area - min) / (ideal - min);
  }

  private checkLightCompatibility(
    plant: PlantCareData,
    lightAccess: SpaceAnalysis['lightAccess']
  ): boolean {
    const needs = plant.light_requirements?.toLowerCase() || '';
    
    if (lightAccess === 'direct') {
      return needs.includes('full') || needs.includes('direct');
    }
    if (lightAccess === 'indirect') {
      return needs.includes('partial') || needs.includes('indirect') || needs.includes('full');
    }
    if (lightAccess === 'artificial') {
      return needs.includes('artificial') || needs.includes('low');
    }
    if (lightAccess === 'low') {
      return needs.includes('low') || needs.includes('shade');
    }
    return true;
  }

  private calculateLightScore(
    plant: PlantCareData,
    lightAccess: SpaceAnalysis['lightAccess']
  ): number {
    const needs = plant.light_requirements?.toLowerCase() || '';
    
    if (lightAccess === 'direct') {
      return needs.includes('full') ? 1.0 : needs.includes('partial') ? 0.7 : 0.5;
    }
    if (lightAccess === 'indirect') {
      return needs.includes('partial') ? 1.0 : needs.includes('full') ? 0.8 : 0.6;
    }
    if (lightAccess === 'artificial') {
      return needs.includes('artificial') ? 1.0 : needs.includes('low') ? 0.8 : 0.6;
    }
    if (lightAccess === 'low') {
      return needs.includes('low') ? 1.0 : needs.includes('shade') ? 0.9 : 0.5;
    }
    return 0.6;
  }

  private checkSurfaceCompatibility(
    plant: PlantCareData,
    surfaceType: SpaceAnalysis['surfaceType']
  ): boolean {
    // Most plants can grow on most surfaces with proper containers
    if (surfaceType === 'wall') {
      return plant.plant_name.toLowerCase().includes('herb') || 
             plant.plant_name.toLowerCase().includes('basil');
    }
    return true;
  }

  private calculateSurfaceScore(
    plant: PlantCareData,
    surfaceType: SpaceAnalysis['surfaceType']
  ): number {
    const name = plant.plant_name.toLowerCase();
    
    if (surfaceType === 'wall') {
      return (name.includes('herb') || name.includes('basil')) ? 0.9 : 0.6;
    }
    if (surfaceType === 'balcony') {
      return 0.95; // Excellent for container gardening
    }
    if (surfaceType === 'table' || surfaceType === 'shelf') {
      return name.includes('herb') || name.includes('lettuce') ? 1.0 : 0.8;
    }
    return 0.9;
  }

  private haveSimilarNeeds(plant1: PlantCareData, plant2: PlantCareData): boolean {
    if (!plant1.temperature_range || !plant2.temperature_range) return false;
    
    const temp1 = plant1.temperature_range;
    const temp2 = plant2.temperature_range;
    
    const tempOverlap = !(temp1.max < temp2.min || temp2.max < temp1.min);
    
    return tempOverlap;
  }
}

export const aiRecommendationService = new AIRecommendationService();

