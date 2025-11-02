package com.urbangrow.app.ar

import android.content.Intent
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

@CapacitorPlugin(
    name = "ARPlugin",
    permissions = [
        Permission(strings = [android.Manifest.permission.CAMERA], alias = "camera")
    ]
)
class ARPlugin : Plugin() {

    companion object {
        @Volatile
        private var instance: ARPlugin? = null
        
        fun getInstance(): ARPlugin? = instance
        
        private fun setInstance(plugin: ARPlugin?) {
            instance = plugin
        }
    }

    override fun load() {
        super.load()
        setInstance(this)
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        setInstance(null)
    }

    @PluginMethod
    fun startAR(call: PluginCall) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "permGranted")
            return
        }
        
        val intent = Intent(context, ARActivity::class.java)
        activity?.startActivity(intent)
        call.resolve()
    }

    @PermissionCallback
    private fun permGranted(call: PluginCall) {
        startAR(call)
    }

    @PluginMethod
    fun stopAR(call: PluginCall) {
        activity?.finish()
        call.resolve()
    }

    /** Called by ARActivity to send scan results back to JS layer */
    fun sendScanResult(label: String, confidence: Float) {
        val js = JSObject().apply {
            put("label", label)
            put("confidence", confidence)
            put("timestamp", System.currentTimeMillis())
        }
        notifyListeners("scanResult", js)
    }
}

