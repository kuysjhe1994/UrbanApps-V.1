-- Create soil_data table to store soil moisture readings
CREATE TABLE IF NOT EXISTS public.soil_data (
  id BIGSERIAL PRIMARY KEY,
  moisture INTEGER NOT NULL CHECK (moisture >= 0 AND moisture <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.soil_data ENABLE ROW LEVEL SECURITY;

-- Basic policy: allow read access to authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'soil_data' AND policyname = 'soil_data_select_authenticated'
  ) THEN
    CREATE POLICY soil_data_select_authenticated
    ON public.soil_data
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Optional: allow inserts from authenticated users/devices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'soil_data' AND policyname = 'soil_data_insert_authenticated'
  ) THEN
    CREATE POLICY soil_data_insert_authenticated
    ON public.soil_data
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- Enable realtime for soil_data
ALTER TABLE public.soil_data REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'soil_data'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.soil_data;
  END IF;
END $$;