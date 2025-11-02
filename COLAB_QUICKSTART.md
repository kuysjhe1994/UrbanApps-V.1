# 🚀 Quick Start: Train Your Plant Classification Model

## 5-Minute Setup

### 1. Open Google Colab
Visit: https://colab.research.google.com

Click: **"New Notebook"**

### 2. Copy-Paste All Code Below

Open `COLAB_NOTEBOOK.md` and copy all 9 cells.

### 3. Set Your Paths

**In Cell 1**, change these lines:

```python
DATA_DIR = "/content/drive/MyDrive/tflite_dataset"   # ← Your dataset folder
EXPORT_DIR = "/content/drive/MyDrive/tflite_output"  # ← Where model saves
```

### 4. Prepare Dataset (First Time Only)

**Option A: Use Existing Dataset**

If you have images already:
1. Create folder in Google Drive: `MyDrive/tflite_dataset/`
2. Create subfolders: `train/tomato/`, `train/basil/`, etc.
3. Upload images to each folder

**Option B: Download Public Dataset**

Run this in a Colab cell to download a sample dataset:

```python
!mkdir -p /content/drive/MyDrive/tflite_dataset/train
# Add your download script here
```

### 5. Run All Cells

Click **Runtime > Run All** or run each cell manually (Shift+Enter)

**Expected time:**
- Setup: 1-2 minutes
- Training: 5-10 minutes
- Export: 30 seconds

### 6. Download Your Model

After completion, files will be in Google Drive:
- `MyDrive/tflite_output/plant_model.tflite` (base model, ~5-8 MB)
- `MyDrive/tflite_output/plant_model_quant.tflite` (quantized, ~2-3 MB) ⭐ **Use this one!**
- `MyDrive/tflite_output/labels.txt`

### 7. Copy to Android

1. Download all files from Drive
2. Copy to your project:
   ```
   android/app/src/main/assets/plant_model.tflite
   android/app/src/main/assets/labels.txt
   ```

3. Rebuild app:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

## Recommended Dataset Sources

### Free & Legal:
1. **Your own photos** - Best accuracy!
2. **PlantNet** - Research-grade images: https://plantnet.org/
3. **Flickr Creative Commons** - https://www.flickr.com/creativecommons/
4. **Unsplash** - Free stock photos: https://unsplash.com/s/photos/tomato-plant

### Paid/Commercial:
5. **Getty Images** - Professional quality
6. **Shutterstock** - Large collection

### Search Terms:
- "organic tomato plant"
- "fresh basil leaves"
- "lettuce garden"
- "eggplant cultivation"
- "pepper plant"

## Troubleshooting

**"ModuleNotFoundError: tflite-model-maker"**
→ Run Cell 1 again to install dependencies

**"Out of memory error"**
→ Reduce batch size to 16 in Cell 3

**"Low accuracy (< 70%)"**
→ Add more training images (aim for 100+ per class)

**"Model too large"**
→ Use the quantized version instead

## Expected Results

✅ **Good model:** 75-90% accuracy, 2-3 MB  
✅ **Decent model:** 65-75% accuracy, 2-3 MB  
⚠️ **Poor model:** < 65% accuracy → Need more data

---

**Ready to start?** Open `COLAB_NOTEBOOK.md` and copy all cells to Colab!

