-- Update existing plants with comprehensive care data (using lowercase values)
UPDATE plant_care_data 
SET 
  scientific_name = 'Solanum lycopersicum',
  care_difficulty = 'medium',
  watering_frequency = 'Every 2-3 days',
  light_requirements = 'Full sun (6-8 hours)',
  temperature_range = '{"min": 65, "max": 85}',
  humidity_range = '{"min": 40, "max": 70}',
  soil_type = 'Well-draining potting mix',
  growth_rate = 'Fast',
  max_height = '3-6 feet',
  care_tips = ARRAY[
    'Provide support with stakes or cages',
    'Water consistently to prevent blossom end rot',
    'Remove lower leaves that touch soil',
    'Feed regularly with balanced fertilizer'
  ],
  common_issues = ARRAY[
    'Blossom end rot from inconsistent watering',
    'Hornworms can damage leaves',
    'Fungal diseases in humid conditions'
  ]
WHERE plant_name ILIKE '%tomato%';

-- Insert or update Basil (using lowercase care_difficulty)
INSERT INTO plant_care_data (
  plant_name, scientific_name, care_difficulty, watering_frequency, 
  light_requirements, temperature_range, humidity_range, soil_type,
  growth_rate, max_height, care_tips, common_issues
) VALUES (
  'Basil', 'Ocimum basilicum', 'easy', 'Every 1-2 days',
  'Full sun (6+ hours)', '{"min": 70, "max": 85}', '{"min": 45, "max": 65}',
  'Well-draining potting soil', 'Fast', '12-18 inches',
  ARRAY[
    'Pinch flowers to keep leaves tender',
    'Harvest regularly to encourage growth',
    'Keep soil consistently moist but not soggy',
    'Protect from cold temperatures'
  ],
  ARRAY[
    'Fusarium wilt in overwatered conditions',
    'Aphids on new growth',
    'Cold damage below 50°F'
  ]
) ON CONFLICT (plant_name) DO UPDATE SET
  scientific_name = EXCLUDED.scientific_name,
  care_difficulty = EXCLUDED.care_difficulty,
  watering_frequency = EXCLUDED.watering_frequency,
  light_requirements = EXCLUDED.light_requirements,
  temperature_range = EXCLUDED.temperature_range,
  humidity_range = EXCLUDED.humidity_range,
  soil_type = EXCLUDED.soil_type,
  growth_rate = EXCLUDED.growth_rate,
  max_height = EXCLUDED.max_height,
  care_tips = EXCLUDED.care_tips,
  common_issues = EXCLUDED.common_issues;

-- Update Lettuce
UPDATE plant_care_data 
SET 
  scientific_name = 'Lactuca sativa',
  care_difficulty = 'easy',
  watering_frequency = 'Every 1-2 days',
  light_requirements = 'Partial sun (4-6 hours)',
  temperature_range = '{"min": 45, "max": 75}',
  humidity_range = '{"min": 50, "max": 70}',
  soil_type = 'Rich, well-draining soil',
  growth_rate = 'Fast',
  max_height = '6-12 inches',
  care_tips = ARRAY[
    'Harvest outer leaves first',
    'Keep soil consistently moist',
    'Grow in cooler weather for best flavor',
    'Succession plant every 2 weeks'
  ],
  common_issues = ARRAY[
    'Bolting in hot weather',
    'Aphids on leaves',
    'Slugs in wet conditions'
  ]
WHERE plant_name ILIKE '%lettuce%';

-- Update Pepper
UPDATE plant_care_data 
SET 
  scientific_name = 'Capsicum annuum',
  care_difficulty = 'medium',
  watering_frequency = 'Every 2-3 days',
  light_requirements = 'Full sun (6-8 hours)',
  temperature_range = '{"min": 70, "max": 85}',
  humidity_range = '{"min": 40, "max": 60}',
  soil_type = 'Well-draining, fertile soil',
  growth_rate = 'Medium',
  max_height = '1-3 feet',
  care_tips = ARRAY[
    'Support heavy fruiting plants',
    'Pick peppers regularly to encourage production',
    'Avoid overhead watering',
    'Feed with low-nitrogen fertilizer when flowering'
  ],
  common_issues = ARRAY[
    'Sunscald on fruits in intense heat',
    'Blossom end rot from calcium deficiency',
    'Aphids and spider mites'
  ]
WHERE plant_name ILIKE '%pepper%';

-- Insert Eggplant
INSERT INTO plant_care_data (
  plant_name, scientific_name, care_difficulty, watering_frequency, 
  light_requirements, temperature_range, humidity_range, soil_type,
  growth_rate, max_height, care_tips, common_issues
) VALUES (
  'Eggplant', 'Solanum melongena', 'medium', 'Every 2-3 days',
  'Full sun (6-8 hours)', '{"min": 70, "max": 85}', '{"min": 50, "max": 65}',
  'Rich, well-draining soil', 'Medium', '2-4 feet',
  ARRAY[
    'Harvest when skin is glossy',
    'Support heavy plants with stakes',
    'Remove suckers for better fruit production',
    'Protect from flea beetles when young'
  ],
  ARRAY[
    'Flea beetles on young plants',
    'Verticillium wilt in cool, wet conditions',
    'Spider mites in hot, dry weather'
  ]
) ON CONFLICT (plant_name) DO UPDATE SET
  scientific_name = EXCLUDED.scientific_name,
  care_difficulty = EXCLUDED.care_difficulty,
  watering_frequency = EXCLUDED.watering_frequency,
  light_requirements = EXCLUDED.light_requirements,
  temperature_range = EXCLUDED.temperature_range,
  humidity_range = EXCLUDED.humidity_range,
  soil_type = EXCLUDED.soil_type,
  growth_rate = EXCLUDED.growth_rate,
  max_height = EXCLUDED.max_height,
  care_tips = EXCLUDED.care_tips,
  common_issues = EXCLUDED.common_issues;

-- Insert Tomato if it doesn't exist
INSERT INTO plant_care_data (
  plant_name, scientific_name, care_difficulty, watering_frequency, 
  light_requirements, temperature_range, humidity_range, soil_type,
  growth_rate, max_height, care_tips, common_issues
) VALUES (
  'Tomato', 'Solanum lycopersicum', 'medium', 'Every 2-3 days',
  'Full sun (6-8 hours)', '{"min": 65, "max": 85}', '{"min": 40, "max": 70}',
  'Well-draining potting mix', 'Fast', '3-6 feet',
  ARRAY[
    'Provide support with stakes or cages',
    'Water consistently to prevent blossom end rot',
    'Remove lower leaves that touch soil',
    'Feed regularly with balanced fertilizer'
  ],
  ARRAY[
    'Blossom end rot from inconsistent watering',
    'Hornworms can damage leaves',
    'Fungal diseases in humid conditions'
  ]
) ON CONFLICT (plant_name) DO UPDATE SET
  scientific_name = EXCLUDED.scientific_name,
  care_difficulty = EXCLUDED.care_difficulty,
  watering_frequency = EXCLUDED.watering_frequency,
  light_requirements = EXCLUDED.light_requirements,
  temperature_range = EXCLUDED.temperature_range,
  humidity_range = EXCLUDED.humidity_range,
  soil_type = EXCLUDED.soil_type,
  growth_rate = EXCLUDED.growth_rate,
  max_height = EXCLUDED.max_height,
  care_tips = EXCLUDED.care_tips,
  common_issues = EXCLUDED.common_issues;