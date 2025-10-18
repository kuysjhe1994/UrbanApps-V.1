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

// Built-in fallback dataset so the app can always show recommendations
// when the database is empty or unreachable.
const DEFAULT_PLANTS: PlantCareData[] = [
  {
    id: 'plant_tomato',
    plant_name: 'Tomato',
    scientific_name: 'Solanum lycopersicum',
    care_difficulty: 'easy',
    watering_frequency: 'Moderate',
    light_requirements: 'Full sun',
    temperature_range: { min: 18, max: 30 }, // °C
    humidity_range: { min: 40, max: 70 }, // %
    soil_type: 'Well-draining, fertile',
    growth_rate: 'fast',
    max_height: '1–2 m',
    care_tips: ['Provide staking', 'Consistent watering', 'Full sun exposure'],
    common_issues: ['Blossom end rot', 'Aphids'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plant_basil',
    plant_name: 'Basil',
    scientific_name: 'Ocimum basilicum',
    care_difficulty: 'very easy',
    watering_frequency: 'Regular, keep evenly moist',
    light_requirements: 'Full sun to partial shade',
    temperature_range: { min: 18, max: 32 },
    humidity_range: { min: 40, max: 70 },
    soil_type: 'Rich, well-drained',
    growth_rate: 'fast',
    max_height: '30–60 cm',
    care_tips: ['Pinch flowers to promote leaves', 'Warm temperatures preferred'],
    common_issues: ['Downy mildew', 'Leaf scorch'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plant_lettuce',
    plant_name: 'Lettuce',
    scientific_name: 'Lactuca sativa',
    care_difficulty: 'easy',
    watering_frequency: 'Frequent, shallow watering',
    light_requirements: 'Full sun to partial shade',
    temperature_range: { min: 10, max: 24 },
    humidity_range: { min: 40, max: 70 },
    soil_type: 'Loose, fertile',
    growth_rate: 'fast',
    max_height: '20–30 cm',
    care_tips: ['Prefers cooler temps', 'Keep soil consistently moist'],
    common_issues: ['Bolting in heat', 'Slugs'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plant_eggplant',
    plant_name: 'Eggplant',
    scientific_name: 'Solanum melongena',
    care_difficulty: 'medium',
    watering_frequency: 'Moderate, steady moisture',
    light_requirements: 'Full sun',
    temperature_range: { min: 20, max: 32 },
    humidity_range: { min: 40, max: 70 },
    soil_type: 'Rich, well-drained',
    growth_rate: 'medium',
    max_height: '0.6–1 m',
    care_tips: ['Warm soil needed', 'Mulch to retain moisture'],
    common_issues: ['Flea beetles', 'Spider mites'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plant_pepper',
    plant_name: 'Pepper',
    scientific_name: 'Capsicum annuum',
    care_difficulty: 'medium',
    watering_frequency: 'Moderate, avoid waterlogging',
    light_requirements: 'Full sun',
    temperature_range: { min: 18, max: 32 },
    humidity_range: { min: 40, max: 70 },
    soil_type: 'Well-draining, fertile',
    growth_rate: 'medium',
    max_height: '0.5–1 m',
    care_tips: ['Warm conditions', 'Consistent moisture'],
    common_issues: ['Blossom drop', 'Aphids'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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

      // If the database is empty, fall back to the built-in defaults
      const fetched = (data || []) as PlantCareData[];
      if (!fetched || fetched.length === 0) {
        setPlants(DEFAULT_PLANTS);
      } else {
        setPlants(fetched);
      }
    } catch (error: any) {
      // On error, still provide defaults so UI can render recommendations
      setPlants(DEFAULT_PLANTS);
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
    // Choose plants source with robust fallback
    const source: PlantCareData[] = (availablePlants && availablePlants.length > 0)
      ? availablePlants
      : (plants && plants.length > 0)
        ? plants
        : DEFAULT_PLANTS;

    return source.map(plant => {
      const tempRange = plant.temperature_range;
      const humidityRange = plant.humidity_range;
      
      // If ranges are missing, provide a sensible default recommendation
      if (!tempRange || !humidityRange) {
        return {
          name: plant.plant_name,
          compatibility: 70,
          reason: "Generally suitable for typical urban conditions",
          careData: plant
        };
      }
      
      // Calculate compatibility score based on conditions
      let compatibility = 0;
      const reasons: string[] = [];
      
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