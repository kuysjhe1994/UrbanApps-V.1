import { useCallback, useState } from "react";
import { Camera } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

export const usePermissions = () => {
  const [cameraGranted, setCameraGranted] = useState<boolean>(false);

  const ensureCameraPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setCameraGranted(true);
      return true;
    }
    try {
      const status = await Camera.checkPermissions();
      if (status.camera === "granted") {
        setCameraGranted(true);
        return true;
      }
      const request = await Camera.requestPermissions({ permissions: ["camera"] as any });
      const ok = request.camera === "granted";
      setCameraGranted(ok);
      return ok;
    } catch {
      setCameraGranted(false);
      return false;
    }
  }, []);

  return { cameraGranted, ensureCameraPermission };
};


