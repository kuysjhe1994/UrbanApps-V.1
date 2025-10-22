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
  const [showZoneSelector, setShowZoneSelector] = useState(false);
  const [selectedPlantForZone, setSelectedPlantForZone] = useState<string | null>(null);
  const [availableZones, setAvailableZones] = useState<any[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [showRecommendationsOnly, setShowRecommendationsOnly] = useState(false);
  
  const { plants, loading, getRecommendationsForConditions } = usePlantCare();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user's hidden plants and garden zones from database
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

    const fetchGardenZones = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('garden_zones')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setAvailableZones(data || []);
      } catch (error) {
        console.error('Error fetching garden zones:', error);
      }
    };

    fetchHiddenPlants();
    fetchGardenZones();
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
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-primary";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-500";
    return "text-destructive";
  };

  const getCompatibilityBgColor = (score: number) => {
    if (score >= 90) return "bg-green-100 border-green-200";
    if (score >= 80) return "bg-primary/10 border-primary/20";
    if (score >= 70) return "bg-yellow-100 border-yellow-200";
    if (score >= 60) return "bg-orange-100 border-orange-200";
    return "bg-red-100 border-red-200";
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

  // Use allowed plants for recommendations when there are enough; otherwise fall back
  // to the full library so we can always surface 4–5 suggestions
  const recommendationSource = filteredAvailablePlants.length >= 4 ? filteredAvailablePlants : plants;
  const recommendations = getRecommendationsForConditions(currentConditions, recommendationSource);
  
  // Apply difficulty filter
  const filteredRecommendations = recommendations.filter(rec => 
    difficultyFilter === 'all' || 
    rec.careData.care_difficulty?.toLowerCase() === difficultyFilter.toLowerCase()
  );
  
  const filteredSearchPlants = searchFilteredPlants.filter(plant =>
    difficultyFilter === 'all' || 
    plant.care_difficulty?.toLowerCase() === difficultyFilter.toLowerCase()
  );

  const combinedPlants = [...filteredSearchPlants, ...filteredRecommendations.map(rec => rec.careData)];
  const uniquePlants = combinedPlants.filter((plant, index, self) => 
    index === self.findIndex(p => p.id === plant.id) && !deletedPlants.includes(plant.id)
  );

  // Filter to show only recommendations if enabled
  const displayPlants = showRecommendationsOnly 
    ? uniquePlants.filter(plant => recommendations.some(rec => rec.careData.id === plant.id))
    : uniquePlants;

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

  const addToGarden = async (plantId: string, zoneId?: string) => {
    if (addedPlants.includes(plantId)) return;
    
    try {
      const plantName = plants.find(p => p.id === plantId)?.plant_name || "Plant";
      
      if (zoneId) {
        // Add to specific zone
        const targetZone = availableZones.find(z => z.id === zoneId);
        if (!targetZone) throw new Error("Zone not found");
        
        const { error: updateError } = await supabase
          .from('garden_zones')
          .update({
            plants_count: (targetZone.plants_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', zoneId);

        if (updateError) throw updateError;

        // Link plant to this zone with per-plant schedule row
        const { error: linkError } = await supabase
          .from('zone_plants')
          .insert({
            user_id: user?.id!,
            zone_id: zoneId,
            plant_id: plantId,
            notifications_enabled: true,
          });
        if (linkError && !String(linkError.message || '').toLowerCase().includes('duplicate')) {
          console.warn('Failed to link plant to zone:', linkError);
        }
        
        toast({
          title: "Plant Added to Garden!",
          description: `${plantName} added to ${targetZone.name} - now has ${(targetZone.plants_count || 0) + 1} plants`
        });
      } else {
        // Auto-add to first available zone or create new one
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
          
          const { data: createdZone, error: createError } = await supabase
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
            })
            .select()
            .single();

          if (createError) throw createError;
          targetZone = createdZone as any;
          
          toast({
            title: "New Garden Zone Created!",
            description: `${zoneName} created with ${plantName} - check Monitor Screen`
          });

          // Link plant to newly created zone
          if (targetZone?.id) {
            const { error: linkError } = await supabase
              .from('zone_plants')
              .insert({
                user_id: user?.id!,
                zone_id: targetZone.id,
                plant_id: plantId,
                notifications_enabled: true,
              });
            if (linkError && !String(linkError.message || '').toLowerCase().includes('duplicate')) {
              console.warn('Failed to link plant to new zone:', linkError);
            }
          }
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
          
          // Link plant to selected zone
          const { error: linkError } = await supabase
            .from('zone_plants')
            .insert({
              user_id: user?.id!,
              zone_id: targetZone.id,
              plant_id: plantId,
              notifications_enabled: true,
            });
          if (linkError && !String(linkError.message || '').toLowerCase().includes('duplicate')) {
            console.warn('Failed to link plant to zone:', linkError);
          }

          toast({
            title: "Plant Added to Garden!",
            description: `${plantName} added to ${targetZone.name} - now has ${(targetZone.plants_count || 0) + 1} plants`
          });
        }
      }

      setAddedPlants(prev => [...prev, plantId]);
      setShowZoneSelector(false);
      setSelectedPlantForZone(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding plant",
        description: "Failed to add plant to garden zone. Please try again."
      });
    }
  };

  const handleAddToGarden = (plantId: string) => {
    if (availableZones.length === 0) {
      // Auto-add if no zones exist
      addToGarden(plantId);
    } else if (availableZones.length === 1) {
      // Auto-add to single zone
      addToGarden(plantId, availableZones[0].id);
    } else {
      // Show zone selector for multiple zones
      setSelectedPlantForZone(plantId);
      setShowZoneSelector(true);
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
      <div className="min-h-screen bg-gradient-hero p-4 space-y-6">
        <div className="h-10 w-40 bg-muted rounded-md animate-pulse" />
        <div className="h-10 bg-muted/70 rounded-md animate-pulse" />
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted/70 rounded-lg animate-pulse" />
          ))}
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
            <Button 
              variant={showRecommendationsOnly ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowRecommendationsOnly(!showRecommendationsOnly)}
            >
              <Star className="h-4 w-4 mr-1" />
              Recommendations
            </Button>
            <Button variant="ar" size="icon">
              <Filter className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon">
              <Heart className={`h-5 w-5 ${favoritePlants.length > 0 ? 'text-red-500 fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative" role="search">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search plants by name, type, or care needs..."
            className="pl-10 bg-card/80 backdrop-blur-sm border-primary/20 focus:border-primary/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Difficulty:</span>
            <select 
              value={difficultyFilter} 
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-1 text-sm bg-card/80 border border-primary/20 rounded-md focus:border-primary/40 focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="very easy">Very Easy</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="difficult">Difficult</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <div className="flex gap-1">
              <Button
                variant={!showRecommendationsOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowRecommendationsOnly(false)}
                className="text-xs"
              >
                All Plants
              </Button>
              <Button
                variant={showRecommendationsOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowRecommendationsOnly(true)}
                className="text-xs"
              >
                <Star className="h-3 w-3 mr-1" />
                Recommendations
              </Button>
            </div>
          </div>
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
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {filteredRecommendations.length} recommendations
            </Badge>
            <Badge variant="outline" className="text-xs">
              {displayPlants.length} total
            </Badge>
          </div>
        </div>

        {/* Recommendations Section */}
        {filteredRecommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-md font-medium text-foreground flex items-center gap-2">
              🌟 Top Recommendations
              <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                Best Match
              </Badge>
            </h3>
            <div className="grid gap-3">
              {filteredRecommendations.slice(0, 5).map((rec) => {
                const plant = rec.careData;
                return (
                  <Card key={plant.id} className={`bg-gradient-to-r from-green-50 to-blue-50 backdrop-blur-sm shadow-card border-2 ${getCompatibilityBgColor(rec.compatibility)} hover:shadow-ar-glow transition-smooth group`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl group-hover:scale-110 transition-smooth">🌟</div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                                {plant.plant_name}
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">
                                  {rec.compatibility}% Match
                                </Badge>
                              </h3>
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
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground italic">"{rec.reason}"</p>

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
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border/50 flex gap-2">
                        <Button 
                          className={`flex-1 transition-smooth ${
                            addedPlants.includes(plant.id)
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-gradient-primary hover:shadow-ar-glow'
                          }`}
                          size="sm"
                          onClick={() => handleAddToGarden(plant.id)}
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
        )}

        {/* All Plants Section */}
        <div className="space-y-3">
          <h3 className="text-md font-medium text-foreground">All Available Plants</h3>

        <div className="grid gap-4">
          {displayPlants.filter(plant => !recommendations.some(rec => rec.careData.id === plant.id)).map((plant) => {
            const compatibility = Math.floor(Math.random() * 20 + 75);
            
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
                      onClick={() => handleAddToGarden(plant.id)}
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

      </div>

      {/* Plant Details Modal */}
      <PlantDetailsModal
        plant={selectedPlant}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDelete={deletePlant}
        showDeleteButton={true}
      />

      {/* Zone Selector Modal */}
      {showZoneSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-primary/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Select Garden Zone</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose which zone to add this plant to
                  </p>
                </div>
                
                <div className="space-y-3">
                  {availableZones.map((zone) => (
                    <Button
                      key={zone.id}
                      variant="outline"
                      className="w-full justify-start h-auto p-4 border-primary/30 hover:bg-primary/10"
                      onClick={() => {
                        if (selectedPlantForZone) {
                          addToGarden(selectedPlantForZone, zone.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Sun className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">{zone.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {zone.plants_count} plants • {zone.temperature}°C • {zone.humidity}% humidity
                          </p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowZoneSelector(false);
                      setSelectedPlantForZone(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-primary"
                    onClick={() => {
                      if (selectedPlantForZone) {
                        addToGarden(selectedPlantForZone);
                      }
                    }}
                  >
                    Create New Zone
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PlantLibrary;