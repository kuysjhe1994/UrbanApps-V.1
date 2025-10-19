import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

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
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-semibold">Live Soil Moisture</h2>
        <Badge variant="secondary">{moisture !== null ? 'Live' : 'Waiting'}</Badge>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6 text-center">
          <div className="text-sm text-muted-foreground mb-1">Current moisture</div>
          <div className="text-4xl font-bold tracking-tight">{moisture ?? '--'}<span className="text-base font-medium ml-1">%</span></div>
        </CardContent>
      </Card>

      <div>
        <div className="text-sm font-medium mb-2">Recent readings</div>
        <ScrollArea className="h-56">
          <div className="space-y-2">
            {logs.map((row) => (
              <Card key={row.id}>
                <CardContent className="pt-4 pb-4 flex items-center justify-between">
                  <div className="font-medium">{row.moisture}%</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
