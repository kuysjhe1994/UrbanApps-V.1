import { useCallback, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";

export interface NativeARAreaResult {
  estimatedArea: number;
}

export const useNativeAR = () => {
  const [active, setActive] = useState(false);
  const [result, setResult] = useState<NativeARAreaResult | null>(null);

  // Detect presence of a native AR plugin exposed as `ARPlugin`
  const available = useMemo(() => {
    const isNative = Capacitor.isNativePlatform();
    // @ts-ignore dynamic lookup for community plugin
    const hasPlugin = isNative && !!(Capacitor.Plugins && (Capacitor.Plugins.ARPlugin || (window as any).ARPlugin));
    return Boolean(hasPlugin);
  }, []);

  const start = useCallback(async () => {
    if (!available) return false;
    try {
      // @ts-ignore community plugin signature example
      const plugin = (Capacitor.Plugins.ARPlugin || (window as any).ARPlugin);
      setActive(true);
      const res = await plugin.start({ mode: "space" });
      if (res?.estimatedArea) setResult({ estimatedArea: res.estimatedArea });
      return true;
    } catch {
      setActive(false);
      return false;
    }
  }, [available]);

  const stop = useCallback(async () => {
    if (!available) return;
    try {
      // @ts-ignore community plugin signature example
      const plugin = (Capacitor.Plugins.ARPlugin || (window as any).ARPlugin);
      await plugin.stop();
    } finally {
      setActive(false);
    }
  }, [available]);

  return { available, active, result, start, stop };
};


