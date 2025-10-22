-- Create table to link plants to zones with per-plant schedules and notifications
CREATE TABLE IF NOT EXISTS public.zone_plants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.garden_zones(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES public.plant_care_data(id) ON DELETE CASCADE,
  -- Per-plant schedule fields
  schedule_text TEXT,
  next_watering TIMESTAMP WITH TIME ZONE,
  harvest_date TIMESTAMP WITH TIME ZONE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT zone_plants_unique UNIQUE (user_id, zone_id, plant_id)
);

-- Enable RLS and policies
ALTER TABLE public.zone_plants ENABLE ROW LEVEL SECURITY;

-- Select
CREATE POLICY "Users can view their own zone plants"
ON public.zone_plants
FOR SELECT
USING (auth.uid() = user_id);

-- Insert
CREATE POLICY "Users can create their own zone plants"
ON public.zone_plants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update
CREATE POLICY "Users can update their own zone plants"
ON public.zone_plants
FOR UPDATE
USING (auth.uid() = user_id);

-- Delete
CREATE POLICY "Users can delete their own zone plants"
ON public.zone_plants
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_zone_plants_updated_at
  BEFORE UPDATE ON public.zone_plants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_zone_plants_user_id ON public.zone_plants(user_id);
CREATE INDEX IF NOT EXISTS idx_zone_plants_zone_id ON public.zone_plants(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_plants_next_watering ON public.zone_plants(next_watering);
