import React, { useEffect, useState } from "react";
import { ARPlugin } from "@/plugins/ar-plugin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

interface ScanResult {
  label: string;
  confidence: number;
  timestamp: number;
}

export default function ARScreen() {
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [isNative, setIsNative] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if we're on native platform
    setIsNative(Capacitor.isNativePlatform());
    
    if (!Capacitor.isNativePlatform()) {
      setStatus("AR is only available on mobile devices");
      return;
    }

    let listener: any = null;

    const startAR = async () => {
      try {
        // Add listener for scan results
        listener = await ARPlugin.addListener("scanResult", async (data: any) => {
          setScan({
            label: data.label,
            confidence: data.confidence,
            timestamp: data.timestamp,
          });
          setStatus(`Detected: ${data.label} (${(data.confidence * 100).toFixed(1)}%)`);
          
          toast({
            title: "Plant Detected!",
            description: `${data.label} detected with ${(data.confidence * 100).toFixed(1)}% confidence`
          });
        });

        // Start AR scanning
        await ARPlugin.startAR();
        setStatus("AR Scanning Active");
      } catch (error: any) {
        console.error("AR Error:", error);
        setStatus(`Error: ${error.message}`);
        toast({
          variant: "destructive",
          title: "AR Failed",
          description: error.message
        });
      }
    };

    startAR();

    return () => {
      if (listener) {
        listener.remove();
      }
      ARPlugin.stopAR().catch(console.error);
    };
  }, [toast]);

  const handleSave = async () => {
    if (!scan) return;

    setUploading(true);
    setStatus("Uploading result to Supabase...");

    try {
      const { data: authUser } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.from("ar_scans").insert([
        {
          detected_plant_name: scan.label,
          confidence_score: scan.confidence,
          user_id: authUser.user?.id || 'anonymous',
          environmental_data: null,
          location_data: null,
          recommendations: null,
          image_url: null,
        },
      ]);

      if (error) {
        setStatus(`Upload error: ${error.message}`);
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: error.message
        });
      } else {
        setStatus("Result saved to Supabase ✅");
        toast({
          title: "Scan Saved!",
          description: "Successfully saved to your scan history"
        });
        setScan(null);
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
      toast({
        variant: "destructive",
        title: "Save Error",
        description: error.message
      });
    }

    setUploading(false);
  };

  const handleReset = async () => {
    setScan(null);
    setStatus("Ready to scan...");
    
    if (isNative) {
      try {
        await ARPlugin.stopAR();
        await new Promise(resolve => setTimeout(resolve, 500));
        await ARPlugin.startAR();
        setStatus("AR Scanning Active");
      } catch (error) {
        console.error("Reset error:", error);
      }
    }
  };

  return (
    <div className="relative h-screen w-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden">
      {/* Native AR view (Android handles camera preview) */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        {!isNative && (
          <div className="text-center p-8">
            <p className="text-2xl mb-4">📱</p>
            <p className="text-lg font-semibold">AR Mode</p>
            <p className="text-sm opacity-70 mt-2">
              Please open this app on a mobile device to use AR features
            </p>
          </div>
        )}
      </div>

      {/* Overlay UI */}
      <div className="absolute bottom-10 w-full flex flex-col items-center gap-4 px-4 z-10">
        {scan ? (
          <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 text-white animate-in slide-in-from-bottom">
            <CardContent className="p-4 text-center">
              <div className="text-6xl mb-3">🌿</div>
              <p className="text-2xl font-semibold mb-1">{scan.label}</p>
              <p className="text-sm opacity-80 mb-4">
                Confidence: {(scan.confidence * 100).toFixed(2)}%
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={uploading}
                >
                  {uploading ? "Saving..." : "Save Scan"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                  disabled={uploading}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="w-full max-w-md bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
            <p className="text-sm opacity-70 animate-pulse">{status}</p>
            {isNative && (
              <p className="text-xs opacity-50 mt-2">
                Point your camera at plants
              </p>
            )}
          </div>
        )}

        {isNative && !scan && (
          <Button
            variant="secondary"
            onClick={handleReset}
            className="w-full max-w-md"
          >
            Reset Scanner
          </Button>
        )}
      </div>

      {/* Status indicator */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isNative ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
            <p className="text-xs opacity-80">
              {isNative ? 'AR Active' : 'Web Mode'}
            </p>
          </div>
          {scan && (
            <p className="text-xs opacity-60">
              {new Date(scan.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

