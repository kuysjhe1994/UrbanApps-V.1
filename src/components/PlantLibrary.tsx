import { useState, useEffect } from "react";
import { Search, Filter, Star, Thermometer, Droplets, Sun, Heart, Info, Plus, CheckCircle, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlantCare, PlantCareData } from "@/hooks/usePlantCare";
import { PlantDetailsModal } from "@/components/PlantDetailsModal";
import { supabase } from "@/integrations/supabase/client";

const PlantLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [favoritePlants, setFavoritePlants] = useState<string[]>([]);
  const [addedPlants, setAddedPlants] = useState<string[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<PlantCareData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletedPlants, setDeletedPlants] = useState<string[]>([]);
  
  const { plants, loading, getRecommendationsForConditions } = usePlantCare();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user's hidden plants from database
  useEffect(() => {
    const fetchHiddenPlants = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('user_hidden_plants')
          .select('plant_id')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setDeletedPlants(data?.map(item => item.plant_id) || []);
      } catch (error) {
        console.error('Error fetching hidden plants:', error);
      }
    };

    fetchHiddenPlants();
  }, [user?.id]);

  // Filter to only show the 5 specified plants
  const allowedPlants = ['tomato', 'basil', 'lettuce', 'eggplant', 'pepper'];
  const filteredAvailablePlants = plants.filter(plant => 
    allowedPlants.some(allowed => 
      plant.plant_name.toLowerCase().includes(allowed.toLowerCase())
    ) && !deletedPlants.includes(plant.id)
  );

  // Get recommendations based on current conditions
  const currentConditions = {
    temperature: 70,
    humidity: 47,
    soilMoisture: 65,
    lightHours: 6
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return "text-primary";
    if (score >= 80) return "text-accent";
    if (score >= 70) return "text-yellow-600";
    return "text-destructive";
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty?.toLowerCase()) {
      case "very easy": 
      case "easy": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "hard": 
      case "difficult": return "bg-red-500";
      default: return "bg-muted";
    }
  };

  const searchFilteredPlants = filteredAvailablePlants.filter(plant => 
    plant.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plant.scientific_name && plant.scientific_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const recommendations = getRecommendationsForConditions(currentConditions, filteredAvailablePlants);
  const combinedPlants = [...searchFilteredPlants, ...recommendations.map(rec => rec.careData)];
  const uniquePlants = combinedPlants.filter((plant, index, self) => 
    index === self.findIndex(p => p.id === plant.id) && !deletedPlants.includes(plant.id)
  );

  const toggleFavorite = (plantId: string) => {
    setFavoritePlants(prev => 
      prev.includes(plantId) 
        ? prev.filter(id => id !== plantId)
        : [...prev, plantId]
    );
    const plantName = plants.find(p => p.id === plantId)?.plant_name || "Plant";
    toast({
      title: favoritePlants.includes(plantId) ? "Removed from favorites" : "Added to favorites",
      description: `${plantName} ${favoritePlants.includes(plantId) ? 'removed from' : 'added to'} your favorites.`
    });
  };

  const addToGarden = async (plantId: string) => {
    if (addedPlants.includes(plantId)) return;
    
    try {
      const plantName = plants.find(p => p.id === plantId)?.plant_name || "Plant";
      
      // Add plant to the first available garden zone or create a new one
      const { data: zones, error: zonesError } = await supabase
        .from('garden_zones')
        .select('*')
        .eq('user_id', user?.id)
        .order('plants_count', { ascending: true })
        .limit(1);

      if (zonesError) throw zonesError;

      let targetZone = zones?.[0];
      
      if (!targetZone) {
        // Create a new zone if none exist
        const plant = plants.find(p => p.id === plantId);
        const zoneName = `${plant?.plant_name || 'Plant'} Zone`;
        
        const { error: createError } = await supabase
          .from('garden_zones')
          .insert({
            user_id: user?.id!,
            name: zoneName,
            plants_count: 1,
            temperature: 22,
            humidity: 50,
            soil_moisture: 65,
            light_hours: 6,
            status: 'good'
          });

        if (createError) throw createError;
        
        toast({
          title: "New Garden Zone Created!",
          description: `${zoneName} created with ${plantName} - check Monitor Screen`
        });
      } else {
        // Update existing zone
        const { error: updateError } = await supabase
          .from('garden_zones')
          .update({
            plants_count: (targetZone.plants_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetZone.id);

        if (updateError) throw updateError;
        
        toast({
          title: "Plant Added to Garden!",
          description: `${plantName} added to ${targetZone.name} - now has ${(targetZone.plants_count || 0) + 1} plants`
        });
      }

      setAddedPlants(prev => [...prev, plantId]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding plant",
        description: "Failed to add plant to garden zone. Please try again."
      });
    }
  };

  const deletePlant = async (plantId: string) => {
    if (!user?.id) return;
    
    try {
      // Add to user's hidden plants in database
      const { error } = await supabase
        .from('user_hidden_plants')
        .insert({ 
          user_id: user.id, 
          plant_id: plantId 
        });
      
      if (error) throw error;
      
      // Update local state
      setFavoritePlants(prev => prev.filter(id => id !== plantId));
      setAddedPlants(prev => prev.filter(id => id !== plantId));
      setDeletedPlants(prev => [...prev, plantId]);
      
      const plantName = plants.find(p => p.id === plantId)?.plant_name || "Plant";
      toast({
        title: "Plant removed",
        description: `${plantName} has been permanently removed from your library.`,
        variant: "destructive"
      });

      // Close modal if it's the deleted plant
      if (selectedPlant?.id === plantId) {
        setIsModalOpen(false);
        setSelectedPlant(null);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error removing plant",
        description: "Failed to remove plant. Please try again."
      });
    }
  };

  const showPlantDetails = (plant: PlantCareData) => {
    setSelectedPlant(plant);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero p-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading plant library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Plant Library</h1>
            <p className="text-muted-foreground">Discover plants perfect for your space</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ar" size="icon">
              <Filter className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon">
              <Heart className={`h-5 w-5 ${favoritePlants.length > 0 ? 'text-red-500 fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search plants by name, type, or care needs..."
            className="pl-10 bg-card/80 backdrop-blur-sm border-primary/20 focus:border-primary/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Current Conditions */}
        <Card className="bg-gradient-card backdrop-blur-sm shadow-soft border-primary/10">
          <CardContent className="p-4">
            <h3 className="font-medium text-card-foreground mb-3">Your Current Conditions</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Thermometer className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Temperature</p>
                <p className="text-sm font-medium">70°F</p>
              </div>
              <div>
                <Droplets className="h-4 w-4 text-accent mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="text-sm font-medium">47%</p>
              </div>
              <div>
                <Sun className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Available Light</p>
                <p className="text-sm font-medium">6 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plant Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recommended for You</h2>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {uniquePlants.length} plants
          </Badge>
        </div>

        <div className="grid gap-4">
          {uniquePlants.map((plant) => {
            const recommendation = recommendations.find(rec => rec.careData.id === plant.id);
            const compatibility = recommendation ? recommendation.compatibility : Math.floor(Math.random() * 20 + 75);
            
            return (
              <Card key={plant.id} className="bg-card/80 backdrop-blur-sm shadow-card border border-primary/5 hover:shadow-ar-glow transition-smooth group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Plant Icon */}
                    <div className="text-3xl group-hover:scale-110 transition-smooth">🌱</div>
                    
                    {/* Plant Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-card-foreground">{plant.plant_name}</h3>
                          {plant.scientific_name && (
                            <p className="text-xs text-muted-foreground italic">{plant.scientific_name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleFavorite(plant.id)}
                          >
                            <Heart 
                              className={`h-4 w-4 transition-smooth ${
                                favoritePlants.includes(plant.id) 
                                  ? 'text-red-500 fill-current' 
                                  : 'text-muted-foreground hover:text-red-400'
                              }`} 
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => deletePlant(plant.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Star className={`h-4 w-4 ${getCompatibilityColor(compatibility)}`} />
                              <span className={`font-bold ${getCompatibilityColor(compatibility)}`}>
                                {compatibility}%
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">match</p>
                          </div>
                        </div>
                      </div>

                      {/* Care Requirements */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">
                            {plant.temperature_range ? 
                              `${plant.temperature_range.min}-${plant.temperature_range.max}°F` : 
                              'N/A'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Droplets className="h-3 w-3 text-accent" />
                          <span className="text-muted-foreground">
                            {plant.watering_frequency || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Sun className="h-3 w-3 text-yellow-500" />
                          <span className="text-muted-foreground">
                            {plant.light_requirements || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Difficulty Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {plant.care_difficulty && (
                          <Badge 
                            className={`text-xs ${getDifficultyColor(plant.care_difficulty)} text-white`}
                          >
                            {plant.care_difficulty}
                          </Badge>
                        )}
                        {plant.soil_type && (
                          <Badge variant="secondary" className="text-xs">
                            {plant.soil_type}
                          </Badge>
                        )}
                        {plant.growth_rate && (
                          <Badge variant="secondary" className="text-xs">
                            {plant.growth_rate}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 pt-3 border-t border-border/50 flex gap-2">
                    <Button 
                      className={`flex-1 transition-smooth ${
                        addedPlants.includes(plant.id)
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gradient-primary hover:shadow-ar-glow'
                      }`}
                      size="sm"
                      onClick={() => addToGarden(plant.id)}
                      disabled={addedPlants.includes(plant.id)}
                    >
                      {addedPlants.includes(plant.id) ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Added to Garden
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add to Garden
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-primary/30 hover:bg-primary/10"
                      onClick={() => showPlantDetails(plant)}
                    >
                      <Info className="mr-2 h-4 w-4" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Plant Details Modal */}
      <PlantDetailsModal
        plant={selectedPlant}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDelete={deletePlant}
        showDeleteButton={true}
      />
    </div>
  );
};

export default PlantLibrary;