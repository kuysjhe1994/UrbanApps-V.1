package com.urbangrow.app.ar

import android.content.Context
import android.graphics.Bitmap
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

class TFLiteClassifier(private val context: Context) {
    private val interpreter: Interpreter
    private val labels: List<String>

    init {
        interpreter = Interpreter(loadModelFile("plant_model.tflite"))
        labels = context.assets.open("labels.txt").bufferedReader().readLines()
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
        val scaled = Bitmap.createScaledBitmap(bitmap, 224, 224, false)
        val input = preprocess(scaled)
        val output = Array(1) { FloatArray(labels.size) }
        
        interpreter.run(input, output)
        
        val probs = output[0]
        val maxIdx = probs.indices.maxByOrNull { probs[it] } ?: 0
        
        return Pair(labels[maxIdx], probs[maxIdx])
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

