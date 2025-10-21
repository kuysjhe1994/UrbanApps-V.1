import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface GardenZone {
  id: string;
  user_id: string;
  name: string;
  plants_count: number;
  temperature: number;
  humidity: number;
  soil_moisture: number;
  light_hours: number;
  status: string;
  last_watered: string;
  watering_schedule?: string | null;
  next_watering?: string | null;
  harvest_date?: string | null;
  created_at: string;
  updated_at: string;
}

export const useGardenZones = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [zones, setZones] = useState<GardenZone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchZones = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('garden_zones')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error('Error fetching garden zones:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch garden zones"
      });
    } finally {
      setLoading(false);
    }
  };

  const createZone = async (zoneData: Partial<GardenZone> & { name: string }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('garden_zones')
        .insert({
          user_id: user.id,
          name: zoneData.name,
          plants_count: zoneData.plants_count || 0,
          temperature: zoneData.temperature || 22,
          humidity: zoneData.humidity || 50,
          soil_moisture: zoneData.soil_moisture || 65,
          light_hours: zoneData.light_hours || 6,
          status: zoneData.status || 'good',
          watering_schedule: zoneData.watering_schedule || null,
          next_watering: zoneData.next_watering || null,
          harvest_date: zoneData.harvest_date || null
        })
        .select()
        .single();

      if (error) throw error;

      setZones(prev => [data, ...prev]);
      
      toast({
        title: "Garden Zone Created",
        description: `${data.name} has been added to your garden`
      });

      return data;
    } catch (error) {
      console.error('Error creating garden zone:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create garden zone"
      });
      return null;
    }
  };

  const updateZone = async (zoneId: string, updates: Partial<GardenZone>) => {
    try {
      const { error } = await supabase
        .from('garden_zones')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', zoneId);

      if (error) throw error;

      setZones(prev => prev.map(zone => 
        zone.id === zoneId ? { ...zone, ...updates } : zone
      ));

      return true;
    } catch (error) {
      console.error('Error updating garden zone:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update garden zone"
      });
      return false;
    }
  };

  const deleteZone = async (zoneId: string) => {
    try {
      const { error } = await supabase
        .from('garden_zones')
        .delete()
        .eq('id', zoneId);

      if (error) throw error;

      setZones(prev => prev.filter(zone => zone.id !== zoneId));
      
      toast({
        title: "Garden Zone Deleted",
        description: "Zone has been removed from your garden"
      });

      return true;
    } catch (error) {
      console.error('Error deleting garden zone:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete garden zone"
      });
      return false;
    }
  };

  const waterZone = async (zoneId: string) => {
    return await updateZone(zoneId, {
      soil_moisture: 85,
      last_watered: new Date().toISOString(),
      status: 'good'
    });
  };

  useEffect(() => {
    fetchZones();

    // Set up real-time subscription for garden zones
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
        () => {
          fetchZones();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    zones,
    loading,
    fetchZones,
    createZone,
    updateZone,
    deleteZone,
    waterZone
  };
};