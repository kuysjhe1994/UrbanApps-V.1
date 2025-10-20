-- Create dht_data table to store DHT11 readings (temperature and humidity)
CREATE TABLE IF NOT EXISTS public.dht_data (
  id BIGSERIAL PRIMARY KEY,
  temperature NUMERIC NOT NULL,
  humidity NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.dht_data ENABLE ROW LEVEL SECURITY;

-- Basic policy: allow read access to authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dht_data' AND policyname = 'dht_data_select_authenticated'
  ) THEN
    CREATE POLICY dht_data_select_authenticated
    ON public.dht_data
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Optional: allow inserts from authenticated users/devices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dht_data' AND policyname = 'dht_data_insert_authenticated'
  ) THEN
    CREATE POLICY dht_data_insert_authenticated
    ON public.dht_data
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- Enable realtime for dht_data
ALTER TABLE public.dht_data REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'dht_data'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dht_data;
  END IF;
END $$;
