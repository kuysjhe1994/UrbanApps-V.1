# AR Implementation Guide

## Overview

Your UrbanGrow app uses **ARPlugin (Kotlin)** - A complete ARCore + TensorFlow Lite solution for plant classification and space scanning.

## File Structure

```
android/app/src/main/
├── AndroidManifest.xml          # AR activities and permissions
├── assets/
│   ├── plant_model.tflite        # TensorFlow Lite model (placeholder)
│   └── labels.txt                # Model output labels
└── java/com/urbangrow/app/
    ├── MainActivity.java         # Main activity with WebView setup
    └── ar/                       # Kotlin AR with TensorFlow Lite
        ├── ARPlugin.kt           # Bridge to JS
        ├── ARActivity.kt         # ARCore session + classification
        └── TFLiteClassifier.kt   # TensorFlow Lite inference

src/
├── components/
│   └── ARScreen.tsx              # React UI for AR scanning
├── plugins/
│   └── ar-plugin.ts              # Capacitor plugin wrapper
└── hooks/
    └── useARPlugin.ts            # React hook for AR functionality
```

## AR Plugin

### ARPlugin (Kotlin + TensorFlow Lite)
**Purpose:** ARCore + ML plant classification

**Features:**
- ✅ Real-time camera ARCore
- ✅ Plane detection
- ✅ TensorFlow Lite inference
- ✅ Plant classification labels

**Usage in React:**
```typescript
import { useARPlugin } from '@/hooks/useARPlugin';

const { available, active, lastResult, start, stop } = useARPlugin();

// Start AR with classification
await start();
// lastResult contains: { label, confidence, timestamp }
```

## Setup Complete

✅ **Kotlin support** added to build.gradle  
✅ **ARCore 1.44.0** configured  
✅ **TensorFlow Lite 2.14.0** added  
✅ **ARActivity** registered in AndroidManifest  
✅ **Dependencies** configured  
✅ **ARScreen component** created  
✅ **ARPlugin wrapper** for React  
✅ **Supabase integration** ready  

## Step-by-Step Setup

### Step 1: Prepare Your Dataset

See **`setup_datasets.md`** for detailed instructions.

**Quick structure:**
```
Google Drive/MyDrive/tflite_dataset/
├── train/
│   ├── tomato/
│   ├── basil/
│   ├── lettuce/
│   ├── eggplant/
│   └── space/
├── validation/ (optional)
└── test/ (optional)
```

**Requirements:**
- 50-200+ images per class
- JPG/PNG format
- Clear, well-lit photos
- Diverse angles and conditions

### Step 2: Train Model in Google Colab

See **`COLAB_NOTEBOOK.md`** for complete notebook code.

**Quick steps:**
1. Open https://colab.research.google.com
2. Create new notebook
3. Copy-paste cells from `COLAB_NOTEBOOK.md`
4. Update `DATA_DIR` to your Drive path
5. Run all cells
6. Download the `.tflite` and `labels.txt` files

**Expected results:**
- Model accuracy: 70-90%
- Quantized model size: ~2-3 MB
- Training time: 5-15 minutes

### Step 3: Add Model to Android App

Copy downloaded files to:
```
android/app/src/main/assets/plant_model.tflite
android/app/src/main/assets/labels.txt
```

### Step 4: Improve Image Conversion (Optional)

The `imageToBitmap()` method in `ARActivity.kt` is currently a placeholder. For production, replace with proper YUV→RGB conversion (see ARActivity.kt for implementation guidance).

## Testing

### On Physical Device (Required for AR)

1. Build and install on ARCore-compatible device:
```bash
npm run build
npx cap sync android
npx cap open android
```

2. Run in Android Studio on physical device

3. Monitor logs:
```bash
adb logcat | grep -E "ARActivity|ARPlugin|TFLiteClassifier"
```

### Expected Behavior

**ARPlugin (ML-based):**
- Opens full-screen AR camera
- Detects planes using ARCore
- Classifies objects every 1 second
- Emits scanResult events to React
- Integrates with Supabase for saving scans

## Troubleshooting

### "AR not supported" error
→ Device doesn't have ARCore or it's not installed  
→ Solution: Install ARCore from Play Store

### Model loading fails
→ plant_model.tflite is placeholder or corrupted  
→ Solution: Add real TensorFlow Lite model

### No classification results
→ Model inference confidence threshold too high (>0.75)  
→ Solution: Lower threshold in ARActivity.kt line ~83

### Bridge not found
→ ARPlugin can't communicate with Capacitor  
→ Solution: Ensure MainActivity extends BridgeActivity

## Performance Tips

1. **Reduce classification frequency**: Change `delay(1000L)` to `delay(2000L)` for better battery
2. **Lower confidence threshold**: Use 0.6 instead of 0.75 for more detections
3. **Use GPU**: Enable GPU acceleration for TensorFlow Lite
4. **Optimize model**: Use quantization and model pruning

## Integration Examples

### Using ARScreen Component

```typescript
import ARScreen from '@/components/ARScreen';

function App() {
  return (
    <Routes>
      <Route path="/ar" element={<ARScreen />} />
    </Routes>
  );
}
```

### Using ARPlugin Directly

```typescript
import { useARPlugin } from '@/hooks/useARPlugin';

const { available, active, lastResult, start, stop } = useARPlugin();

// Start AR scanning
await start();

// Listen for results
useEffect(() => {
  if (lastResult) {
    console.log('Detected:', lastResult.label);
  }
}, [lastResult]);
```

## Resources

- [ARCore Documentation](https://developers.google.com/ar)
- [TensorFlow Lite Guide](https://www.tensorflow.org/lite)
- [Capacitor Plugin Development](https://capacitorjs.com/docs/plugins)

