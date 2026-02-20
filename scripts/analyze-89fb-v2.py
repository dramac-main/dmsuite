"""
Ultra-precise analysis of 89fb07c3dc093631d699d53a56173205.jpg
Targeted for the SH monogram business card mockup
"""
import os
from PIL import Image
import numpy as np

def hex_color(r, g, b):
    return f"#{r:02x}{g:02x}{b:02x}"

def analyze():
    path = r"d:\dramac-ai-suite\business-card-examples\89fb07c3dc093631d699d53a56173205.jpg"
    img = Image.open(path).convert("RGB")
    arr = np.array(img)
    h, w, _ = arr.shape
    gray = arr.mean(axis=2)
    
    print(f"Image: {w}x{h}px")
    
    # ===================================================================
    # PART 1: MAP THE ENTIRE IMAGE - detailed grid scan
    # ===================================================================
    print("\n" + "="*70)
    print("PART 1: FULL IMAGE BRIGHTNESS MAP (5% grid)")
    print("="*70)
    
    # Show brightness at every 5% grid point
    print("\n     ", end="")
    for x_pct in range(0, 101, 5):
        print(f"{x_pct:4d}", end="")
    print("  ← x%")
    
    for y_pct in range(0, 101, 5):
        y = min(int(h * y_pct / 100), h-1)
        print(f"y={y_pct:2d}% ", end="")
        for x_pct in range(0, 101, 5):
            x = min(int(w * x_pct / 100), w-1)
            val = int(gray[y, x])
            # Show as character: dark=# mid=. bright=o white=O
            if val < 50:
                ch = "████"
            elif val < 120:
                ch = "░░░░"
            elif val < 180:
                ch = "▒▒▒▒"
            elif val < 220:
                ch = "▓▓▓▓"
            else:
                ch = "    "
            print(ch, end="")
        print()
    
    # ===================================================================
    # PART 2: DETAILED COLOR MAP (10% grid with hex)
    # ===================================================================
    print("\n" + "="*70)
    print("PART 2: DETAILED COLOR MAP (10% grid)")
    print("="*70)
    
    for y_pct in range(0, 101, 5):
        y = min(int(h * y_pct / 100), h-1)
        for x_pct in range(0, 101, 10):
            x = min(int(w * x_pct / 100), w-1)
            region = arr[max(0,y-3):min(h,y+4), max(0,x-3):min(w,x+4)]
            avg = region.reshape(-1, 3).mean(axis=0).astype(int)
            L = int(avg.mean())
            print(f"  ({x_pct:2d}%,{y_pct:2d}%) {hex_color(*avg)} L={L:3d}", end="")
        print()
    
    # ===================================================================
    # PART 3: FIND ALL DISTINCT REGIONS
    # ===================================================================
    print("\n" + "="*70)
    print("PART 3: REGION SEGMENTATION")
    print("="*70)
    
    # Segment by brightness into: very dark (<50), dark (50-100), 
    # medium (100-160), bright (160-210), very bright (>210)
    segments = [
        ("VERY DARK (<50)", 0, 50),
        ("DARK (50-100)", 50, 100),
        ("MEDIUM (100-160)", 100, 160),
        ("BRIGHT (160-210)", 160, 210),
        ("VERY BRIGHT (>210)", 210, 256),
    ]
    
    for name, lo, hi in segments:
        mask = (gray >= lo) & (gray < hi)
        count = mask.sum()
        pct = count / (w*h) * 100
        if count > 100:
            coords = np.where(mask)
            y_min = coords[0].min() / h * 100
            y_max = coords[0].max() / h * 100
            x_min = coords[1].min() / w * 100
            x_max = coords[1].max() / w * 100
            
            # Average color of this segment
            pixels = arr[mask]
            avg = pixels.mean(axis=0).astype(int)
            
            print(f"\n  {name}: {pct:.1f}% of image")
            print(f"    Color: {hex_color(*avg)} R={avg[0]} G={avg[1]} B={avg[2]}")
            print(f"    Extent: x={x_min:.1f}%-{x_max:.1f}%, y={y_min:.1f}%-{y_max:.1f}%")
    
    # ===================================================================
    # PART 4: LINE-BY-LINE HORIZONTAL SCAN FOR TEXT ROWS
    # ===================================================================
    print("\n" + "="*70)
    print("PART 4: HORIZONTAL SCAN FOR TEXT/ELEMENT ROWS")
    print("="*70)
    
    # For each row, count pixels significantly darker than neighbors
    print("\nRows with significant dark-on-light contrast (likely text on front card):")
    
    # Focus on the bright card area first
    # The front card appears to be in the upper portion based on L>200 data
    for y in range(0, h, 2):
        row = gray[y]
        # Check if this row has both bright (>200) and dark (<100) pixels
        bright_count = (row > 200).sum()
        dark_on_bright = 0
        
        if bright_count > w * 0.2:  # At least 20% of row is bright
            # This row is on a bright card surface
            # Count dark pixels that are surrounded by bright ones
            for x in range(10, w-10):
                if row[x] < 100 and row[max(0,x-20):x].mean() > 180:
                    dark_on_bright += 1
            
            if dark_on_bright > 5:
                y_pct = y / h * 100
                # Find x extent of dark pixels
                dark_idx = np.where((row < 100) & (np.convolve(row > 180, np.ones(20)/20, 'same') > 0.3))[0]
                if len(dark_idx) > 0:
                    x_start = dark_idx[0] / w * 100
                    x_end = dark_idx[-1] / w * 100
                    
                    # Sample color of dark pixels
                    dark_colors = arr[y, dark_idx[:20]]
                    avg_dark = dark_colors.mean(axis=0).astype(int)
                    
                    print(f"  y={y_pct:5.1f}%: {dark_on_bright:3d} dark px, x={x_start:.1f}%-{x_end:.1f}%, color={hex_color(*avg_dark)}")
    
    # Now for bright-on-dark (back card)
    print("\nRows with significant bright-on-dark contrast (likely text on back card):")
    for y in range(0, h, 2):
        row = gray[y]
        dark_count = (row < 80).sum()
        bright_on_dark = 0
        
        if dark_count > w * 0.2:  # At least 20% is dark
            for x in range(10, w-10):
                if row[x] > 180 and row[max(0,x-20):x].mean() < 80:
                    bright_on_dark += 1
            
            if bright_on_dark > 5:
                y_pct = y / h * 100
                bright_idx = np.where((row > 180) & (np.convolve(row < 80, np.ones(20)/20, 'same') > 0.3))[0]
                if len(bright_idx) > 0:
                    x_start = bright_idx[0] / w * 100
                    x_end = bright_idx[-1] / w * 100
                    
                    bright_colors = arr[y, bright_idx[:20]]
                    avg_bright = bright_colors.mean(axis=0).astype(int)
                    
                    print(f"  y={y_pct:5.1f}%: {bright_on_dark:3d} bright px, x={x_start:.1f}%-{x_end:.1f}%, color={hex_color(*avg_bright)}")
    
    # ===================================================================
    # PART 5: CARD SURFACE COLOR PRECISION
    # ===================================================================
    print("\n" + "="*70)
    print("PART 5: CARD SURFACE COLORS (high precision)")
    print("="*70)
    
    # Sample large clean areas on each card
    # From the initial scan, the bright card surface appears around y=5-50%, x=25-80% area
    # And the dark card appears at y=55-85% or similar
    
    # Front card: sample where we see L>220 consistently
    print("\nSearching for pure card background areas (L>220, low variance):")
    for y_pct in range(5, 96, 3):
        for x_pct in range(5, 96, 10):
            y = int(h * y_pct / 100)
            x = int(w * x_pct / 100)
            region = arr[max(0,y-15):min(h,y+16), max(0,x-15):min(w,x+16)]
            region_gray = region.mean(axis=2)
            mean_L = region_gray.mean()
            std_L = region_gray.std()
            
            if mean_L > 220 and std_L < 5:  # Uniform bright area
                avg = region.reshape(-1, 3).mean(axis=0).astype(int)
                print(f"  ({x_pct:2d}%,{y_pct:2d}%) {hex_color(*avg)} L={mean_L:.0f} σ={std_L:.1f} ← BRIGHT CARD SURFACE")
    
    print("\nSearching for dark card background areas (L<60, low variance):")
    for y_pct in range(5, 96, 3):
        for x_pct in range(5, 96, 10):
            y = int(h * y_pct / 100)
            x = int(w * x_pct / 100)
            region = arr[max(0,y-15):min(h,y+16), max(0,x-15):min(w,x+16)]
            region_gray = region.mean(axis=2)
            mean_L = region_gray.mean()
            std_L = region_gray.std()
            
            if mean_L < 60 and std_L < 8:  # Uniform dark area
                avg = region.reshape(-1, 3).mean(axis=0).astype(int)
                print(f"  ({x_pct:2d}%,{y_pct:2d}%) {hex_color(*avg)} L={mean_L:.0f} σ={std_L:.1f} ← DARK CARD SURFACE")
    
    # ===================================================================
    # PART 6: IDENTIFY CARD OVERLAP ORDER
    # ===================================================================
    print("\n" + "="*70)
    print("PART 6: CARD OVERLAP & PERSPECTIVE")
    print("="*70)
    
    # Scan diagonally to understand card layout
    print("\nDiagonal scan (top-left to bottom-right):")
    for pct in range(0, 101, 2):
        x = int(w * pct / 100)
        y = int(h * pct / 100)
        if x < w and y < h:
            val = int(gray[y, x])
            color = arr[y, x]
            print(f"  ({pct:2d}%,{pct:2d}%) L={val:3d} {hex_color(*color)}")
    
    # ===================================================================
    # PART 7: HORIZONTAL SCAN AT CRITICAL Y POSITIONS
    # ===================================================================
    print("\n" + "="*70)
    print("PART 7: DETAILED HORIZONTAL PROFILES")
    print("="*70)
    
    # Based on where we found text rows, scan horizontally with fine detail
    # This will help us understand the card layout
    critical_y = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]
    
    for y_pct in critical_y:
        y = int(h * y_pct / 100)
        print(f"\n  y={y_pct}% brightness profile:")
        vals = []
        for x_pct in range(0, 101, 2):
            x = min(int(w * x_pct / 100), w-1)
            val = int(gray[y, x])
            vals.append((x_pct, val))
        
        # Show as compact brightness bar
        bar = ""
        for xp, v in vals:
            if v < 50: bar += "█"
            elif v < 100: bar += "▓"
            elif v < 150: bar += "▒"
            elif v < 200: bar += "░"
            else: bar += " "
        print(f"    |{bar}|")
        
        # Show min/max and transitions
        min_v = min(v for _, v in vals)
        max_v = max(v for _, v in vals)
        print(f"    min={min_v} max={max_v} range={max_v-min_v}")

    print("\n" + "="*70)
    print("ANALYSIS COMPLETE")
    print("="*70)

if __name__ == "__main__":
    analyze()
