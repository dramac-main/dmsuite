"""
Final precise analysis: extract exact card boundaries, text positions,
and cross-validate against the AI analysis.
"""
import sys, os
from PIL import Image
import numpy as np

def hex_color(r, g, b):
    return f"#{r:02x}{g:02x}{b:02x}"

def final_analysis(path):
    img = Image.open(path).convert("RGB")
    arr = np.array(img)
    h, w, _ = arr.shape
    gray = arr.mean(axis=2)
    
    print(f"Image: {w}x{h}px\n")
    
    # === 1. PRECISE CARD BOUNDARY DETECTION ===
    print("="*60)
    print("CARD BOUNDARY DETECTION")
    print("="*60)
    
    # Find where the upper card's top edge is
    # Scan from top, looking for where brightness jumps above background
    print("\nUpper card TOP edge (scanning x=60%, moving down):")
    for y in range(0, h//4):
        val = gray[y, int(w*0.60)]
        if val > 50:
            y_pct = y/h*100
            print(f"  First bright pixel at y={y}px ({y_pct:.1f}%) L={val:.0f}")
            break
    
    # Upper card LEFT edge
    print("Upper card LEFT edge (scanning y=10%, moving right):")
    for x in range(0, w):
        val = gray[int(h*0.10), x]
        if val > 50:
            x_pct = x/w*100
            print(f"  First bright pixel at x={x}px ({x_pct:.1f}%) L={val:.0f}")
            break
    
    # Upper card RIGHT edge
    print("Upper card RIGHT edge (scanning y=10%, moving left):")
    for x in range(w-1, 0, -1):
        val = gray[int(h*0.10), x]
        if val > 50:
            x_pct = x/w*100
            print(f"  Last bright pixel at x={x}px ({x_pct:.1f}%) L={val:.0f}")
            break
    
    # White card boundaries
    print("\nWhite card TOP edge (scanning x=70%, from y=30% down, looking for L>180):")
    for y in range(int(h*0.30), int(h*0.70)):
        val = gray[y, int(w*0.70)]
        if val > 180:
            y_pct = y/h*100
            print(f"  First bright pixel at y={y}px ({y_pct:.1f}%) L={val:.0f}")
            break
    
    print("White card BOTTOM edge (scanning x=50%, from y=80% up, looking for L>180):")
    for y in range(int(h*0.80), int(h*0.30), -1):
        val = gray[y, int(w*0.50)]
        if val > 180:
            y_pct = y/h*100
            print(f"  Last bright pixel at y={y}px ({y_pct:.1f}%) L={val:.0f}")
            break
    
    print("White card LEFT edge (scanning y=55%, from x=20% right, looking for L>180):")
    for x in range(int(w*0.20), int(w*0.80)):
        val = gray[int(h*0.55), x]
        if val > 180:
            x_pct = x/w*100
            print(f"  First bright pixel at x={x}px ({x_pct:.1f}%) L={val:.0f}")
            break
    
    print("White card RIGHT edge (scanning y=55%, from x=95% left, looking for L>180):")
    for x in range(int(w*0.95), int(w*0.30), -1):
        val = gray[int(h*0.55), x]
        if val > 180:
            x_pct = x/w*100
            print(f"  Last bright pixel at x={x}px ({x_pct:.1f}%) L={val:.0f}")
            break
    
    # === 2. CROSS-VALIDATE TEXT AT AI-PREDICTED LOCATIONS ===
    print("\n" + "="*60)
    print("TEXT VALIDATION AT AI-PREDICTED LOCATIONS")
    print("="*60)
    
    # The AI analysis placed text at these locations (relative to card face):
    # Name: ~75% from left, ~25% from top
    # Title: below name
    # Contact: below title
    # Logo: ~25% from left, ~75% from top
    
    # We need to map card-relative coords to image coords
    # Estimated white card bounds in image: x≈35-90%, y≈40-78%
    card_x1, card_x2 = 0.35, 0.90
    card_y1, card_y2 = 0.40, 0.78
    
    def card_to_image(cx, cy):
        """Convert card-relative (0-1) to image coordinates"""
        ix = card_x1 + cx * (card_x2 - card_x1)
        iy = card_y1 + cy * (card_y2 - card_y1)
        return int(ix * w), int(iy * h)
    
    print(f"\nEstimated card bounds in image: x={card_x1*100:.0f}-{card_x2*100:.0f}%, y={card_y1*100:.0f}-{card_y2*100:.0f}%")
    
    # Check name position (~75% from left, ~25% from top of card)
    test_points = [
        ("Name (card 75%,25%)", 0.75, 0.25),
        ("Name (card 70%,20%)", 0.70, 0.20),
        ("Name (card 65%,22%)", 0.65, 0.22),
        ("Title (card 75%,30%)", 0.75, 0.30),
        ("Title (card 70%,28%)", 0.70, 0.28),
        ("Contact line 1 (card 75%,38%)", 0.75, 0.38),
        ("Contact line 2 (card 75%,42%)", 0.75, 0.42),
        ("Contact line 3 (card 75%,46%)", 0.75, 0.46),
        ("Logo watermark (card 25%,75%)", 0.25, 0.75),
        ("Logo watermark (card 20%,80%)", 0.20, 0.80),
        ("Logo watermark (card 30%,70%)", 0.30, 0.70),
        ("Separator line (card 75%,27%)", 0.75, 0.27),
    ]
    
    for label, cx, cy in test_points:
        ix, iy = card_to_image(cx, cy)
        if 0 <= ix < w and 0 <= iy < h:
            region = arr[max(0,iy-2):iy+3, max(0,ix-2):ix+3]
            avg = region.reshape(-1, 3).mean(axis=0).astype(int)
            brightness = int(avg.mean())
            
            # Compare with local area (10px radius)
            local = arr[max(0,iy-10):iy+11, max(0,ix-10):ix+11]
            local_avg = local.reshape(-1, 3).mean(axis=0).astype(int)
            local_brightness = int(local_avg.mean())
            
            delta = brightness - local_brightness
            img_x_pct = ix/w*100
            img_y_pct = iy/h*100
            
            marker = ""
            if abs(delta) > 10:
                marker = " ← CONTRAST DETECTED"
            
            print(f"  {label:40s} img({img_x_pct:.0f}%,{img_y_pct:.0f}%) → {hex_color(*avg)} L={brightness} (local={local_brightness} Δ={delta:+d}){marker}")
    
    # === 3. UPPER CARD (FRONT) TEXT DETECTION ===
    print("\n" + "="*60)
    print("UPPER CARD (FRONT) - LOOKING FOR 'MUN' TEXT")
    print("="*60)
    
    # The upper card spans roughly x:30-96%, y:0-38%
    # "MUN" should be centered on this card
    # Card center: roughly x=63%, y=18%
    
    # Scan a very tight grid around the expected center
    print("\nUltra-fine scan around upper card center (x:45-80%, y:10-30%, 0.5% steps):")
    for y_pct_10 in range(100, 300, 5):  # 10.0% to 30.0%
        y_pct = y_pct_10 / 10
        y = int(h * y_pct / 100)
        row_values = []
        for x_pct_10 in range(450, 800, 5):  # 45.0% to 80.0%
            x_pct = x_pct_10 / 10
            x = int(w * x_pct / 100)
            val = gray[y, x]
            row_values.append((x_pct, val))
        
        # Find the min and max in this row
        vals = [v for _, v in row_values]
        min_val = min(vals)
        max_val = max(vals)
        range_val = max_val - min_val
        
        if range_val > 20:  # Significant variation = possible text
            dips = [(xp, int(v)) for xp, v in row_values if v < max_val - 15]
            if dips:
                print(f"  y={y_pct:.1f}% range={int(min_val)}-{int(max_val)} dips: {dips[:10]}")
    
    # === 4. CARD ASPECT RATIO DETECTION ===
    print("\n" + "="*60)
    print("CARD ASPECT RATIO & PERSPECTIVE")
    print("="*60)
    
    # Check if cards appear with standard 3.5:2 ratio
    # Upper card: scan horizontal extent at multiple y levels
    print("\nUpper card width at different heights:")
    for y_pct in [5, 10, 15, 20, 25, 30, 35]:
        y = int(h * y_pct / 100)
        row = gray[y]
        # Find leftmost and rightmost bright pixels
        bright_idx = np.where(row > 50)[0]
        if len(bright_idx) > 0:
            left = bright_idx[0]
            right = bright_idx[-1]
            width_px = right - left
            width_pct = width_px / w * 100
            print(f"  y={y_pct}%: x={left/w*100:.1f}% to x={right/w*100:.1f}% (width={width_pct:.1f}%, {width_px}px)")
    
    # White card: scan horizontal extent
    print("\nWhite card width at different heights:")
    for y_pct in [45, 50, 55, 60, 65, 70, 75]:
        y = int(h * y_pct / 100)
        row = gray[y]
        bright_idx = np.where(row > 150)[0]
        if len(bright_idx) > 0:
            left = bright_idx[0]
            right = bright_idx[-1]
            width_px = right - left
            width_pct = width_px / w * 100
            print(f"  y={y_pct}%: x={left/w*100:.1f}% to x={right/w*100:.1f}% (width={width_pct:.1f}%, {width_px}px)")
    
    # === 5. COLOR SAMPLING ON CARD FACES ===
    print("\n" + "="*60)
    print("PRECISE CARD SURFACE COLORS")
    print("="*60)
    
    # Upper card: sample a clean area (no text expected)
    clean_regions = {
        "Upper card center-right": (int(w*0.72), int(h*0.12), 20, 20),
        "Upper card center": (int(w*0.60), int(h*0.12), 20, 20),
        "Upper card center-left": (int(w*0.50), int(h*0.12), 20, 20),
        "White card top-center": (int(w*0.65), int(h*0.44), 20, 20),
        "White card center": (int(w*0.65), int(h*0.52), 20, 20),
        "White card lower-center": (int(w*0.55), int(h*0.65), 20, 20),
        "White card bottom area": (int(w*0.50), int(h*0.72), 20, 20),
    }
    
    for label, (cx, cy, rw, rh) in clean_regions.items():
        region = arr[cy-rh:cy+rh, cx-rw:cx+rw]
        avg = region.reshape(-1, 3).mean(axis=0).astype(int)
        std = region.reshape(-1, 3).std(axis=0)
        print(f"  {label:35s} → {hex_color(*avg)} R={avg[0]} G={avg[1]} B={avg[2]} std=({std[0]:.1f},{std[1]:.1f},{std[2]:.1f})")
    
    # === 6. GRADIENT ANALYSIS ON WHITE CARD ===
    print("\n" + "="*60)
    print("WHITE CARD GRADIENT / LIGHTING DIRECTION")
    print("="*60)
    
    # Sample corners of the white card
    corners = {
        "Top-left of white card": (int(w*0.45), int(h*0.43)),
        "Top-right of white card": (int(w*0.82), int(h*0.43)),
        "Center of white card": (int(w*0.63), int(h*0.55)),
        "Bottom-left of white card": (int(w*0.40), int(h*0.73)),
        "Bottom-right of white card": (int(w*0.75), int(h*0.68)),
    }
    
    for label, (cx, cy) in corners.items():
        region = arr[cy-5:cy+6, cx-5:cx+6]
        avg = region.reshape(-1, 3).mean(axis=0).astype(int)
        brightness = int(avg.mean())
        print(f"  {label:35s} → {hex_color(*avg)} L={brightness}")
    
    print("\nGradient direction: brightest corner → darkest corner indicates light source")

if __name__ == "__main__":
    path = os.path.join(r"d:\dramac-ai-suite\business-card-examples", sys.argv[1])
    final_analysis(path)
