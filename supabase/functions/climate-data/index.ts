import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openWeatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (!openWeatherApiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    // Fetch current weather data
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherApiKey}&units=metric`
    );

    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await weatherResponse.json();

    // Fetch UV index
    const uvResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${openWeatherApiKey}`
    );

    let uvIndex = 0;
    if (uvResponse.ok) {
      const uvData = await uvResponse.json();
      uvIndex = uvData.value || 0;
    }

    // Calculate light hours based on sunrise/sunset
    const sunrise = new Date(weatherData.sys.sunrise * 1000);
    const sunset = new Date(weatherData.sys.sunset * 1000);
    const lightHours = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60);

    const climateData = {
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      pressure: weatherData.main.pressure,
      lightHours: Math.round(lightHours * 10) / 10,
      uvIndex,
      windSpeed: weatherData.wind.speed,
      cloudiness: weatherData.clouds.all,
      weather: weatherData.weather[0].main,
      description: weatherData.weather[0].description,
      visibility: weatherData.visibility / 1000, // Convert to km
      location: {
        city: weatherData.name,
        country: weatherData.sys.country,
        coordinates: {
          latitude,
          longitude
        }
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(climateData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in climate-data function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});