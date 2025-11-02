package com.urbangrow.app.ar

import android.app.Activity
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import android.view.SurfaceView
import com.google.ar.core.*
import com.google.ar.core.exceptions.*
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import kotlinx.coroutines.*
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer

class ARActivity : Activity() {
    companion object {
        private const val TAG = "ARActivity"
    }
    private var session: Session? = null
    private lateinit var surfaceView: SurfaceView
    private lateinit var classifier: TFLiteClassifier
    private var job: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        surfaceView = SurfaceView(this)
        setContentView(surfaceView)

        try {
            session = Session(this)
        } catch (e: UnavailableException) {
            Toast.makeText(this, "AR not supported", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        classifier = TFLiteClassifier(this)

        // Configure session for plane detection
        val config = Config(session!!)
        config.planeFindingMode = Config.PlaneFindingMode.HORIZONTAL_AND_VERTICAL
        session?.configure(config)
    }

    override fun onResume() {
        super.onResume()
        try {
            session?.resume()
        } catch (e: CameraNotAvailableException) {
            e.printStackTrace()
            session = null
            return
        }

        job = CoroutineScope(Dispatchers.Default).launch {
            runARLoop()
        }
    }

    override fun onPause() {
        super.onPause()
        job?.cancel()
        session?.pause()
    }

    private var lastDetectionTime = 0L
    private val DETECTION_COOLDOWN = 2000L // Send results every 2 seconds max

    private suspend fun runARLoop() {
        while (job?.isActive == true) {
            val frame = session?.update() ?: continue

            val planes = frame.getUpdatedTrackables(Plane::class.java)
            for (plane in planes) {
                if (plane.trackingState == TrackingState.TRACKING) {
                    Log.d(TAG, "Plane detected")
                }
            }

            try {
                frame.acquireCameraImage().use { image ->
                    val bmp = imageToBitmap(image)
                    val (label, conf) = classifier.classify(bmp)
                    
                    // Lower threshold for fallback detection, higher for model
                    val threshold = if (label != "background") 0.60f else 0.75f
                    
                    val now = System.currentTimeMillis()
                    if (conf > threshold && (now - lastDetectionTime) > DETECTION_COOLDOWN && label != "background") {
                        lastDetectionTime = now
                        sendResult(label, conf)
                        Log.d(TAG, "Detected: $label with confidence ${(conf * 100).toInt()}%")
                    }
                }
            } catch (e: NotYetAvailableException) {
                // frame not ready, continue
            } catch (e: Exception) {
                Log.e(TAG, "Frame error", e)
            }

            delay(1000L)
        }
    }

    private fun imageToBitmap(image: android.media.Image): Bitmap {
        val yBuffer = image.planes[0].buffer
        val uBuffer = image.planes[1].buffer
        val vBuffer = image.planes[2].buffer

        val ySize = yBuffer.remaining()
        val uSize = uBuffer.remaining()
        val vSize = vBuffer.remaining()

        val nv21 = ByteArray(ySize + uSize + vSize)

        yBuffer.get(nv21, 0, ySize)
        vBuffer.get(nv21, ySize, vSize)
        uBuffer.get(nv21, ySize + vSize, uSize)

        val yuvImage = YuvImage(nv21, ImageFormat.NV21, image.width, image.height, null)
        val out = ByteArrayOutputStream()
        yuvImage.compressToJpeg(Rect(0, 0, image.width, image.height), 80, out)
        val imageBytes = out.toByteArray()
        return BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
    }

    private fun sendResult(label: String, conf: Float) {
        runOnUiThread {
            Toast.makeText(this, "Detected: $label (${(conf * 100).toInt()}%)", Toast.LENGTH_SHORT).show()
        }

        val plugin = getCapacitorBridge()
        plugin?.sendScanResult(label, conf)
    }

    private fun getCapacitorBridge(): ARPlugin? {
        return try {
            ARPlugin.getInstance()
        } catch (e: Exception) {
            Log.e(TAG, "Could not get ARPlugin instance", e)
            null
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        job?.cancel()
        session?.close()
    }
}


