-- Reset all garden zones data to zero with valid status
UPDATE garden_zones SET 
  plants_count = 0,
  temperature = 0,
  humidity = 0,
  soil_moisture = 0,
  light_hours = 0,
  status = 'good';