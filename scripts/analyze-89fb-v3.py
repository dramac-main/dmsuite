"""
Final precision analysis of 89fb07c3dc093631d699d53a56173205.jpg
Extract exact text element positions and character shapes
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
    
    # ===================================================================
    # FRONT CARD precise bounds (bright card, upper half)
    # ===================================================================
    print("="*70)
    print("FRONT CARD (BRIGHT) — PRECISE BOUNDARIES")
    print("="*70)
    
    # Card surface is #eae8eb (L=234). Find exact edges.
    # Top edge: scan down at x=50% looking for L>220
    for y in range(h):
        if gray[y, w//2] > 220:
            front_top = y
            print(f"Front top: y={y}px ({y/h*100:.1f}%)")
            break
    
    # Bottom edge: scan down from center looking for L<180
    for y in range(front_top + 10, h):
        if gray[y, w//2] < 180:
            front_bottom = y - 1
            print(f"Front bottom: y={front_bottom}px ({front_bottom/h*100:.1f}%)")
            break
    
    # Left edge: scan right at center of card
    front_mid_y = (front_top + front_bottom) // 2
    for x in range(w):
        if gray[front_mid_y, x] > 220:
            front_left = x
            print(f"Front left: x={x}px ({x/w*100:.1f}%)")
            break
    
    # Right edge: scan left
    for x in range(w-1, 0, -1):
        if gray[front_mid_y, x] > 220:
            front_right = x
            print(f"Front right: x={x}px ({x/w*100:.1f}%)")
            break
    
    fw = front_right - front_left
    fh = front_bottom - front_top
    print(f"\nFront card: {fw}x{fh}px, aspect ratio: {fw/fh:.4f}")
    print(f"Standard 3.5x2 ratio = {3.5/2:.4f}")
    
    # ===================================================================
    # FRONT CARD — TEXT ELEMENT EXTRACTION
    # ===================================================================
    print("\n" + "="*70)
    print("FRONT CARD — ALL TEXT/GRAPHIC ELEMENTS")
    print("="*70)
    
    # Extract the front card region
    front = gray[front_top:front_bottom, front_left:front_right]
    front_rgb = arr[front_top:front_bottom, front_left:front_right]
    
    # Create dark element mask
    bg_val = np.median(front)
    thresh = bg_val - 30
    dark = front < thresh
    
    print(f"Background brightness: {bg_val:.0f}")
    print(f"Dark threshold: {thresh:.0f}")
    print(f"Dark pixels: {dark.sum()} ({dark.sum()/(fw*fh)*100:.1f}%)")
    
    # Find connected horizontal bands of dark pixels (text lines)
    row_density = dark.sum(axis=1) / fw * 100
    
    # Identify contiguous text bands
    in_band = False
    bands = []
    for y in range(fh):
        if row_density[y] > 0.2 and not in_band:
            band_start = y
            in_band = True
        elif row_density[y] < 0.2 and in_band:
            bands.append((band_start, y))
            in_band = False
    if in_band:
        bands.append((band_start, fh))
    
    print(f"\nFound {len(bands)} text/element bands:")
    for i, (bs, be) in enumerate(bands):
        bh = be - bs
        # Find x extent
        band_dark = dark[bs:be]
        cols = np.where(band_dark.any(axis=0))[0]
        if len(cols) == 0:
            continue
        x_start = cols[0]
        x_end = cols[-1]
        bw = x_end - x_start
        
        # Sample color at densest point
        densest_row = bs + band_dark.sum(axis=1).argmax()
        densest_cols = np.where(dark[densest_row])[0]
        if len(densest_cols) > 0:
            mid_col = densest_cols[len(densest_cols)//2]
            color = front_rgb[densest_row, mid_col]
        else:
            color = np.array([0,0,0])
        
        # Position as % of card
        y_center_pct = ((bs+be)/2) / fh * 100
        x_center_pct = ((x_start+x_end)/2) / fw * 100
        h_pct = bh / fh * 100
        w_pct = bw / fw * 100
        
        # Classify
        if h_pct > 12:
            element_type = "LARGE MONOGRAM"
        elif h_pct > 5:
            element_type = "HEADING"
        elif h_pct > 2:
            element_type = "SUBHEADING/NAME"
        elif h_pct > 1:
            element_type = "BODY TEXT"
        else:
            element_type = "SMALL TEXT/LINE"
        
        print(f"\n  Band {i+1}: [{element_type}]")
        print(f"    Y: {bs/fh*100:.1f}% to {be/fh*100:.1f}% (height: {h_pct:.1f}%, center: {y_center_pct:.1f}%)")
        print(f"    X: {x_start/fw*100:.1f}% to {x_end/fw*100:.1f}% (width: {w_pct:.1f}%, center: {x_center_pct:.1f}%)")
        print(f"    Pixels: {bw}x{bh}px")
        print(f"    Color: {hex_color(*color)} R={color[0]} G={color[1]} B={color[2]}")
        
        # For large elements, analyze internal structure
        if h_pct > 8:
            print(f"\n    === INTERNAL STRUCTURE ===")
            
            # Find vertical gaps between characters
            col_profile = band_dark.sum(axis=0)
            # Scan from x_start to x_end for gaps
            gaps = []
            in_gap = False
            for x in range(x_start, x_end):
                if col_profile[x] < bh * 0.03:  # Less than 3% filled
                    if not in_gap:
                        gap_start = x
                        in_gap = True
                elif in_gap:
                    gap_w = x - gap_start
                    if gap_w > 3:
                        gaps.append((gap_start, x))
                    in_gap = False
            
            if gaps:
                # Characters = segments between gaps
                segments = []
                prev_end = x_start
                for gs, ge in gaps:
                    if gs > prev_end:
                        segments.append((prev_end, gs))
                    prev_end = ge
                if prev_end < x_end:
                    segments.append((prev_end, x_end))
                
                print(f"    Found {len(segments)} characters with {len(gaps)} gap(s):")
                for j, (sx, ex) in enumerate(segments):
                    sw = ex - sx
                    print(f"      Char {j+1}: x={sx/fw*100:.1f}%-{ex/fw*100:.1f}% (width={sw/fw*100:.1f}%)")
                    
                    # Stroke width analysis
                    char_dark = band_dark[:, sx:ex]
                    strokes = []
                    for y_off in range(0, bh, max(1, bh//15)):
                        row = char_dark[y_off]
                        runs = []
                        in_run = False
                        for x_off in range(len(row)):
                            if row[x_off] and not in_run:
                                rs = x_off
                                in_run = True
                            elif not row[x_off] and in_run:
                                runs.append(x_off - rs)
                                in_run = False
                        if in_run:
                            runs.append(len(row) - rs)
                        strokes.extend(runs)
                    
                    if strokes:
                        print(f"        Stroke widths: min={min(strokes)}px, max={max(strokes)}px, ratio={max(strokes)/max(min(strokes),1):.1f}x")
                
                for j, (gs, ge) in enumerate(gaps):
                    gw = ge - gs
                    print(f"      Gap {j+1}: x={gs/fw*100:.1f}%-{ge/fw*100:.1f}% (width={gw}px, {gw/fw*100:.2f}%)")
            else:
                print(f"    No clear gaps found — may be single character or overlapping")
                
                # Still do stroke analysis
                char_dark = band_dark[:, x_start:x_end]
                all_strokes = []
                for y_off in range(0, bh, max(1, bh//20)):
                    row = char_dark[y_off]
                    runs = []
                    in_run = False
                    for x_off in range(len(row)):
                        if row[x_off] and not in_run:
                            rs = x_off
                            in_run = True
                        elif not row[x_off] and in_run:
                            runs.append(x_off - rs)
                            in_run = False
                    if in_run:
                        runs.append(len(row) - rs)
                    all_strokes.extend(runs)
                
                if all_strokes:
                    print(f"    Overall stroke widths: min={min(all_strokes)}px, max={max(all_strokes)}px, avg={sum(all_strokes)/len(all_strokes):.1f}px, ratio={max(all_strokes)/max(min(all_strokes),1):.1f}x")
                    
                    # Serif check: compare top/bottom row widths to middle
                    top_fill = band_dark[:max(3, bh//15), x_start:x_end].sum(axis=1).max()
                    mid_fill = band_dark[bh//2-1:bh//2+2, x_start:x_end].sum(axis=1).max()
                    bot_fill = band_dark[-max(3, bh//15):, x_start:x_end].sum(axis=1).max()
                    print(f"    Serif indicator: top_fill={top_fill}, mid_fill={mid_fill}, bot_fill={bot_fill}")
                    if top_fill > mid_fill * 1.2 or bot_fill > mid_fill * 1.2:
                        print(f"    → SERIF characteristics detected")
    
    # ===================================================================
    # FRONT CARD — FINE GRAINED SCAN for separator lines
    # ===================================================================
    print("\n" + "="*70)
    print("FRONT CARD — SEPARATOR LINES")
    print("="*70)
    
    for y in range(fh):
        row = dark[y]
        dark_count = row.sum()
        if dark_count > fw * 0.05:  # At least 5% of card width
            # Check if it's isolated (thin line)
            neighbors = sum(dark[max(0,y-2):y].sum(axis=1).mean() if y > 2 else 0 for _ in [1])
            neighbors += sum(dark[y+1:min(fh,y+3)].sum(axis=1).mean() if y < fh-3 else 0 for _ in [1])
            
            # Check if this row is much wider than neighbors
            above = dark[max(0,y-5):y].sum(axis=1).mean() if y > 5 else 0
            below = dark[y+1:min(fh,y+6)].sum(axis=1).mean() if y < fh-6 else 0
            
            if dark_count > above * 2 and dark_count > below * 2 and dark_count < fw * 0.5:
                cols = np.where(row)[0]
                x1 = cols[0] / fw * 100
                x2 = cols[-1] / fw * 100
                y_pct = y / fh * 100
                print(f"  Possible line at y={y_pct:.1f}%: x={x1:.1f}%-{x2:.1f}% ({dark_count}px, above={above:.0f}, below={below:.0f})")
    
    # ===================================================================
    # BACK CARD precise bounds
    # ===================================================================
    print("\n" + "="*70)
    print("BACK CARD (DARK) — PRECISE BOUNDARIES")
    print("="*70)
    
    # Find the dark card region
    # Scan down from center for L<60
    for y in range(front_bottom, h):
        if gray[y, w//2] < 60:
            back_top = y
            print(f"Back top: y={y}px ({y/h*100:.1f}%)")
            break
    
    # Bottom edge
    for y in range(h-1, back_top, -1):
        if gray[y, w//2] < 60:
            back_bottom = y
            print(f"Back bottom: y={y}px ({y/h*100:.1f}%)")
            break
    
    # Left edge
    back_mid_y = (back_top + back_bottom) // 2
    for x in range(w):
        if gray[back_mid_y, x] < 60:
            back_left = x
            print(f"Back left: x={x}px ({x/w*100:.1f}%)")
            break
    
    for x in range(w-1, 0, -1):
        if gray[back_mid_y, x] < 60:
            back_right = x
            print(f"Back right: x={x}px ({x/w*100:.1f}%)")
            break
    
    bw_card = back_right - back_left
    bh_card = back_bottom - back_top
    print(f"\nBack card: {bw_card}x{bh_card}px, aspect ratio: {bw_card/bh_card:.4f}")
    
    # ===================================================================
    # BACK CARD — TEXT/MONOGRAM ELEMENTS
    # ===================================================================
    print("\n" + "="*70)
    print("BACK CARD — ALL ELEMENTS")
    print("="*70)
    
    back = gray[back_top:back_bottom, back_left:back_right]
    back_rgb = arr[back_top:back_bottom, back_left:back_right]
    
    bg_val_back = np.median(back)
    thresh_back = bg_val_back + 30
    bright = back > thresh_back
    
    print(f"Background brightness: {bg_val_back:.0f}")
    print(f"Bright threshold: {thresh_back:.0f}")
    print(f"Bright pixels: {bright.sum()} ({bright.sum()/(bw_card*bh_card)*100:.1f}%)")
    
    # Find text bands
    row_density_back = bright.sum(axis=1) / bw_card * 100
    
    in_band = False
    back_bands = []
    for y in range(bh_card):
        if row_density_back[y] > 0.2 and not in_band:
            band_start = y
            in_band = True
        elif row_density_back[y] < 0.2 and in_band:
            back_bands.append((band_start, y))
            in_band = False
    if in_band:
        back_bands.append((band_start, bh_card))
    
    print(f"\nFound {len(back_bands)} bright element bands:")
    for i, (bs, be) in enumerate(back_bands):
        bh_b = be - bs
        band_bright = bright[bs:be]
        cols = np.where(band_bright.any(axis=0))[0]
        if len(cols) == 0:
            continue
        x_start = cols[0]
        x_end = cols[-1]
        bw_b = x_end - x_start
        
        # Sample color
        densest_row = bs + band_bright.sum(axis=1).argmax()
        densest_cols = np.where(bright[densest_row])[0]
        if len(densest_cols) > 0:
            mid_col = densest_cols[len(densest_cols)//2]
            color = back_rgb[densest_row, mid_col]
        else:
            color = np.array([255,255,255])
        
        y_center_pct = ((bs+be)/2) / bh_card * 100
        x_center_pct = ((x_start+x_end)/2) / bw_card * 100
        h_pct = bh_b / bh_card * 100
        w_pct = bw_b / bw_card * 100
        
        if h_pct > 12:
            etype = "LARGE MONOGRAM"
        elif h_pct > 5:
            etype = "HEADING"
        elif h_pct > 2:
            etype = "SUBHEADING"
        elif h_pct > 1:
            etype = "BODY TEXT"
        else:
            etype = "SMALL TEXT/LINE"
        
        print(f"\n  Band {i+1}: [{etype}]")
        print(f"    Y: {bs/bh_card*100:.1f}% to {be/bh_card*100:.1f}% (height: {h_pct:.1f}%, center: {y_center_pct:.1f}%)")
        print(f"    X: {x_start/bw_card*100:.1f}% to {x_end/bw_card*100:.1f}% (width: {w_pct:.1f}%, center: {x_center_pct:.1f}%)")
        print(f"    Pixels: {bw_b}x{bh_b}px")
        print(f"    Color: {hex_color(*color)} R={color[0]} G={color[1]} B={color[2]}")
        
        # Internal structure for large elements
        if h_pct > 8:
            col_profile = band_bright.sum(axis=0)
            
            # Find gaps
            gaps = []
            in_gap = False
            for x in range(x_start, x_end):
                if col_profile[x] < bh_b * 0.03:
                    if not in_gap:
                        gap_start = x
                        in_gap = True
                elif in_gap:
                    gap_w = x - gap_start
                    if gap_w > 3:
                        gaps.append((gap_start, x))
                    in_gap = False
            
            if gaps:
                segments = []
                prev_end = x_start
                for gs, ge in gaps:
                    if gs > prev_end:
                        segments.append((prev_end, gs))
                    prev_end = ge
                if prev_end < x_end:
                    segments.append((prev_end, x_end))
                
                print(f"\n    === CHARACTERS ===")
                print(f"    Found {len(segments)} character(s), {len(gaps)} gap(s)")
                for j, (sx, ex) in enumerate(segments):
                    sw = ex - sx
                    char_bright = band_bright[:, sx:ex]
                    fill = char_bright.sum() / (bh_b * sw) * 100 if sw > 0 else 0
                    print(f"      Char {j+1}: x={sx/bw_card*100:.1f}%-{ex/bw_card*100:.1f}% (w={sw/bw_card*100:.1f}%), fill={fill:.0f}%")
                    
                    # Stroke analysis
                    strokes = []
                    for y_off in range(0, bh_b, max(1, bh_b//15)):
                        row = char_bright[y_off]
                        runs = []
                        in_run = False
                        for x_off in range(len(row)):
                            if row[x_off] and not in_run:
                                rs = x_off
                                in_run = True
                            elif not row[x_off] and in_run:
                                runs.append(x_off - rs)
                                in_run = False
                        if in_run:
                            runs.append(len(row) - rs)
                        strokes.extend(runs)
                    
                    if strokes:
                        print(f"        Strokes: min={min(strokes)}px max={max(strokes)}px ratio={max(strokes)/max(min(strokes),1):.1f}x")
    
    # ===================================================================
    # PRECISE FRONT CARD ELEMENT POSITIONS (for Canvas2D)
    # ===================================================================
    print("\n" + "="*70)
    print("CANVAS2D POSITIONING GUIDE (all % of card dimensions)")
    print("="*70)
    
    print(f"\nFront card surface: {hex_color(*front_rgb[fh//4, fw//2])}")
    print(f"Front card dimensions (px within mockup): {fw}x{fh}")
    
    print(f"\nBack card surface: {hex_color(*back_rgb[bh_card//4, bw_card//2])}")
    print(f"Back card dimensions (px within mockup): {bw_card}x{bh_card}")
    
    # Edge colors (check for any border/edge treatment)
    print("\n  Front card edge colors:")
    print(f"    Top edge center: {hex_color(*arr[front_top, w//2])}")
    print(f"    Bottom edge center: {hex_color(*arr[front_bottom, w//2])}")
    print(f"    Left edge center: {hex_color(*arr[front_mid_y, front_left])}")
    print(f"    Right edge center: {hex_color(*arr[front_mid_y, front_right])}")
    
    # ===================================================================
    # COLOR OF EVERY VISIBLE TEXT ELEMENT
    # ===================================================================
    print("\n" + "="*70)
    print("ELEMENT COLOR DEEP SAMPLING")
    print("="*70)
    
    # For each front band, sample multiple points
    print("\nFront card element colors (multiple samples per band):")
    for i, (bs, be) in enumerate(bands):
        band_dark = dark[bs:be]
        cols = np.where(band_dark.any(axis=0))[0]
        if len(cols) == 0:
            continue
        
        # Sample 5 points across the band
        sample_xs = cols[::max(1, len(cols)//5)][:5]
        colors = []
        for sx in sample_xs:
            # Find a dark pixel in this column
            col_dark = np.where(dark[bs:be, sx])[0]
            if len(col_dark) > 0:
                sy = bs + col_dark[len(col_dark)//2]
                c = front_rgb[sy, sx]
                colors.append(c)
        
        if colors:
            avg_color = np.mean(colors, axis=0).astype(int)
            print(f"  Band {i+1}: avg={hex_color(*avg_color)} samples={[hex_color(*c) for c in colors]}")
    
    print("\nBack card element colors (multiple samples per band):")
    for i, (bs, be) in enumerate(back_bands):
        band_bright_b = bright[bs:be]
        cols = np.where(band_bright_b.any(axis=0))[0]
        if len(cols) == 0:
            continue
        
        sample_xs = cols[::max(1, len(cols)//5)][:5]
        colors = []
        for sx in sample_xs:
            col_bright_b = np.where(bright[bs:be, sx])[0]
            if len(col_bright_b) > 0:
                sy = bs + col_bright_b[len(col_bright_b)//2]
                c = back_rgb[sy, sx]
                colors.append(c)
        
        if colors:
            avg_color = np.mean(colors, axis=0).astype(int)
            print(f"  Band {i+1}: avg={hex_color(*avg_color)} samples={[hex_color(*c) for c in colors]}")
    
    print("\n" + "="*70)
    print("DONE")
    print("="*70)

if __name__ == "__main__":
    analyze()
