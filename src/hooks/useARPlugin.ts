import { useCallback, useEffect, useState, useRef } from "react";
import { Capacitor } from "@capacitor/core";

export interface ARScanResult {
  label: string;
  confidence: number;
  timestamp: number;
}

export const useARPlugin = () => {
  const [available, setAvailable] = useState(false);
  const [active, setActive] = useState(false);
  const [lastResult, setLastResult] = useState<ARScanResult | null>(null);
  const listenerRef = useRef<any>(null);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!Capacitor.isNativePlatform()) {
        setAvailable(false);
        return;
      }
      
      try {
        // @ts-ignore - ARPlugin
        const plugin = Capacitor.Plugins?.ARPlugin || (window as any).ARPlugin;
        setAvailable(!!plugin);
      } catch (error) {
        console.warn("ARPlugin not available:", error);
        setAvailable(false);
      }
    };

    checkAvailability();
    
    return () => {
      // Cleanup listener on unmount
      if (listenerRef.current) {
        listenerRef.current.remove().catch(console.error);
        listenerRef.current = null;
      }
    };
  }, []);

  const start = useCallback(async () => {
    if (!available) {
      console.warn("ARPlugin not available");
      return false;
    }
    
    try {
      // @ts-ignore - ARPlugin
      const plugin = Capacitor.Plugins?.ARPlugin || (window as any).ARPlugin;
      if (!plugin) {
        console.warn("ARPlugin not found");
        return false;
      }

      await plugin.startAR();
      setActive(true);
      
      // Remove old listener if exists
      if (listenerRef.current) {
        await listenerRef.current.remove();
        listenerRef.current = null;
      }
      
      // Listen for scan results
      listenerRef.current = await plugin.addListener('scanResult', (data: ARScanResult) => {
        console.log("AR Scan Result:", data);
        setLastResult(data);
      });
      
      return true;
    } catch (error) {
      console.error("Error starting AR:", error);
      setActive(false);
      return false;
    }
  }, [available]);

  const stop = useCallback(async () => {
    if (!available) return;
    
    try {
      // Remove listener
      if (listenerRef.current) {
        await listenerRef.current.remove();
        listenerRef.current = null;
      }
      
      // @ts-ignore - ARPlugin
      const plugin = Capacitor.Plugins?.ARPlugin || (window as any).ARPlugin;
      if (plugin) {
        await plugin.stopAR();
      }
    } catch (error) {
      console.error("Error stopping AR:", error);
    } finally {
      setActive(false);
      setLastResult(null);
    }
  }, [available]);

  return { available, active, lastResult, start, stop };
};

