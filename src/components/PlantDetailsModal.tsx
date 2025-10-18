import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Thermometer, Droplets, Sun, Clock, Ruler, AlertCircle, Lightbulb, Trash2, Leaf } from "lucide-react";
import { PlantCareData, usePlantCare } from "@/hooks/usePlantCare";

interface PlantDetailsModalProps {
  plant: PlantCareData | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (plantId: string) => void;
  showDeleteButton?: boolean;
}

export const PlantDetailsModal = ({ 
  plant, 
  isOpen, 
  onClose, 
  onDelete, 
  showDeleteButton = false 
}: PlantDetailsModalProps) => {
  const { getRecommendationsForConditions } = usePlantCare();
  
  if (!plant) return null;

  // Generate smart recommendations for this plant
  const currentConditions = {
    temperature: 75,
    humidity: 60,
    soilMoisture: 70,
    lightHours: 8
  };
  
  const recommendations = getRecommendationsForConditions(currentConditions)
    .filter(rec => rec.name.toLowerCase() !== plant.plant_name.toLowerCase())
    .slice(0, 3);

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

  const handleDelete = () => {
    if (onDelete) {
      onDelete(plant.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-card backdrop-blur-sm border-primary/20">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-card-foreground">
                {plant.plant_name}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Complete care guide and growing information for {plant.plant_name}
              </DialogDescription>
              {plant.scientific_name && (
                <p className="text-sm text-muted-foreground italic">
                  {plant.scientific_name}
                </p>
              )}
            </div>
            {showDeleteButton && onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="ml-4"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Care Difficulty */}
          {plant.care_difficulty && (
            <div className="flex items-center gap-2">
              <Badge className={`${getDifficultyColor(plant.care_difficulty)} text-white`}>
                {plant.care_difficulty}
              </Badge>
              <span className="text-sm text-muted-foreground">Care Level</span>
            </div>
          )}

          {/* Environmental Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Temperature */}
            {plant.temperature_range && (
              <div className="bg-card/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-card-foreground">Temperature</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plant.temperature_range.min}°F - {plant.temperature_range.max}°F
                </p>
              </div>
            )}

            {/* Humidity */}
            {plant.humidity_range && (
              <div className="bg-card/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-accent" />
                  <h3 className="font-medium text-card-foreground">Humidity</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plant.humidity_range.min}% - {plant.humidity_range.max}%
                </p>
              </div>
            )}

            {/* Light Requirements */}
            {plant.light_requirements && (
              <div className="bg-card/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <h3 className="font-medium text-card-foreground">Light</h3>
                </div>
                <p className="text-sm text-muted-foreground">{plant.light_requirements}</p>
              </div>
            )}

            {/* Watering */}
            {plant.watering_frequency && (
              <div className="bg-card/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <h3 className="font-medium text-card-foreground">Watering</h3>
                </div>
                <p className="text-sm text-muted-foreground">{plant.watering_frequency}</p>
              </div>
            )}
          </div>

          {/* Additional Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plant.soil_type && (
              <div className="text-center p-3 bg-card/30 rounded-lg">
                <h4 className="font-medium text-card-foreground text-sm">Soil Type</h4>
                <p className="text-xs text-muted-foreground mt-1">{plant.soil_type}</p>
              </div>
            )}
            
            {plant.growth_rate && (
              <div className="text-center p-3 bg-card/30 rounded-lg">
                <h4 className="font-medium text-card-foreground text-sm">Growth Rate</h4>
                <p className="text-xs text-muted-foreground mt-1">{plant.growth_rate}</p>
              </div>
            )}
            
            {plant.max_height && (
              <div className="text-center p-3 bg-card/30 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Ruler className="h-3 w-3 text-muted-foreground" />
                  <h4 className="font-medium text-card-foreground text-sm">Max Height</h4>
                </div>
                <p className="text-xs text-muted-foreground">{plant.max_height}</p>
              </div>
            )}
          </div>

          {/* Care Tips */}
          {plant.care_tips && plant.care_tips.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <h3 className="font-medium text-card-foreground">Care Tips</h3>
              </div>
              <ul className="space-y-2">
                {plant.care_tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Issues */}
          {plant.common_issues && plant.common_issues.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <h3 className="font-medium text-card-foreground">Common Issues</h3>
              </div>
              <ul className="space-y-2">
                {plant.common_issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-destructive mt-1">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Plant Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-card-foreground">Recommended Companion Plants</h3>
              </div>
              <div className="grid gap-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="bg-card/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-card-foreground text-sm">{rec.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {rec.compatibility}% match
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};