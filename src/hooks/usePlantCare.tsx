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
    return availablePlants.filter(plant => {
      const tempRange = plant.temperature_range;
      const humidityRange = plant.humidity_range;
      
      if (!tempRange || !humidityRange) return false;
      
      const tempMatch = conditions.temperature >= tempRange.min && conditions.temperature <= tempRange.max;
      const humidityMatch = conditions.humidity >= humidityRange.min && conditions.humidity <= humidityRange.max;
      const lightMatch = conditions.lightHours >= 4; // Basic light requirement
      
      return tempMatch && humidityMatch && lightMatch;
    }).map(plant => ({
      name: plant.plant_name,
      compatibility: Math.floor(Math.random() * 20 + 80), // Simulate compatibility score
      reason: `Good ${plant.care_difficulty} care plant for these conditions`,
      careData: plant
    }));
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