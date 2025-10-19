import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import SoilData from "@/components/SoilData";
import { useClimateData } from "@/hooks/useClimateData";
import { Thermometer, Droplets, Sun } from "lucide-react";

export default function IoTSensors() {
  const { climateData, loading } = useClimateData();

  return (
    <div className="px-4 py-4 max-w-5xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">IoT Sensors</h1>
        <p className="text-sm text-muted-foreground">View live readings from connected sensors.</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-2 sm:w-auto sm:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="soil">Soil</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Temperature</CardTitle>
                <Thermometer className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading || !climateData ? "--" : `${climateData.temperature.toFixed(1)}°C`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {loading ? "Fetching latest..." : climateData?.weather ?? ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Humidity</CardTitle>
                <Droplets className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading || !climateData ? "--" : `${climateData.humidity.toFixed(0)}%`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {loading ? "Fetching latest..." : "Relative humidity"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Light Hours</CardTitle>
                <Sun className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading || !climateData ? "--" : `${climateData.lightHours.toFixed(1)}h`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {loading ? "Fetching latest..." : "Estimated daylight"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-6" />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Location</CardTitle>
                <Badge variant="secondary">{loading ? "Updating" : "Live"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {loading || !climateData ? (
                <p>Determining your location…</p>
              ) : (
                <p>
                  {climateData.location.city}, {climateData.location.country} · {new Date(climateData.timestamp).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="soil" className="mt-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="w-full">Soil Moisture</CardTitle>
            </CardHeader>
            <CardContent>
              <SoilData />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
