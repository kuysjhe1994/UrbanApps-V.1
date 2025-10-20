import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DHTData {
  id: number;
  created_at: string;
  temperature: number;
  humidity: number;
}

export default function DHTDashboard() {
  const [data, setData] = useState<DHTData[]>([]);
  const [latest, setLatest] = useState<DHTData | null>(null);
  const [alert, setAlert] = useState<string>("");

  // 🔄 Fetch and subscribe
  useEffect(() => {
    fetchData();
    const channel = listenRealtime();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    const { data: rows, error } = await supabase
      .from("dht_data")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) {
      console.error(error);
      return;
    }
    if (rows) {
      setData(rows);
      setLatest(rows[rows.length - 1] ?? null);
      if (rows.length > 0) checkAlerts(rows[rows.length - 1] as DHTData);
    }
  }

  // 📡 Real-time listener
  function listenRealtime() {
    const channel = supabase
      .channel("dht_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dht_data" },
        (payload) => {
          const newData = payload.new as DHTData;
          setData((prev) => [...prev.slice(-49), newData]); // keep latest 50
          setLatest(newData);
          checkAlerts(newData);
        }
      )
      .subscribe();
    return channel;
  }

  // ⚠️ Alerts (temp > 35°C or humidity < 30%)
  function checkAlerts(reading: DHTData) {
    if (reading.temperature > 35) setAlert("🔥 Warning: High Temperature!");
    else if (reading.humidity < 30) setAlert("💧 Warning: Low Humidity!");
    else setAlert("");
  }

  return (
    <div className="p-0 space-y-4 w-full max-w-3xl mx-auto">
      {/* Current reading */}
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle>🌡 Current Temperature & Humidity</CardTitle>
        </CardHeader>
        <CardContent>
          {latest ? (
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold">
                {latest.temperature.toFixed(1)}°C · {latest.humidity.toFixed(0)}%
              </p>
              <p className="text-muted-foreground text-sm">
                Last updated: {new Date(latest.created_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </CardContent>
      </Card>

      {alert && (
        <Alert variant="destructive">
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>{alert}</AlertDescription>
        </Alert>
      )}

      {/* Trend chart */}
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle>📈 DHT Trend (last 50 readings)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="created_at"
                tickFormatter={(time) =>
                  new Date(time as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temperature" stroke="#f87171" name="Temp (°C)" strokeWidth={2} />
              <Line type="monotone" dataKey="humidity" stroke="#60a5fa" name="Humidity (%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground mt-2">📡 Live updates from DHT11 sensor</p>
        </CardContent>
      </Card>
    </div>
  );
}
