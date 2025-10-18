-- Create table for AR scan results
CREATE TABLE public.ar_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT,
  detected_plant_name TEXT,
  confidence_score NUMERIC(3,2),
  environmental_data JSONB,
  recommendations TEXT[],
  location_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ar_scans ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own AR scans" 
ON public.ar_scans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AR scans" 
ON public.ar_scans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AR scans" 
ON public.ar_scans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AR scans" 
ON public.ar_scans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ar_scans_updated_at
BEFORE UPDATE ON public.ar_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for plant care recommendations
CREATE TABLE public.plant_care_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_name TEXT NOT NULL UNIQUE,
  scientific_name TEXT,
  care_difficulty TEXT CHECK (care_difficulty IN ('easy', 'medium', 'hard')),
  watering_frequency TEXT,
  light_requirements TEXT,
  temperature_range JSONB,
  humidity_range JSONB,
  soil_type TEXT,
  growth_rate TEXT,
  max_height TEXT,
  care_tips TEXT[],
  common_issues TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for plant care data (public read access)
ALTER TABLE public.plant_care_data ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read plant care data
CREATE POLICY "Anyone can view plant care data" 
ON public.plant_care_data 
FOR SELECT 
USING (true);

-- Only authenticated users can modify plant care data
CREATE POLICY "Authenticated users can modify plant care data" 
ON public.plant_care_data 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_plant_care_data_updated_at
BEFORE UPDATE ON public.plant_care_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial plant care data
INSERT INTO public.plant_care_data (plant_name, scientific_name, care_difficulty, watering_frequency, light_requirements, temperature_range, humidity_range, soil_type, growth_rate, max_height, care_tips, common_issues) VALUES
('Peace Lily', 'Spathiphyllum wallisii', 'easy', 'Weekly when top inch of soil is dry', 'Low to medium indirect light', '{"min": 18, "max": 27}', '{"min": 40, "max": 60}', 'Well-draining potting mix', 'Medium', '60-90cm', '{"Keep soil consistently moist but not waterlogged", "Mist leaves regularly", "Remove dead flowers"}', '{"Brown leaf tips from low humidity", "Yellow leaves from overwatering", "Lack of flowers from insufficient light"}'),
('Snake Plant', 'Sansevieria trifasciata', 'easy', 'Every 2-3 weeks, allow soil to dry completely', 'Low to bright indirect light', '{"min": 15, "max": 29}', '{"min": 30, "max": 50}', 'Well-draining cactus mix', 'Slow', '60-120cm', '{"Water less in winter", "Avoid overwatering", "Wipe leaves with damp cloth"}', '{"Root rot from overwatering", "Brown spots from fungal infections", "Pale color from too much direct sun"}'),
('Fiddle Leaf Fig', 'Ficus lyrata', 'hard', 'Weekly when top 2 inches of soil are dry', 'Bright indirect light', '{"min": 18, "max": 24}', '{"min": 40, "max": 60}', 'Well-draining potting mix with perlite', 'Medium', '180-300cm', '{"Rotate weekly for even growth", "Clean leaves monthly", "Avoid moving frequently"}', '{"Brown spots from overwatering", "Dropping leaves from stress", "Pest infestations"}'),
('Pothos', 'Epipremnum aureum', 'easy', 'When top inch of soil is dry', 'Low to medium indirect light', '{"min": 18, "max": 27}', '{"min": 40, "max": 60}', 'Regular potting mix', 'Fast', '180-360cm (trailing)', '{"Trim regularly to maintain shape", "Propagate in water", "Can grow in water permanently"}', '{"Yellow leaves from overwatering", "Brown tips from low humidity", "Leggy growth from insufficient light"}'),
('Monstera Deliciosa', 'Monstera deliciosa', 'medium', 'Weekly when top inch of soil is dry', 'Bright indirect light', '{"min": 18, "max": 27}', '{"min": 50, "max": 70}', 'Well-draining potting mix', 'Fast', '180-300cm', '{"Provide moss pole for climbing", "Mist aerial roots", "Clean large leaves regularly"}', '{"No fenestrations from insufficient light", "Yellow leaves from overwatering", "Pest infestations on large leaves"}')