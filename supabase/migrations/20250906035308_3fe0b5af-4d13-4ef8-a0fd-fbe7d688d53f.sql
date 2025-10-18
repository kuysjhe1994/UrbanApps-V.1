-- Create per-user hidden plants to persist deletions in Plant Library
CREATE TABLE IF NOT EXISTS public.user_hidden_plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plant_id uuid NOT NULL REFERENCES public.plant_care_data(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, plant_id)
);

-- Enable RLS
ALTER TABLE public.user_hidden_plants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own hidden plants"
ON public.user_hidden_plants
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hidden plants"
ON public.user_hidden_plants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hidden plants"
ON public.user_hidden_plants
FOR DELETE
USING (auth.uid() = user_id);
