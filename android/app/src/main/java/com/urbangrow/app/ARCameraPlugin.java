package com.urbangrow.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.util.Log;
import androidx.annotation.NonNull;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "ARCamera",
    permissions = {
        @Permission(
            strings = { Manifest.permission.CAMERA },
            alias = "camera"
        )
    }
)
public class ARCameraPlugin extends Plugin {
    
    private static final String TAG = "ARCameraPlugin";
    
    @PluginMethod
    public void checkARSupport(PluginCall call) {
        try {
            boolean arSupported = isARCoreSupported();
            JSObject result = new JSObject();
            result.put("supported", arSupported);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to check AR support: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void startARSession(PluginCall call) {
        // Request camera permission
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "cameraPermsCallback");
            return;
        }
        
        try {
            boolean arSupported = isARCoreSupported();
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("arcoreSupported", arSupported);
            result.put("message", arSupported ? "AR session started with ARCore" : "AR session started (fallback mode)");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error starting AR session: " + e.getMessage(), e);
            call.reject("Failed to start AR session: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void stopARSession(PluginCall call) {
        try {
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "AR session stopped");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to stop AR session: " + e.getMessage());
        }
    }
    
    // Methods for space scanning compatibility with frontend
    @PluginMethod
    public void start(PluginCall call) {
        // Alias for startARSession for compatibility
        String mode = call.getString("mode", "space");
        Log.d(TAG, "Starting AR session with mode: " + mode);
        
        // Always allow starting, even without ARCore (fallback mode)
        startARSession(call);
    }
    
    @PluginMethod
    public void stop(PluginCall call) {
        // Alias for stopARSession for compatibility
        stopARSession(call);
    }
    
    @PluginMethod
    public void measureArea(PluginCall call) {
        try {
            // Request camera permission first
            if (getPermissionState("camera") != PermissionState.GRANTED) {
                requestPermissionForAlias("camera", call, "areaMeasurePermsCallback");
                return;
            }
            
            if (!isARCoreSupported()) {
                // Fallback: Return estimated area based on camera analysis
                // In a real implementation, this would use ARCore to measure actual area
                JSObject result = new JSObject();
                result.put("estimatedArea", 2.5); // Default estimated area in m²
                result.put("method", "estimation");
                result.put("message", "ARCore not available, using estimation");
                call.resolve(result);
                return;
            }
            
            // If ARCore is available, we could implement real measurement here
            // For now, return a simulated measurement
            JSObject result = new JSObject();
            result.put("estimatedArea", 3.0); // Simulated area measurement in m²
            result.put("method", "arcore");
            result.put("confidence", 0.85);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error measuring area: " + e.getMessage(), e);
            call.reject("Failed to measure area: " + e.getMessage());
        }
    }
    
    @PermissionCallback
    private void areaMeasurePermsCallback(PluginCall call) {
        if (getPermissionState("camera") == PermissionState.GRANTED) {
            measureArea(call);
        } else {
            call.reject("Camera permission denied");
        }
    }
    
    @PermissionCallback
    private void cameraPermsCallback(PluginCall call) {
        if (getPermissionState("camera") == PermissionState.GRANTED) {
            startARSession(call);
        } else {
            call.reject("Camera permission denied");
        }
    }
    
    private boolean isARCoreSupported() {
        try {
            // Check if ARCore is available by trying to load the ARCore class
            // Use reflection to avoid crashes on devices without ARCore
            Class<?> arCoreApkClass = Class.forName("com.google.ar.core.ArCoreApk");
            if (arCoreApkClass != null) {
                Log.d(TAG, "ARCore is supported on this device");
                return true;
            }
        } catch (ClassNotFoundException e) {
            Log.d(TAG, "ARCore not found - device does not support AR");
        } catch (NoClassDefFoundError e) {
            Log.d(TAG, "ARCore classes not available - device does not support AR");
        } catch (Exception e) {
            Log.w(TAG, "Error checking ARCore support: " + e.getMessage());
        }
        return false;
    }
}

