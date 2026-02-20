"""
Ultra-targeted text and element finder for the MUN business card.
Focuses on the bright card regions and looks for dark text elements.
"""
import sys, os
from PIL import Image
import numpy as np

def hex_color(r, g, b):
    return f"#{r:02x}{g:02x}{b:02x}"

def analyze_card_elements(path):
    img = Image.open(path).convert("RGB")
    arr = np.array(img)
    h, w, _ = arr.shape
    gray = arr.mean(axis=2)
    
    print(f"Image: {w}x{h}px")
    
    # === CARD 1: The upper/background card (likely front side) ===
    # Based on zone analysis, this card spans roughly:
    # x: 35%-95%, y: 0%-38% (the darker gray area)
    print(f"\n{'='*60}")
    print("CARD 1 (UPPER/BACK CARD - likely FRONT side of card)")
    print(f"{'='*60}")
    
    # Sample the card surface at very fine resolution
    # This card appears as medium gray due to angle/lighting
    print("\nFine-grained sampling (2% steps):")
    for y_pct in range(2, 40, 2):
        row_info = []
        for x_pct in range(30, 98, 2):
            x = int(w * x_pct / 100)
            y = int(h * y_pct / 100)
            region = arr[max(0,y-1):y+2, max(0,x-1):x+2]
            avg = region.reshape(-1, 3).mean(axis=0).astype(int)
            brightness = int(avg.mean())
            row_info.append((x_pct, brightness, avg))
        
        # Only print if there's interesting variation
        brightnesses = [b for _, b, _ in row_info]
        if max(brightnesses) > 90:
            min_b = min(brightnesses)
            max_b = max(brightnesses)
            if max_b - min_b > 15:  # Has some variation (possible text)
                dark_spots = [(xp, b) for xp, b, _ in row_info if b < max_b - 20]
                if dark_spots:
                    print(f"  y={y_pct:2d}% range={min_b}-{max_b} dark_dips: {dark_spots}")
    
    # === CARD 2: The main visible card (likely back side) ===
    print(f"\n{'='*60}")
    print("CARD 2 (FRONT/MAIN CARD - likely BACK side of card)")
    print(f"{'='*60}")
    
    # This is the bright card, roughly x:35%-90%, y:38%-85%
    # Based on HIGH-RES SAMPLING, the brightest area is around:
    # x:55-85%, y:45-55% (L=240-254) — this is the card center
    
    # Let me do an extremely fine scan of the bright card region
    print("\nDetailed scan of bright card area (1% steps):")
    for y_pct in range(38, 85, 1):
        y = int(h * y_pct / 100)
        row_data = []
        for x_pct in range(30, 95, 1):
            x = int(w * x_pct / 100)
            region = arr[max(0,y-1):y+2, max(0,x-1):x+2]
            avg = region.reshape(-1, 3).mean(axis=0).astype(int)
            brightness = int(avg.mean())
            row_data.append((x_pct, brightness))
        
        # Find local dark spots (text) within bright regions
        # Look for pixels that are significantly darker than their neighbors
        bright_data = [(xp, b) for xp, b in row_data if b > 150]
        if bright_data:
            local_avg = sum(b for _, b in bright_data) / len(bright_data)
            anomalies = [(xp, b) for xp, b in bright_data if b < local_avg - 30]
            if anomalies:
                print(f"  y={y_pct}% avg_L={local_avg:.0f} TEXT_CANDIDATES: {anomalies}")
    
    # === Specific text region analysis ===
    # Based on the AI analysis, the back side has:
    # - Name at ~75% from left, ~25% from top
    # - Title below name
    # - Contact info below that
    # - Logo at ~25% from left, ~75% from top
    
    print(f"\n{'='*60}")
    print("SPECIFIC REGION DEEP DIVES")
    print(f"{'='*60}")
    
    # Region where name should be (upper right of card face)
    # Card face appears to be roughly x:40-90%, y:40-75%
    # Name region: upper-right of card face
    regions = {
        "Name region (x:65-85%, y:45-52%)": (65, 85, 45, 52),
        "Title region (x:65-85%, y:52-56%)": (65, 85, 52, 56),
        "Contact region (x:65-85%, y:56-65%)": (65, 85, 56, 65),
        "Logo region (x:40-55%, y:65-80%)": (40, 55, 65, 80),
        "Center of card (x:55-75%, y:48-55%)": (55, 75, 48, 55),
        "Upper card center (x:45-75%, y:10-25%)": (45, 75, 10, 25),
    }
    
    for label, (x1, x2, y1, y2) in regions.items():
        px1, px2 = int(w*x1/100), int(w*x2/100)
        py1, py2 = int(h*y1/100), int(h*y2/100)
        region = arr[py1:py2, px1:px2]
        region_gray = gray[py1:py2, px1:px2]
        
        avg = region.reshape(-1, 3).mean(axis=0).astype(int)
        brightness = int(avg.mean())
        std = region.reshape(-1, 3).std(axis=0).mean()
        dark_pct = (region_gray < 120).sum() / region_gray.size * 100
        very_dark_pct = (region_gray < 80).sum() / region_gray.size * 100
        
        print(f"\n  {label}")
        print(f"    Avg: {hex_color(*avg)} L={brightness}")
        print(f"    Std: {std:.1f}")
        print(f"    Dark pixels (<120): {dark_pct:.1f}%")
        print(f"    Very dark pixels (<80): {very_dark_pct:.1f}%")
        
        # Sample specific points within region
        rh, rw = region.shape[:2]
        for ry_pct in [10, 30, 50, 70, 90]:
            for rx_pct in [10, 30, 50, 70, 90]:
                rx = int(rw * rx_pct / 100)
                ry = int(rh * ry_pct / 100)
                point = region[max(0,ry-1):ry+2, max(0,rx-1):rx+2]
                pavg = point.reshape(-1, 3).mean(axis=0).astype(int)
                pb = int(pavg.mean())
                abs_x = x1 + (x2-x1)*rx_pct/100
                abs_y = y1 + (y2-y1)*ry_pct/100
                if pb < 200:  # Only show non-white pixels
                    print(f"      ({abs_x:.0f}%,{abs_y:.0f}%) → {hex_color(*pavg)} L={pb}")
    
    # === LINE/SEPARATOR DETECTION ===
    print(f"\n{'='*60}")
    print("HORIZONTAL LINE DETECTION (thin dark horizontal features)")
    print(f"{'='*60}")
    
    # Scan within the bright card area for thin horizontal dark lines
    for y_pct in range(40, 80):
        y = int(h * y_pct / 100)
        # Check a horizontal strip 3px tall
        strip = gray[max(0,y-1):y+2, int(w*0.40):int(w*0.90)]
        strip_avg = strip.mean()
        # Compare with lines above and below (5px away)
        above = gray[max(0,y-6):max(0,y-3), int(w*0.40):int(w*0.90)].mean()
        below = gray[min(h-1,y+3):min(h-1,y+6), int(w*0.40):int(w*0.90)].mean()
        
        if strip_avg < above - 15 and strip_avg < below - 15:
            print(f"  y={y_pct}% strip_L={strip_avg:.0f} vs above={above:.0f} below={below:.0f} → POSSIBLE LINE")
    
    # === DETECT THE FRONT CARD "MUN" TEXT ===
    print(f"\n{'='*60}")
    print("FRONT CARD ANALYSIS (upper card in mockup)")
    print(f"{'='*60}")
    
    # The front card seems to be in the upper half of the image
    # It appears as a medium gray card (due to perspective/different lighting)
    # zones [0,3]-[1,7] averaged L=94-117
    # Let me scan for text within this region
    
    for y_pct in range(5, 38, 1):
        y = int(h * y_pct / 100)
        for x_pct in range(40, 90, 1):
            x = int(w * x_pct / 100)
            point = arr[max(0,y-1):y+2, max(0,x-1):x+2]
            pavg = point.reshape(-1, 3).mean(axis=0).astype(int)
            brightness = int(pavg.mean())
            # In a gray card (~L=110), text would be darker (~L=60-80)
            # or lighter (~L=140+)
            neighbors = gray[max(0,y-5):y+6, max(0,x-5):x+6]
            local_avg = neighbors.mean()
            if abs(brightness - local_avg) > 15 and local_avg > 90:
                if brightness < local_avg - 15:
                    pass  # Collect these for text detection
    
    # Simpler approach: find contiguous dark bands in the upper card
    print("\nRow-by-row contrast analysis (upper card y=5-38%, x=40-90%):")
    for y_pct in range(5, 38):
        y = int(h * y_pct / 100)
        strip = gray[y, int(w*0.40):int(w*0.90)]
        avg = strip.mean()
        std = strip.std()
        min_val = strip.min()
        
        # Above average std = high contrast = possible text row
        if std > 12:
            print(f"  y={y_pct}% avg_L={avg:.0f} std={std:.1f} min={min_val:.0f} → HIGH CONTRAST")

if __name__ == "__main__":
    path = os.path.join(r"d:\dramac-ai-suite\business-card-examples", sys.argv[1])
    analyze_card_elements(path)
