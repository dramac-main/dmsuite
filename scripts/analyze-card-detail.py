"""
Detailed business card image analyzer.
Extracts precise color samples, element positions, and proportions
from reference business card images using Pillow + numpy.
"""
import sys
import os
from PIL import Image
import numpy as np
from collections import Counter

def hex_color(r, g, b):
    return f"#{r:02x}{g:02x}{b:02x}"

def analyze_image(path):
    img = Image.open(path).convert("RGB")
    arr = np.array(img)
    h, w, _ = arr.shape
    print(f"\n{'='*70}")
    print(f"IMAGE: {os.path.basename(path)}")
    print(f"Dimensions: {w}x{h}px  Aspect: {w/h:.3f}")
    print(f"{'='*70}")
    
    # --- Overall dominant colors ---
    # Sample every 4th pixel for speed
    sampled = arr[::4, ::4].reshape(-1, 3)
    # Quantize to reduce noise
    quantized = (sampled // 16) * 16
    color_counts = Counter(map(tuple, quantized))
    top_colors = color_counts.most_common(12)
    total = sum(c for _, c in top_colors)
    
    print("\n--- TOP 12 DOMINANT COLORS ---")
    for color, count in top_colors:
        pct = count / total * 100
        r, g, b = color
        print(f"  {hex_color(r,g,b)}  ({r:3d},{g:3d},{b:3d})  {pct:5.1f}%  {'█' * int(pct/2)}")
    
    # --- Zone analysis (divide into 4x4 grid) ---
    print("\n--- ZONE ANALYSIS (4x4 grid) ---")
    zone_h = h // 4
    zone_w = w // 4
    for row in range(4):
        for col in range(4):
            zone = arr[row*zone_h:(row+1)*zone_h, col*zone_w:(col+1)*zone_w]
            avg = zone.reshape(-1, 3).mean(axis=0).astype(int)
            r, g, b = avg
            print(f"  [{row},{col}] avg={hex_color(r,g,b)} ({r:3d},{g:3d},{b:3d})", end="")
            # Check if this zone is mostly one color (solid) or varied (content)
            std = zone.reshape(-1, 3).std(axis=0).mean()
            if std < 15:
                print(f"  SOLID", end="")
            elif std < 35:
                print(f"  SLIGHT-VARIATION", end="")
            else:
                print(f"  COMPLEX (std={std:.0f})", end="")
            print()
    
    # --- Edge samples (margins) ---
    print("\n--- EDGE COLORS (margin detection) ---")
    # Top edge (y=5% of height)
    edge_y = int(h * 0.05)
    top_strip = arr[edge_y, ::8]
    top_avg = top_strip.mean(axis=0).astype(int)
    print(f"  Top edge (y=5%):    {hex_color(*top_avg)}")
    
    # Bottom edge (y=95%)
    edge_y = int(h * 0.95)
    bot_strip = arr[edge_y, ::8]
    bot_avg = bot_strip.mean(axis=0).astype(int)
    print(f"  Bottom edge (y=95%): {hex_color(*bot_avg)}")
    
    # Left edge (x=5%)
    edge_x = int(w * 0.05)
    left_strip = arr[::8, edge_x]
    left_avg = left_strip.mean(axis=0).astype(int)
    print(f"  Left edge (x=5%):   {hex_color(*left_avg)}")
    
    # Right edge (x=95%)
    edge_x = int(w * 0.95)
    right_strip = arr[::8, edge_x]
    right_avg = right_strip.mean(axis=0).astype(int)
    print(f"  Right edge (x=95%): {hex_color(*right_avg)}")
    
    # --- Vertical profile (find horizontal splits) ---
    print("\n--- VERTICAL BRIGHTNESS PROFILE (find splits/bands) ---")
    for pct in [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]:
        y = int(h * pct / 100)
        row_avg = arr[y].mean(axis=0).astype(int)
        brightness = int(row_avg.mean())
        bar = '▓' if brightness > 128 else '░'
        print(f"  y={pct:2d}%  avg={hex_color(*row_avg)}  L={brightness:3d}  {bar * (brightness // 8)}")
    
    # --- Horizontal profile (find vertical splits) ---
    print("\n--- HORIZONTAL BRIGHTNESS PROFILE (find vertical splits) ---")
    for pct in [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]:
        x = int(w * pct / 100)
        col_avg = arr[:, x].mean(axis=0).astype(int)
        brightness = int(col_avg.mean())
        bar = '▓' if brightness > 128 else '░'
        print(f"  x={pct:2d}%  avg={hex_color(*col_avg)}  L={brightness:3d}  {bar * (brightness // 8)}")
    
    # --- Detect if image shows multiple cards (front+back) ---
    # Check if there's a gap/split in the middle
    mid_col = arr[:, w//2]
    mid_brightness = mid_col.mean()
    left_half = arr[:, :w//3].mean()
    right_half = arr[:, 2*w//3:].mean()
    print(f"\n--- MULTI-CARD DETECTION ---")
    print(f"  Left 1/3 avg brightness: {left_half:.0f}")
    print(f"  Center column brightness: {mid_brightness:.0f}")  
    print(f"  Right 1/3 avg brightness: {right_half:.0f}")
    if abs(left_half - right_half) > 40:
        print(f"  → Likely shows TWO DIFFERENT SIDES (front + back)")
    elif abs(left_half - mid_brightness) > 30:
        print(f"  → Possible gap between two cards")
    else:
        print(f"  → Likely SINGLE CARD or similar sides")
    
    # --- Specific point samples ---
    print(f"\n--- POINT SAMPLES (key positions) ---")
    points = {
        "top-left (8%,8%)": (int(w*0.08), int(h*0.08)),
        "top-center (50%,8%)": (int(w*0.50), int(h*0.08)),
        "top-right (92%,8%)": (int(w*0.92), int(h*0.08)),
        "center-left (8%,50%)": (int(w*0.08), int(h*0.50)),
        "dead-center (50%,50%)": (int(w*0.50), int(h*0.50)),
        "center-right (92%,50%)": (int(w*0.92), int(h*0.50)),
        "bot-left (8%,92%)": (int(w*0.08), int(h*0.92)),
        "bot-center (50%,92%)": (int(w*0.50), int(h*0.92)),
        "bot-right (92%,92%)": (int(w*0.92), int(h*0.92)),
    }
    for label, (px, py) in points.items():
        # Sample 5x5 area around point for stability
        region = arr[max(0,py-2):py+3, max(0,px-2):px+3]
        avg = region.reshape(-1, 3).mean(axis=0).astype(int)
        print(f"  {label:30s} → {hex_color(*avg)}")

    return arr, w, h

if __name__ == "__main__":
    base = r"d:\dramac-ai-suite\business-card-examples"
    
    if len(sys.argv) > 1:
        # Analyze specific file
        fname = sys.argv[1]
        path = os.path.join(base, fname) if not os.path.isabs(fname) else fname
        analyze_image(path)
    else:
        # List all images
        files = sorted([f for f in os.listdir(base) if f.lower().endswith(('.jpg','.png','.jpeg'))])
        print(f"Found {len(files)} images in {base}:")
        for i, f in enumerate(files, 1):
            print(f"  {i:2d}. {f}")
        print(f"\nUsage: python analyze-card-detail.py <filename>")
