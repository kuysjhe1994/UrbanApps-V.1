import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ARScan {
  id: string;
  user_id: string;
  image_url: string | null;
  detected_plant_name: string | null;
  confidence_score: number | null;
  environmental_data: any;
  recommendations: string[] | null;
  location_data: any;
  created_at: string;
  updated_at: string;
}

export const useARScans = () => {
  const [scans, setScans] = useState<ARScan[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchScans = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ar_scans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScans((data || []) as ARScan[]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching scans",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const saveScan = async (scanData: {
    image_url?: string;
    detected_plant_name?: string;
    confidence_score?: number;
    environmental_data: {
      temperature: number;
      humidity: number;
      soilMoisture: number;
      lightHours: number;
      [key: string]: any; // Allow additional properties like weather, location
    };
    recommendations?: string[];
    location_data?: any;
  }, retryCount = 0) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('ar_scans')
        .insert({
          user_id: user.id,
          ...scanData
        })
        .select()
        .single();

      if (error) throw error;
      
      setScans(prev => [data as ARScan, ...prev]);
      
      toast({
        title: "Scan saved!",
        description: "Your AR scan data has been saved successfully."
      });

      return data;
    } catch (error: any) {
      // Retry logic for network errors
      if (retryCount < 3 && (error.message.includes('network') || error.message.includes('timeout'))) {
        console.log(`Retrying scan save (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return saveScan(scanData, retryCount + 1);
      }
      
      toast({
        variant: "destructive",
        title: "Error saving scan",
        description: error.message
      });
      return null;
    }
  };

  const deleteScan = async (scanId: string) => {
    try {
      const { error } = await supabase
        .from('ar_scans')
        .delete()
        .eq('id', scanId);

      if (error) throw error;
      
      setScans(prev => prev.filter(scan => scan.id !== scanId));
      
      toast({
        title: "Scan deleted",
        description: "The scan has been removed."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting scan",
        description: error.message
      });
    }
  };

  useEffect(() => {
    fetchScans();
    
    if (user) {
      // Set up real-time subscription for AR scans
      const channel = supabase
        .channel('ar-scans-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ar_scans',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setScans(prev => [payload.new as ARScan, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setScans(prev => prev.map(scan => 
                scan.id === payload.new.id ? payload.new as ARScan : scan
              ));
            } else if (payload.eventType === 'DELETE') {
              setScans(prev => prev.filter(scan => scan.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const getRecentScans = (limit = 5) => {
    return scans.slice(0, limit);
  };

  const getScansByPlant = (plantName: string) => {
    return scans.filter(scan => 
      scan.detected_plant_name?.toLowerCase().includes(plantName.toLowerCase())
    );
  };

  return {
    scans,
    loading,
    saveScan,
    deleteScan,
    fetchScans,
    getRecentScans,
    getScansByPlant
  };
};