-- Add watering schedule and harvest fields to garden_zones
ALTER TABLE public.garden_zones
  ADD COLUMN IF NOT EXISTS watering_schedule TEXT,
  ADD COLUMN IF NOT EXISTS next_watering TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS harvest_date TIMESTAMP WITH TIME ZONE;
