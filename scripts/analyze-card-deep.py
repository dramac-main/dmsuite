"""
Deep analysis of business card mockup image.
Identifies card regions within the mockup, samples card surfaces,
detects text regions, and provides granular positioning data.
"""
import sys
import os
from PIL import Image
import numpy as np

def hex_color(r, g, b):
    return f"#{r:02x}{g:02x}{b:02x}"

def analyze_deep(path):
    img = Image.open(path).convert("RGB")
    arr = np.array(img)
    h, w, _ = arr.shape
    
    print(f"\n{'='*70}")
    print(f"DEEP ANALYSIS: {os.path.basename(path)}")
    print(f"Dimensions: {w}x{h}px")
    print(f"{'='*70}")
    
    # === 1. FIND CARD BOUNDARIES ===
    # Convert to grayscale for edge detection
    gray = arr.mean(axis=2)
    
    # Find the bright regions (card surfaces vs dark background)
    threshold = 100  # Cards should be significantly brighter than dark bg
    bright_mask = gray > threshold
    
    # Find rows and columns that have significant bright content
    row_bright = bright_mask.mean(axis=1)  # % of bright pixels per row
    col_bright = bright_mask.mean(axis=0)  # % of bright pixels per column
    
    print("\n--- BRIGHT REGION DETECTION (card vs background) ---")
    print("Row brightness (% of bright pixels):")
    for pct in range(0, 100, 2):
        y = int(h * pct / 100)
        val = row_bright[y] * 100
        bar = '█' * int(val / 2)
        if val > 5:
            print(f"  y={pct:2d}%  bright={val:5.1f}%  {bar}")
    
    print("\nColumn brightness (% of bright pixels):")
    for pct in range(0, 100, 2):
        x = int(w * pct / 100)
        val = col_bright[x] * 100
        bar = '█' * int(val / 2)
        if val > 5:
            print(f"  x={pct:2d}%  bright={val:5.1f}%  {bar}")
    
    # === 2. FINE-GRAINED 8x8 GRID ===
    print("\n--- 8x8 ZONE GRID (brightness + color) ---")
    zone_h = h // 8
    zone_w = w // 8
    for row in range(8):
        for col in range(8):
            zone = arr[row*zone_h:(row+1)*zone_h, col*zone_w:(col+1)*zone_w]
            avg = zone.reshape(-1, 3).mean(axis=0).astype(int)
            brightness = int(avg.mean())
            std = zone.reshape(-1, 3).std(axis=0).mean()
            r, g, b = avg
            indicator = "░" if brightness < 60 else ("▒" if brightness < 120 else ("▓" if brightness < 180 else "█"))
            if brightness > 80:
                print(f"  [{row},{col}] {hex_color(r,g,b)} L={brightness:3d} std={std:4.0f} {indicator*3}", end="")
                # Check for slight color tint
                if abs(r - g) > 3 or abs(g - b) > 3 or abs(r - b) > 3:
                    if b > r and b > g:
                        print(" (cool/blue tint)", end="")
                    elif r > g and r > b:
                        print(" (warm/red tint)", end="")
                    elif g > r:
                        print(" (slight green)", end="")
                print()
            else:
                print(f"  [{row},{col}] {hex_color(r,g,b)} L={brightness:3d} (BG/dark)")
    
    # === 3. DETECT CARD SURFACE COLOR ===
    # Find the brightest large region (likely the card face)
    print("\n--- CARD SURFACE COLOR DETECTION ---")
    # Sample the brightest 10% of pixels
    flat_brightness = gray.flatten()
    bright_threshold = np.percentile(flat_brightness, 90)
    bright_pixels = arr[gray > bright_threshold]
    if len(bright_pixels) > 0:
        avg_bright = bright_pixels.mean(axis=0).astype(int)
        std_bright = bright_pixels.std(axis=0)
        min_bright = bright_pixels.min(axis=0)
        max_bright = bright_pixels.max(axis=0)
        print(f"  Brightest 10% avg: {hex_color(*avg_bright)} ({avg_bright[0]},{avg_bright[1]},{avg_bright[2]})")
        print(f"  Brightest 10% std: ({std_bright[0]:.1f},{std_bright[1]:.1f},{std_bright[2]:.1f})")
        print(f"  Range: ({min_bright[0]}-{max_bright[0]}, {min_bright[1]}-{max_bright[1]}, {min_bright[2]}-{max_bright[2]})")
    
    # Brightest 5%
    bright_threshold_5 = np.percentile(flat_brightness, 95)
    bright_pixels_5 = arr[gray > bright_threshold_5]
    if len(bright_pixels_5) > 0:
        avg_5 = bright_pixels_5.mean(axis=0).astype(int)
        print(f"  Brightest  5% avg: {hex_color(*avg_5)} ({avg_5[0]},{avg_5[1]},{avg_5[2]})")
    
    # Brightest 2%
    bright_threshold_2 = np.percentile(flat_brightness, 98)
    bright_pixels_2 = arr[gray > bright_threshold_2]
    if len(bright_pixels_2) > 0:
        avg_2 = bright_pixels_2.mean(axis=0).astype(int)
        print(f"  Brightest  2% avg: {hex_color(*avg_2)} ({avg_2[0]},{avg_2[1]},{avg_2[2]})")
    
    # === 4. DETECT TEXT/DARK ELEMENTS ON CARD SURFACE ===
    print("\n--- TEXT/DARK ELEMENT DETECTION ON BRIGHT REGIONS ---")
    # Find regions that are dark within the overall bright card area
    # Focus on the bright zone area (center of image based on previous analysis)
    # The card appears to be around x=35-75%, y=25-70%
    card_region = arr[int(h*0.2):int(h*0.75), int(w*0.25):int(w*0.80)]
    card_gray = card_region.mean(axis=2)
    card_h, card_w, _ = card_region.shape
    
    print(f"\n  Card region estimate: x=25-80%, y=20-75%")
    print(f"  Card region size: {card_w}x{card_h}px")
    
    # Row-by-row darkness scan within card region
    print(f"\n  Row-by-row scan (dark = possible text):")
    for pct in range(0, 100, 3):
        y = int(card_h * pct / 100)
        row_data = card_gray[y]
        avg_brightness = row_data.mean()
        dark_pixels = (row_data < 80).sum()
        dark_pct = dark_pixels / len(row_data) * 100
        if dark_pct > 2:
            print(f"    y={pct:2d}% (abs y={int(20+pct*0.55)}%) L={avg_brightness:5.1f} dark_px={dark_pct:4.1f}% {'█' * int(dark_pct)}")
    
    # Column-by-column darkness scan
    print(f"\n  Column-by-column scan (dark = possible text):")
    for pct in range(0, 100, 3):
        x = int(card_w * pct / 100)
        col_data = card_gray[:, x]
        avg_brightness = col_data.mean()
        dark_pixels = (col_data < 80).sum()
        dark_pct = dark_pixels / len(col_data) * 100
        if dark_pct > 2:
            print(f"    x={pct:2d}% (abs x={int(25+pct*0.55)}%) L={avg_brightness:5.1f} dark_px={dark_pct:4.1f}% {'█' * int(dark_pct)}")
    
    # === 5. DETAILED HORIZONTAL SCAN FOR CARD EDGES ===
    print("\n--- CARD EDGE DETECTION (sharp brightness transitions) ---")
    # Scan horizontal line at y=50% (middle)
    mid_y = h // 2
    mid_row = gray[mid_y].astype(float)
    # Compute gradient
    gradient = np.abs(np.diff(mid_row))
    # Find sharp transitions
    sharp_threshold = 20
    sharp_points = np.where(gradient > sharp_threshold)[0]
    if len(sharp_points) > 0:
        print(f"  Sharp transitions at y=50%:")
        for sp in sharp_points[:20]:
            before = gray[mid_y, max(0, sp-2):sp].mean()
            after = gray[mid_y, sp+1:min(w, sp+3)].mean()
            print(f"    x={sp/w*100:.1f}% (px {sp}) : {before:.0f} → {after:.0f}")
    
    # === 6. DETAILED SAMPLING AT KEY PERCENTAGES ===
    print("\n--- HIGH-RES SAMPLING (5% increments, full grid) ---")
    for y_pct in range(5, 100, 5):
        for x_pct in range(5, 100, 5):
            x = int(w * x_pct / 100)
            y = int(h * y_pct / 100)
            # 3x3 sample
            region = arr[max(0,y-1):y+2, max(0,x-1):x+2]
            avg = region.reshape(-1, 3).mean(axis=0).astype(int)
            brightness = int(avg.mean())
            if brightness > 120:  # Only show bright areas (card surface)
                print(f"  ({x_pct:2d}%,{y_pct:2d}%) → {hex_color(*avg)} L={brightness}")
    
    # === 7. BACKGROUND COLOR (darkest uniform areas) ===
    print("\n--- BACKGROUND/STAGING COLOR ---")
    # Sample corners (definitely background)
    corners = [
        ("Top-left 5x5%", arr[:int(h*0.05), :int(w*0.05)]),
        ("Top-right 5x5%", arr[:int(h*0.05), int(w*0.95):]),
        ("Bot-left 5x5%", arr[int(h*0.95):, :int(w*0.05)]),
        ("Bot-right 5x5%", arr[int(h*0.95):, int(w*0.95):]),
    ]
    for label, region in corners:
        avg = region.reshape(-1, 3).mean(axis=0).astype(int)
        print(f"  {label:20s} → {hex_color(*avg)}")
    
    # === 8. COLOR TEMPERATURE ANALYSIS ===
    print("\n--- COLOR TEMPERATURE OF CARD SURFACE ---")
    if len(bright_pixels) > 0:
        r_avg, g_avg, b_avg = bright_pixels.mean(axis=0)
        print(f"  R={r_avg:.1f}, G={g_avg:.1f}, B={b_avg:.1f}")
        if b_avg > r_avg + 2:
            print(f"  → COOL tone (blue shift of {b_avg-r_avg:.1f})")
        elif r_avg > b_avg + 2:
            print(f"  → WARM tone (red shift of {r_avg-b_avg:.1f})")
        else:
            print(f"  → NEUTRAL tone")

if __name__ == "__main__":
    path = os.path.join(r"d:\dramac-ai-suite\business-card-examples", sys.argv[1])
    analyze_deep(path)
