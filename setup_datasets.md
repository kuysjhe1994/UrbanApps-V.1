# Dataset Setup for Plant Classification

## Quick Start Guide

### 1. Prepare Your Images

Create this folder structure in Google Drive:

```
MyDrive/
└── tflite_dataset/
    ├── train/
    │   ├── tomato/          (50-200+ images)
    │   ├── basil/           (50-200+ images)
    │   ├── lettuce/         (50-200+ images)
    │   ├── eggplant/        (50-200+ images)
    │   └── space/           (50-200+ images - non-plant backgrounds)
    ├── validation/          (optional, 10-20% of train)
    │   ├── tomato/
    │   ├── basil/
    │   ├── lettuce/
    │   ├── eggplant/
    │   └── space/
    └── test/                (optional)
        ├── tomato/
        ├── basil/
        ├── lettuce/
        ├── eggplant/
        └── space/
```

### 2. Image Requirements

- **Format:** JPG or PNG
- **Size:** Any (will be resized to 224x224 automatically)
- **Quantity:** Minimum 50 per class, preferably 100-200
- **Quality:** Clear, well-lit photos
- **Diversity:** Various angles, stages of growth, lighting conditions

### 3. Where to Find Images

**Options:**
1. **Take your own photos** - Best for accuracy
2. **PlantNet** - https://plantnet.org/ (research images)
3. **Kaggle datasets** - Search "vegetable classification"
4. **Unsplash** - Free photos (check license)
5. **CreateSpace** - Collect space/background images

### 4. Quick Download Script

If using a dataset from Kaggle or another source:

```bash
# Example: Download from a public dataset
# You can use Python script in Colab to organize images
```

### 5. Upload to Google Drive

1. Create folder structure above
2. Upload images to appropriate class folders
3. Verify folder names match your labels exactly
4. Keep folder names lowercase (optional but recommended)

## Dataset Size Guide

| Class | Minimum | Recommended | Best |
|-------|---------|-------------|------|
| Per plant | 50 | 100-150 | 200+ |
| space (background) | 50 | 100 | 150+ |
| **Total dataset** | **250** | **500-750** | **1000+** |

## Class Examples

### tomato/
- Close-up leaves
- Full plant
- Fruits at different stages
- Various lighting (indoor/outdoor)

### basil/
- Leaf details
- Potted plant
- Garden bed view
- Different basil varieties

### space/
- Empty pots
- Soil patches
- Tabletops
- Balcony floors
- Walls and surfaces
- (These are for detecting "not a plant" or background)

## Next Steps

After organizing your dataset:
1. Open the Colab notebook
2. Update `DATA_DIR` path
3. Run all cells
4. Download the `.tflite` and `labels.txt` files

