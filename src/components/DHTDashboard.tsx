import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

const supabaseUrl = "https://ktzlpcrepjgdzqvxzbmz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0emxwY3JlcGpnZHpxdnh6Ym16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTUyMjcsImV4cCI6MjA3MjA5MTIyN30.GNrh6CxJnX08Sq4tbjy6W1IKn6DwFvo3hTBeZQv5wRA"; // same as API key
const supabase = createClient(supabaseUrl, supabaseKey);

interface DHTData {
  id: number;
  created_at: string;
  temperature: number;
  humidity: number;
}

export default function DHTDashboard() {
  const [data, setData] = useState<DHTData[]>([]);
  const [alert, setAlert] = useState<string>("");

  // 🔄 Fetch initial data
  useEffect(() => {
    fetchData();
    listenRealtime();
  }, []);

  async function fetchData() {
    const { data, error } = await supabase
      .from("dht_data")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) console.error(error);
    else setData(data);
  }

  // 📡 Real-time listener
  function listenRealtime() {
    supabase
      .channel("dht_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dht_data" },
        (payload) => {
          setData((prev) => [...prev, payload.new as DHTData]);
          checkAlerts(payload.new as DHTData);
        }
      )
      .subscribe();
  }

  // ⚠️ Alerts (temp > 35°C or humidity < 30%)
  function checkAlerts(reading: DHTData) {
    if (reading.temperature > 35)
      setAlert("🔥 Warning: High Temperature!");
    else if (reading.humidity < 30)
      setAlert("💧 Warning: Low Humidity!");
    else setAlert("");
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">🌡 DHT11 Live Dashboard</h1>

      {alert && (
        <div className="bg-red-600 text-white px-4 py-2 rounded-lg mb-4">
          {alert}
        </div>
      )}

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="created_at" tickFormatter={(t) => t.slice(11, 19)} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="temperature" stroke="#f87171" name="Temp (°C)" />
          <Line type="monotone" dataKey="humidity" stroke="#60a5fa" name="Humidity (%)" />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4">
        <p className="text-gray-400">📡 Live updates from DHT11 sensor</p>
      </div>
    </div>
  );
}
