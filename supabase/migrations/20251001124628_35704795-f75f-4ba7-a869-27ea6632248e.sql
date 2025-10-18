-- First, drop the existing constraint
ALTER TABLE garden_zones DROP CONSTRAINT IF EXISTS garden_zones_status_check;

-- Update any existing data to use lowercase values before adding the constraint
UPDATE garden_zones 
SET status = LOWER(REPLACE(status, ' ', '_'))
WHERE status IS NOT NULL;

-- Set NULL values to 'good'
UPDATE garden_zones 
SET status = 'good'
WHERE status IS NULL OR status NOT IN ('good', 'needs_water', 'critical');

-- Now add the correct constraint
ALTER TABLE garden_zones ADD CONSTRAINT garden_zones_status_check 
CHECK (status IN ('good', 'needs_water', 'critical'));