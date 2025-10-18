-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  preferred_plants TEXT[],
  garden_zones INTEGER DEFAULT 0,
  total_plants INTEGER DEFAULT 0,
  experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create garden_zones table for real-time data
CREATE TABLE public.garden_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plants_count INTEGER DEFAULT 0,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  soil_moisture DECIMAL(5,2),
  light_hours DECIMAL(4,2),
  status TEXT DEFAULT 'good' CHECK (status IN ('healthy', 'warning', 'good', 'critical')),
  last_watered TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on garden_zones
ALTER TABLE public.garden_zones ENABLE ROW LEVEL SECURITY;

-- Create policies for garden_zones
CREATE POLICY "Users can view their own garden zones"
ON public.garden_zones
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own garden zones"
ON public.garden_zones
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own garden zones"
ON public.garden_zones
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own garden zones"
ON public.garden_zones
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for garden_zones timestamps
CREATE TRIGGER update_garden_zones_updated_at
  BEFORE UPDATE ON public.garden_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for garden_zones
ALTER TABLE public.garden_zones REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.garden_zones;