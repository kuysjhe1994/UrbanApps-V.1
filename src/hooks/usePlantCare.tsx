import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PlantCareData {
  id: string;
  plant_name: string;
  scientific_name: string | null;
  care_difficulty: string | null;
  watering_frequency: string | null;
  light_requirements: string | null;
  temperature_range: any;
  humidity_range: any;
  soil_type: string | null;
  growth_rate: string | null;
  max_height: string | null;
  care_tips: string[] | null;
  common_issues: string[] | null;
  created_at: string;
  updated_at: string;
}

export const usePlantCare = () => {
  const [plants, setPlants] = useState<PlantCareData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlants = async () => {
    try {
      const { data, error } = await supabase
        .from('plant_care_data')
        .select('*')
        .order('plant_name');

      if (error) throw error;
      setPlants((data || []) as PlantCareData[]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching plant data",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlantByName = (plantName: string) => {
    return plants.find(plant => 
      plant.plant_name.toLowerCase().includes(plantName.toLowerCase())
    );
  };

  const getRecommendationsForConditions = (conditions: {
    temperature: number;
    humidity: number;
    soilMoisture: number;
    lightHours: number;
  }, availablePlants: PlantCareData[] = plants) => {
    return availablePlants.map(plant => {
      const tempRange = plant.temperature_range;
      const humidityRange = plant.humidity_range;
      
      if (!tempRange || !humidityRange) {
        return {
          name: plant.plant_name,
          compatibility: 0,
          reason: "Insufficient data for recommendation",
          careData: plant
        };
      }
      
      // Calculate compatibility score based on conditions
      let compatibility = 0;
      let reasons = [];
      
      // Temperature compatibility (40% weight)
      const tempDiff = Math.min(
        Math.abs(conditions.temperature - tempRange.min),
        Math.abs(conditions.temperature - tempRange.max)
      );
      const tempScore = Math.max(0, 100 - (tempDiff * 2));
      compatibility += tempScore * 0.4;
      
      if (tempScore >= 80) reasons.push("Perfect temperature range");
      else if (tempScore >= 60) reasons.push("Good temperature match");
      else if (tempScore >= 40) reasons.push("Acceptable temperature");
      
      // Humidity compatibility (30% weight)
      const humidityDiff = Math.min(
        Math.abs(conditions.humidity - humidityRange.min),
        Math.abs(conditions.humidity - humidityRange.max)
      );
      const humidityScore = Math.max(0, 100 - (humidityDiff * 1.5));
      compatibility += humidityScore * 0.3;
      
      if (humidityScore >= 80) reasons.push("Ideal humidity level");
      else if (humidityScore >= 60) reasons.push("Good humidity match");
      
      // Light compatibility (20% weight)
      const lightScore = conditions.lightHours >= 6 ? 100 : 
                        conditions.lightHours >= 4 ? 80 : 
                        conditions.lightHours >= 2 ? 60 : 40;
      compatibility += lightScore * 0.2;
      
      if (lightScore >= 80) reasons.push("Excellent light conditions");
      else if (lightScore >= 60) reasons.push("Good light availability");
      
      // Soil moisture compatibility (10% weight)
      const soilScore = conditions.soilMoisture >= 60 && conditions.soilMoisture <= 80 ? 100 :
                       conditions.soilMoisture >= 40 && conditions.soilMoisture <= 90 ? 80 : 60;
      compatibility += soilScore * 0.1;
      
      if (soilScore >= 80) reasons.push("Optimal soil moisture");
      
      // Difficulty bonus
      if (plant.care_difficulty?.toLowerCase() === 'easy' || plant.care_difficulty?.toLowerCase() === 'very easy') {
        compatibility += 5;
        reasons.push("Easy to care for");
      }
      
      // Growth rate bonus
      if (plant.growth_rate?.toLowerCase() === 'fast') {
        compatibility += 3;
        reasons.push("Fast growing");
      }
      
      const finalCompatibility = Math.min(100, Math.max(0, Math.round(compatibility)));
      
      return {
        name: plant.plant_name,
        compatibility: finalCompatibility,
        reason: reasons.length > 0 ? reasons.join(", ") : "Suitable for your conditions",
        careData: plant
      };
    }).filter(rec => rec.compatibility >= 60) // Only show plants with 60%+ compatibility
      .sort((a, b) => b.compatibility - a.compatibility); // Sort by compatibility score
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  return {
    plants,
    loading,
    getPlantByName,
    getRecommendationsForConditions,
    fetchPlants
  };
};