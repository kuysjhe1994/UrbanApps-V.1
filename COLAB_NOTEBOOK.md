# Google Colab Notebook for Plant Classification Model

## Quick Start

1. **Open Google Colab:** https://colab.research.google.com
2. **Create new notebook**
3. **Copy-paste the cells below**
4. **Run each cell in order**

---

## Cell 1: Setup Dependencies

```python
# === Install TensorFlow and Model Maker ===
!pip install -q -U "tensorflow==2.14.*"
!pip install -q -U tflite-model-maker
!pip install -q -U tflite-support

# Mount Google Drive
from google.colab import drive
drive.mount('/content/drive')

# Configure paths
DATA_DIR = "/content/drive/MyDrive/tflite_dataset"   # Your dataset folder
EXPORT_DIR = "/content/drive/MyDrive/tflite_output"  # Output folder

import os
os.makedirs(EXPORT_DIR, exist_ok=True)

print("✅ Setup complete!")
print(f"DATA_DIR: {DATA_DIR}")
print(f"EXPORT_DIR: {EXPORT_DIR}")
```

---

## Cell 2: Load and Verify Dataset

```python
# === Load dataset ===
from tflite_model_maker import image_classifier
from tflite_model_maker.image_classifier import DataLoader

# Check if dataset exists
if not os.path.exists(DATA_DIR):
    print(f"❌ ERROR: {DATA_DIR} not found!")
    print("Please create your dataset folder in Google Drive first.")
else:
    # Load training data
    if os.path.exists(os.path.join(DATA_DIR, 'train')):
        # Dataset already split
        train_data = DataLoader.from_folder(os.path.join(DATA_DIR, 'train'))
        validation_data = DataLoader.from_folder(os.path.join(DATA_DIR, 'validation')) if os.path.exists(os.path.join(DATA_DIR, 'validation')) else None
    else:
        # Let Model Maker split automatically
        dataset = DataLoader.from_folder(DATA_DIR)
        train_data, validation_data, test_data = dataset.split(0.7, 0.2, 0.1)
        print("Dataset split: 70% train, 20% validation, 10% test")
    
    print("\n✅ Dataset loaded successfully!")
    print(f"Classes: {train_data.index_to_label}")
    print(f"Training images: {len(train_data)}")
    if validation_data:
        print(f"Validation images: {len(validation_data)}")
```

---

## Cell 3: Train Model

```python
# === Configure training ===
model_spec = image_classifier.ModelSpec(name='mobilenet_v2', model_dir=None)

# Hyperparameters
epochs = 10
batch_size = 32
learning_rate = 0.0002
image_size = 224

print("🚀 Starting training...")
print(f"Model: MobileNetV2")
print(f"Epochs: {epochs}")
print(f"Batch size: {batch_size}")

# Train the model
model = image_classifier.create(
    train_data,
    model_spec=model_spec,
    validation_data=validation_data,
    batch_size=batch_size,
    epochs=epochs,
    train_whole_model=False,           # Feature extraction first
    transfer_learning_rate=learning_rate,
    model_dir=None,
)

print("✅ Training complete!")
```

---

## Cell 4: Evaluate Model

```python
# === Evaluate model ===
if validation_data:
    print("📊 Evaluating on validation set...")
    loss, accuracy = model.evaluate(validation_data)
    print(f"Validation Loss: {loss:.4f}")
    print(f"Validation Accuracy: {accuracy*100:.2f}%")
    
    if accuracy < 0.7:
        print("⚠️  Low accuracy detected. Consider:")
        print("  - Adding more training images")
        print("  - Fine-tuning (run next cell)")
else:
    print("⚠️  No validation data available")
```

---

## Cell 5: Fine-tune (Optional - Better Accuracy)

```python
# === Fine-tune for better accuracy ===
# Uncomment the lines below to fine-tune

# print("🔧 Fine-tuning model...")
# fine_tune_epochs = 3
# model.fine_tune(fine_tune_epochs)
# 
# if validation_data:
#     loss, accuracy = model.evaluate(validation_data)
#     print(f"After fine-tuning - Accuracy: {accuracy*100:.2f}%")
# else:
#     print("⚠️  No validation data for evaluation")

print("Skipping fine-tuning for faster export.")
```

---

## Cell 6: Export TFLite Model

```python
# === Export model ===
print("💾 Exporting TensorFlow Lite model...")

# Export base float model
model.export(
    export_dir=EXPORT_DIR,
    export_format=[image_classifier.ExportFormat.TFLITE, image_classifier.ExportFormat.LABEL]
)

print(f"✅ Model exported to: {EXPORT_DIR}")
print("Files created:")
for file in os.listdir(EXPORT_DIR):
    file_path = os.path.join(EXPORT_DIR, file)
    if os.path.isfile(file_path):
        size_mb = os.path.getsize(file_path) / (1024 * 1024)
        print(f"  - {file} ({size_mb:.2f} MB)")
```

---

## Cell 7: Create Quantized Model (Smaller & Faster)

```python
# === Create quantized model ===
print("⚡ Creating quantized model (smaller & faster)...")

# Export quantized version
quant_export_dir = os.path.join(EXPORT_DIR, "quantized")
os.makedirs(quant_export_dir, exist_ok=True)

model.export(
    export_dir=quant_export_dir,
    export_format=[image_classifier.ExportFormat.TFLITE],
    quantized=True
)

print(f"✅ Quantized model exported to: {quant_export_dir}")

# Compare sizes
print("\n📦 Model size comparison:")
for export in [EXPORT_DIR, quant_export_dir]:
    for file in os.listdir(export):
        if file.endswith('.tflite'):
            path = os.path.join(export, file)
            size_mb = os.path.getsize(path) / (1024 * 1024)
            print(f"  {file}: {size_mb:.2f} MB")
```

---

## Cell 8: Test Model Locally

```python
# === Test on a sample image ===
from PIL import Image
import random

# Find a random test image
test_images = []
for root, _, files in os.walk(os.path.join(DATA_DIR, 'train')):
    for f in files:
        if f.lower().endswith(('.jpg', '.png', '.jpeg')):
            test_images.append(os.path.join(root, f))

if test_images:
    # Pick random image
    sample_path = random.choice(test_images)
    print(f"Testing on: {os.path.basename(sample_path)}")
    
    # Load and predict
    img = Image.open(sample_path).resize((224, 224)).convert('RGB')
    predictions = model.predict_top_k(img, k=3)
    
    print("\n🔮 Top 3 Predictions:")
    for i, (label, score) in enumerate(predictions, 1):
        print(f"  {i}. {label}: {score*100:.2f}%")
    
    # Show image
    display(img)
else:
    print("❌ No test images found")
```

---

## Cell 9: Download Files

```python
# === Download models to your computer ===
from google.colab import files

print("📥 Downloading models...")

# Download files
for folder in [EXPORT_DIR, os.path.join(EXPORT_DIR, "quantized")]:
    for file in os.listdir(folder):
        if file.endswith('.tflite') or file.endswith('.txt'):
            file_path = os.path.join(folder, file)
            files.download(file_path)
            print(f"✅ Downloaded: {file}")

print("\n🎉 All done! Copy these files to your Android app:")
print("  android/app/src/main/assets/plant_model.tflite")
print("  android/app/src/main/assets/labels.txt")
```

---

## Quick Reference

### Paths to Update:
- `DATA_DIR` - Your Google Drive dataset folder
- `EXPORT_DIR` - Where to save the exported model

### Expected Results:
- **Base model:** ~5-8 MB
- **Quantized model:** ~2-3 MB (recommended)
- **Accuracy:** 70-90% depending on dataset quality

### Troubleshooting:

**"DATA_DIR not found"**
→ Create folder structure in Google Drive first

**Low accuracy (< 70%)**
→ Add more training images per class
→ Ensure diverse, well-lit photos
→ Fine-tune the model (Cell 5)

**Large model size**
→ Use the quantized model instead
→ Consider MobileNetV3 for smaller models

---

**Next Steps:**
1. Copy `plant_model.tflite` to Android assets
2. Copy `labels.txt` to Android assets  
3. Rebuild your app
4. Test on device!

