import { useCallback, useMemo, useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export interface NativeARAreaResult {
  estimatedArea: number;
}

export const useNativeAR = () => {
  const [active, setActive] = useState(false);
  const [result, setResult] = useState<NativeARAreaResult | null>(null);
  const [available, setAvailable] = useState(false);

  // Check if ARCamera plugin is available
  useEffect(() => {
    const checkAvailability = async () => {
      if (!Capacitor.isNativePlatform()) {
        setAvailable(false);
        return;
      }
      
      try {
        // @ts-ignore - ARCamera plugin
        const plugin = Capacitor.Plugins?.ARCamera || (window as any).ARCamera;
        if (plugin) {
          // Try to check AR support
          try {
            const supportCheck = await plugin.checkARSupport();
            setAvailable(supportCheck?.supported ?? true);
          } catch {
            // If check fails, assume plugin is available
            setAvailable(true);
          }
        } else {
          setAvailable(false);
        }
      } catch (error) {
        console.warn("ARCamera plugin not available:", error);
        setAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  const start = useCallback(async () => {
    if (!available) {
      console.warn("ARCamera plugin not available");
      return false;
    }
    
    try {
      // @ts-ignore - ARCamera plugin
      const plugin = Capacitor.Plugins?.ARCamera || (window as any).ARCamera;
      if (!plugin) {
        console.warn("ARCamera plugin not found");
        return false;
      }

      setActive(true);
      
      // Start AR session
      await plugin.start({ mode: "space" });
      
      // Measure area
      const areaResult = await plugin.measureArea();
      if (areaResult?.estimatedArea) {
        setResult({ estimatedArea: areaResult.estimatedArea });
      }
      
      return true;
    } catch (error) {
      console.error("Error starting AR session:", error);
      setActive(false);
      return false;
    }
  }, [available]);

  const stop = useCallback(async () => {
    if (!available) return;
    
    try {
      // @ts-ignore - ARCamera plugin
      const plugin = Capacitor.Plugins?.ARCamera || (window as any).ARCamera;
      if (plugin) {
        await plugin.stop();
      }
    } catch (error) {
      console.error("Error stopping AR session:", error);
    } finally {
      setActive(false);
      setResult(null);
    }
  }, [available]);

  return { available, active, result, start, stop };
};


