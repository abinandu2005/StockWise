import os
import sys
import subprocess

try:
    from PIL import Image
except ImportError:
    print("Pillow not found. Installing Pillow...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

image_path = r"C:\Users\hp\.gemini\antigravity-ide\brain\7fcba2f4-f847-4d91-a28a-fe45c30e4d7a\media__1779264839699.png"
output_path = r"c:\Users\hp\Downloads\StockWise\StockWise\frontend\public\logo.png"

if not os.path.exists(image_path):
    print(f"Error: Source image not found at {image_path}")
    sys.exit(1)

img = Image.open(image_path)
img = img.convert("RGBA")

datas = img.getdata()

newData = []
for item in datas:
    # Check if the pixel is near-white or light gray
    # (r, g, b) are all greater than 240
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        # Make it transparent
        newData.append((255, 255, 255, 0))
    else:
        newData.append(item)

img.putdata(newData)
img.save(output_path, "PNG")
print("Background removed successfully, transparent logo saved!")
