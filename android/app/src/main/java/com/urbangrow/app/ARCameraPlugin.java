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
        if (!isARCoreSupported()) {
            call.reject("ARCore is not supported on this device");
            return;
        }
        
        // Request camera permission
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "cameraPermsCallback");
            return;
        }
        
        try {
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "AR session started");
            call.resolve(result);
        } catch (Exception e) {
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
            Class.forName("com.google.ar.core.ArCoreApk");
            return true;
        } catch (ClassNotFoundException e) {
            Log.d(TAG, "ARCore not found");
            return false;
        }
    }
}

