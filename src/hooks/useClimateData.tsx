import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClimateData {
  temperature: number;
  humidity: number;
  pressure: number;
  lightHours: number;
  uvIndex: number;
  windSpeed: number;
  cloudiness: number;
  weather: string;
  description: string;
  visibility: number;
  location: {
    city: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  timestamp: string;
}

export const useClimateData = () => {
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getCurrentPosition = async (): Promise<{ latitude: number; longitude: number }> => {
    if (Capacitor.isNativePlatform()) {
      const coordinates = await Geolocation.getCurrentPosition();
      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude
      };
    } else {
      // Web fallback
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => reject(new Error(`Geolocation error: ${error.message}`)),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
        );
      });
    }
  };

  const fetchClimateData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current position
      const position = await getCurrentPosition();

      // Call our Supabase edge function
      const { data, error: functionError } = await supabase.functions.invoke('climate-data', {
        body: {
          latitude: position.latitude,
          longitude: position.longitude
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      setClimateData(data);
      
      toast({
        title: "Climate data updated",
        description: `Updated for ${data.location.city}, ${data.location.country}`
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch climate data';
      setError(errorMessage);
      
      // Fallback to simulated data if API fails
      const fallbackData: ClimateData = {
        temperature: 22 + (Math.random() - 0.5) * 10,
        humidity: 45 + (Math.random() - 0.5) * 20,
        pressure: 1013 + (Math.random() - 0.5) * 20,
        lightHours: 8 + (Math.random() - 0.5) * 4,
        uvIndex: Math.random() * 10,
        windSpeed: Math.random() * 15,
        cloudiness: Math.random() * 100,
        weather: 'Clear',
        description: 'Simulated data',
        visibility: 10,
        location: {
          city: 'Unknown',
          country: 'Unknown',
          coordinates: { latitude: 0, longitude: 0 }
        },
        timestamp: new Date().toISOString()
      };
      
      setClimateData(fallbackData);
      
      toast({
        variant: "destructive",
        title: "Using simulated data",
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClimateData();
  }, []);

  return {
    climateData,
    loading,
    error,
    fetchClimateData
  };
};