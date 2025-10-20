import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SoilData {
  id: number;
  created_at: string;
  moisture: number;
}

export default function SoilMonitor() {
  const [data, setData] = useState<SoilData[]>([]);
  const [latest, setLatest] = useState<SoilData | null>(null);
  const alertThreshold = 30; // dry threshold

  // 🔴 Fetch latest data
  useEffect(() => {
    fetchData();

    // 🟢 Real-time subscription
    const channel = supabase
      .channel("soil_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "soil_data" },
        (payload) => {
          const newData = payload.new as SoilData;
          setData((prev) => [...prev.slice(-19), newData]); // keep latest 20
          setLatest(newData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const { data: rows } = await supabase
      .from("soil_data")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(20);

    if (rows) {
      setData(rows);
      setLatest(rows[rows.length - 1]);
    }
  };

  return (
    <div className="p-4 space-y-4 w-full max-w-3xl mx-auto">
      {/* 🌱 Current Reading Card */}
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle>🌿 Current Soil Moisture</CardTitle>
        </CardHeader>
        <CardContent>
          {latest ? (
            <div className="text-center space-y-2">
              <p className="text-4xl font-bold">
                {latest.moisture}% Moisture
              </p>
              <p className="text-gray-500 text-sm">
                Last updated: {new Date(latest.created_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </CardContent>
      </Card>

      {/* ⚠️ Alert for Dry Soil */}
      {latest && latest.moisture < alertThreshold && (
        <Alert variant="destructive">
          <AlertTitle>⚠️ Warning!</AlertTitle>
          <AlertDescription>
            Soil is too dry! Moisture is at {latest.moisture}% — consider watering the plants.
          </AlertDescription>
        </Alert>
      )}

      {/* 📊 Graph */}
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle>📈 Moisture Trend (last 20 readings)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="created_at"
                tickFormatter={(time) =>
                  new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }
              />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="moisture" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
