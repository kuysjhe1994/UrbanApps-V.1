import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SoilData() {
  const [moisture, setMoisture] = useState<number | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // initial fetch
    fetchData();

    // real-time subscription
    const channel = supabase
      .channel('soil_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'soil_data' },
        (payload) => {
          const newData = payload.new;
          setMoisture(newData.moisture);
          setLogs((prev) => [newData, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from('soil_data')
      .select('*')
      .order('id', { ascending: false })
      .limit(10);
    if (data && data.length > 0) {
      setMoisture(data[0].moisture);
      setLogs(data);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">🌱 Live Soil Moisture</h1>
      <p className="text-lg mb-6">
        Current: <span className="font-mono">{moisture ?? '--'}</span>
      </p>
      <ul className="text-left text-sm max-h-60 overflow-y-auto bg-gray-100 p-2 rounded">
        {logs.map((row) => (
          <li key={row.id}>
            #{row.id} — {row.moisture}% —{' '}
            {new Date(row.created_at).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
