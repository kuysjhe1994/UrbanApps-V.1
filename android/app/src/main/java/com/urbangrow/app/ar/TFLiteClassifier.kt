package com.urbangrow.app.ar

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

class TFLiteClassifier(private val context: Context) {
    companion object {
        private const val TAG = "TFLiteClassifier"
        private val FALLBACK_LABELS = listOf("tomato", "basil", "lettuce", "eggplant", "pepper", "background")
    }
    
    private var interpreter: Interpreter? = null
    private val labels: List<String>
    private var isModelLoaded = false

    init {
        try {
            interpreter = Interpreter(loadModelFile("plant_model.tflite"))
            labels = try {
                context.assets.open("labels.txt").bufferedReader().readLines()
            } catch (e: Exception) {
                Log.w(TAG, "labels.txt not found, using fallback labels", e)
                FALLBACK_LABELS
            }
            isModelLoaded = true
            Log.d(TAG, "Model loaded successfully with ${labels.size} labels")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load model, using fallback detection", e)
            isModelLoaded = false
            labels = FALLBACK_LABELS
        }
    }

    private fun loadModelFile(filename: String): MappedByteBuffer {
        val fileDescriptor = context.assets.openFd(filename)
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = fileDescriptor.startOffset
        val declaredLength = fileDescriptor.declaredLength
        
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    fun classify(bitmap: Bitmap): Pair<String, Float> {
        if (!isModelLoaded || interpreter == null) {
            // Fallback detection: simple color-based heuristic
            return fallbackDetection(bitmap)
        }
        
        try {
            val scaled = Bitmap.createScaledBitmap(bitmap, 224, 224, false)
            val input = preprocess(scaled)
            val output = Array(1) { FloatArray(labels.size) }
            
            interpreter?.run(input, output)
            
            val probs = output[0]
            val maxIdx = probs.indices.maxByOrNull { probs[it] } ?: 0
            
            return Pair(labels[maxIdx], probs[maxIdx])
        } catch (e: Exception) {
            Log.e(TAG, "Classification error, using fallback", e)
            return fallbackDetection(bitmap)
        }
    }
    
    private fun fallbackDetection(bitmap: Bitmap): Pair<String, Float> {
        // Simple fallback: analyze dominant colors to guess plant type
        val scaled = Bitmap.createScaledBitmap(bitmap, 100, 100, false)
        var greenPixels = 0
        var redPixels = 0
        var totalPixels = 0
        
        for (x in 0 until scaled.width) {
            for (y in 0 until scaled.height) {
                val px = scaled.getPixel(x, y)
                val r = (px shr 16) and 0xFF
                val g = (px shr 8) and 0xFF
                val b = px and 0xFF
                
                totalPixels++
                if (g > r && g > b && g > 80) greenPixels++
                if (r > 150 && g < r && b < r) redPixels++
            }
        }
        
        val greenRatio = greenPixels.toFloat() / totalPixels
        val redRatio = redPixels.toFloat() / totalPixels
        
        return when {
            redRatio > 0.15 -> Pair("tomato", 0.65f)
            greenRatio > 0.4 -> Pair("lettuce", 0.70f)
            greenRatio > 0.2 -> Pair("basil", 0.68f)
            else -> Pair("background", 0.50f)
        }
    }

    private fun preprocess(bitmap: Bitmap): Array<Array<Array<FloatArray>>> {
        val input = Array(1) { Array(224) { Array(224) { FloatArray(3) } } }
        
        for (x in 0 until 224) {
            for (y in 0 until 224) {
                val px = bitmap.getPixel(x, y)
                input[0][x][y][0] = ((px shr 16 and 0xFF) / 255.0f)
                input[0][x][y][1] = ((px shr 8 and 0xFF) / 255.0f)
                input[0][x][y][2] = ((px and 0xFF) / 255.0f)
            }
        }
        
        return input
    }
}

