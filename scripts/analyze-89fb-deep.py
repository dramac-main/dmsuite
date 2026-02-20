"""
Ultra-deep visual analysis of 89fb07c3dc093631d699d53a56173205.jpg
(The SH monogram luxury serif business card)
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
    
    print(f"Image dimensions: {w}x{h}px")
    print(f"Aspect ratio: {w/h:.4f}")
    
    # ===================================================================
    # SECTION 1: OVERALL SCENE ANALYSIS
    # ===================================================================
    print("\n" + "="*70)
    print("SECTION 1: OVERALL SCENE / BACKGROUND")
    print("="*70)
    
    # Sample corners and edges for scene background
    bg_samples = {
        "Top-left corner (5%,5%)": (int(w*0.05), int(h*0.05)),
        "Top-right corner (95%,5%)": (int(w*0.95), int(h*0.05)),
        "Bottom-left corner (5%,95%)": (int(w*0.05), int(h*0.95)),
        "Bottom-right corner (95%,95%)": (int(w*0.95), int(h*0.95)),
        "Center (50%,50%)": (int(w*0.50), int(h*0.50)),
        "Left edge (3%,50%)": (int(w*0.03), int(h*0.50)),
        "Right edge (97%,50%)": (int(w*0.97), int(h*0.50)),
        "Top edge (50%,3%)": (int(w*0.50), int(h*0.03)),
        "Bottom edge (50%,97%)": (int(w*0.50), int(h*0.97)),
    }
    
    for label, (cx, cy) in bg_samples.items():
        region = arr[max(0,cy-8):cy+9, max(0,cx-8):cx+9]
        avg = region.reshape(-1, 3).mean(axis=0).astype(int)
        brightness = int(avg.mean())
        print(f"  {label:40s} → {hex_color(*avg)} R={avg[0]} G={avg[1]} B={avg[2]} L={brightness}")
    
    # ===================================================================
    # SECTION 2: CARD BOUNDARY DETECTION - TWO CARDS
    # ===================================================================
    print("\n" + "="*70)
    print("SECTION 2: CARD BOUNDARY DETECTION")
    print("="*70)
    
    # Detect if there are two distinct card regions
    # Scan down center column to find brightness transitions
    print("\nVertical brightness profile down center (x=50%):")
    x_center = int(w * 0.50)
    prev_bright = None
    transitions = []
    for y_pct_10 in range(0, 1000, 5):
        y_pct = y_pct_10 / 10
        y = int(h * y_pct / 100)
        if y >= h: break
        val = int(gray[y, x_center])
        is_bright = val > 100
        if prev_bright is not None and is_bright != prev_bright:
            transitions.append((y_pct, val, "dark→bright" if is_bright else "bright→dark"))
        prev_bright = is_bright
    
    for yp, v, desc in transitions:
        print(f"  Transition at y={yp:.1f}%: L={v} ({desc})")
    
    # Scan at multiple x positions for card edges
    print("\nHorizontal card edge detection:")
    for scan_y_pct in [10, 20, 30, 40, 50, 60, 70, 80, 90]:
        y = int(h * scan_y_pct / 100)
        row = gray[y]
        # Find first/last pixel above threshold
        for thresh_name, thresh in [("L>80", 80), ("L>150", 150), ("L>200", 200)]:
            bright_idx = np.where(row > thresh)[0]
            if len(bright_idx) > 10:
                left = bright_idx[0]
                right = bright_idx[-1]
                print(f"  y={scan_y_pct}% {thresh_name}: x={left/w*100:.1f}% to {right/w*100:.1f}% (width={((right-left)/w*100):.1f}%)")
    
    # ===================================================================
    # SECTION 3: UPPER CARD (BACK SIDE - DARK)
    # ===================================================================
    print("\n" + "="*70)
    print("SECTION 3: UPPER CARD (BACK SIDE) ANALYSIS")
    print("="*70)
    
    # Find the upper card boundaries precisely
    print("\nUpper card boundary scan:")
    
    # Top edge - scan down at x=50%
    for y in range(0, h//3):
        val = int(gray[y, int(w*0.50)])
        if val > 40:
            print(f"  Top edge: y={y}px ({y/h*100:.1f}%) L={val}")
            upper_top = y
            break
    
    # Bottom edge of upper card - scan down from center looking for brightness drop
    upper_bottom = None
    for y in range(int(h*0.30), int(h*0.55)):
        val = int(gray[y, int(w*0.50)])
        if val < 40:
            print(f"  Bottom edge: y={y}px ({y/h*100:.1f}%) L={val}")
            upper_bottom = y
            break
    
    # Left edge
    for x in range(0, w//2):
        val = int(gray[int(h*0.15), x])
        if val > 40:
            print(f"  Left edge: x={x}px ({x/w*100:.1f}%)")
            upper_left = x
            break
    
    # Right edge
    for x in range(w-1, w//2, -1):
        val = int(gray[int(h*0.15), x])
        if val > 40:
            print(f"  Right edge: x={x}px ({x/w*100:.1f}%)")
            upper_right = x
            break
    
    # Surface color of upper card
    print("\nUpper card surface colors (sampling clean areas):")
    upper_center_y = int(h * 0.20)
    for x_pct in [35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85]:
        x = int(w * x_pct / 100)
        region = arr[upper_center_y-5:upper_center_y+6, x-5:x+6]
        avg = region.reshape(-1, 3).mean(axis=0).astype(int)
        brightness = int(avg.mean())
        print(f"  x={x_pct}% → {hex_color(*avg)} L={brightness}")
    
    # Detect text/monogram on upper card (bright elements on dark)
    print("\nUpper card text detection (bright spots on dark background):")
    print("  Scanning for pixels with L > 150 on upper card...")
    
    # Create a mask of bright pixels in the upper card region
    if upper_bottom:
        upper_region = gray[upper_top:upper_bottom, upper_left:upper_right]
        bright_mask = upper_region > 150
        
        # Find bounding box of bright pixels (likely the monogram/text)
        bright_coords = np.where(bright_mask)
        if len(bright_coords[0]) > 0:
            min_y = bright_coords[0].min()
            max_y = bright_coords[0].max()
            min_x = bright_coords[1].min()
            max_x = bright_coords[1].max()
            
            card_h = upper_bottom - upper_top
            card_w = upper_right - upper_left
            
            print(f"  Bright region bounding box (relative to upper card):")
            print(f"    X: {min_x/card_w*100:.1f}% to {max_x/card_w*100:.1f}% (width: {(max_x-min_x)/card_w*100:.1f}%)")
            print(f"    Y: {min_y/card_h*100:.1f}% to {max_y/card_h*100:.1f}% (height: {(max_y-min_y)/card_h*100:.1f}%)")
            print(f"    Center: ({(min_x+max_x)/2/card_w*100:.1f}%, {(min_y+max_y)/2/card_h*100:.1f}%)")
            
            # Sample the actual colors of the bright elements
            bright_pixels = arr[upper_top:upper_bottom, upper_left:upper_right][bright_mask]
            avg_bright = bright_pixels.mean(axis=0).astype(int)
            print(f"  Average bright element color: {hex_color(*avg_bright)} R={avg_bright[0]} G={avg_bright[1]} B={avg_bright[2]}")
            
            # Check for multiple text clusters (monogram + name text)
            # Split into horizontal slices
            print("\n  Horizontal density profile (bright pixels per row band):")
            for band_start_pct in range(0, 100, 5):
                band_start = int(card_h * band_start_pct / 100)
                band_end = int(card_h * (band_start_pct + 5) / 100)
                band = bright_mask[band_start:band_end]
                density = band.sum() / band.size * 100 if band.size > 0 else 0
                if density > 0.5:
                    # Find x range in this band
                    band_coords = np.where(band)
                    if len(band_coords[1]) > 0:
                        bx_min = band_coords[1].min() / card_w * 100
                        bx_max = band_coords[1].max() / card_w * 100
                        print(f"    y={band_start_pct}-{band_start_pct+5}%: density={density:.1f}%, x-range: {bx_min:.1f}%-{bx_max:.1f}%")
            
            # Vertical density profile 
            print("\n  Vertical density profile (bright pixels per column band):")
            for band_start_pct in range(0, 100, 5):
                band_start = int(card_w * band_start_pct / 100)
                band_end = int(card_w * (band_start_pct + 5) / 100)
                band = bright_mask[:, band_start:band_end]
                density = band.sum() / band.size * 100 if band.size > 0 else 0
                if density > 0.5:
                    print(f"    x={band_start_pct}-{band_start_pct+5}%: density={density:.1f}%")
    
    # ===================================================================
    # SECTION 4: LOWER CARD (FRONT SIDE - LIGHT)
    # ===================================================================
    print("\n" + "="*70)
    print("SECTION 4: LOWER CARD (FRONT SIDE) ANALYSIS")
    print("="*70)
    
    # Find the lower card boundaries
    print("\nLower card boundary scan:")
    
    # Top edge - scan from y=35% down looking for bright area
    lower_top = None
    for y in range(int(h*0.35), int(h*0.60)):
        val = int(gray[y, int(w*0.60)])
        if val > 180:
            print(f"  Top edge: y={y}px ({y/h*100:.1f}%) L={val}")
            lower_top = y
            break
    
    # Bottom edge
    lower_bottom = None
    for y in range(h-1, int(h*0.60), -1):
        val = int(gray[y, int(w*0.55)])
        if val > 150:
            print(f"  Bottom edge: y={y}px ({y/h*100:.1f}%) L={val}")
            lower_bottom = y
            break
    
    # Left edge
    lower_left = None
    for x in range(0, w):
        val = int(gray[int(h*0.60), x])
        if val > 150:
            print(f"  Left edge: x={x}px ({x/w*100:.1f}%)")
            lower_left = x
            break
    
    # Right edge
    lower_right = None
    for x in range(w-1, 0, -1):
        val = int(gray[int(h*0.60), x])
        if val > 150:
            print(f"  Right edge: x={x}px ({x/w*100:.1f}%)")
            lower_right = x
            break
    
    if lower_top and lower_bottom and lower_left and lower_right:
        front_h = lower_bottom - lower_top
        front_w = lower_right - lower_left
        print(f"\n  Lower card dimensions: {front_w}x{front_h}px")
        print(f"  Aspect ratio: {front_w/front_h:.4f}")
        
        # Surface color sampling across the card
        print("\nFront card surface colors (grid sampling):")
        for y_pct in [10, 25, 50, 75, 90]:
            y = lower_top + int(front_h * y_pct / 100)
            for x_pct in [10, 25, 50, 75, 90]:
                x = lower_left + int(front_w * x_pct / 100)
                region = arr[y-3:y+4, x-3:x+4]
                avg = region.reshape(-1, 3).mean(axis=0).astype(int)
                brightness = int(avg.mean())
                print(f"  ({x_pct:2d}%,{y_pct:2d}%) → {hex_color(*avg)} L={brightness}")
        
        # Detect dark elements on front (text, monogram)
        print("\nFront card dark element detection (L < 150 on bright card):")
        front_region = gray[lower_top:lower_bottom, lower_left:lower_right]
        
        # Use adaptive threshold
        card_bg_brightness = np.median(front_region)
        print(f"  Card background median brightness: {card_bg_brightness:.0f}")
        
        dark_thresh = card_bg_brightness - 40
        print(f"  Dark element threshold: L < {dark_thresh:.0f}")
        
        dark_mask = front_region < dark_thresh
        dark_coords = np.where(dark_mask)
        
        if len(dark_coords[0]) > 0:
            print(f"  Total dark pixels: {len(dark_coords[0])}")
            
            # Find distinct clusters
            # First: horizontal density profile
            print("\n  Horizontal density profile (dark pixels per row band):")
            active_bands = []
            for band_start_pct in range(0, 100, 2):
                band_start = int(front_h * band_start_pct / 100)
                band_end = int(front_h * (band_start_pct + 2) / 100)
                band = dark_mask[band_start:band_end]
                density = band.sum() / band.size * 100 if band.size > 0 else 0
                if density > 0.3:
                    band_coords = np.where(band)
                    if len(band_coords[1]) > 0:
                        bx_min = band_coords[1].min() / front_w * 100
                        bx_max = band_coords[1].max() / front_w * 100
                        bx_center = (bx_min + bx_max) / 2
                        print(f"    y={band_start_pct:2d}-{band_start_pct+2:2d}%: density={density:.1f}%, x-range: {bx_min:.1f}%-{bx_max:.1f}% (center: {bx_center:.1f}%)")
                        active_bands.append((band_start_pct, density, bx_min, bx_max))
            
            # Vertical density profile
            print("\n  Vertical density profile (dark pixels per column band):")
            for band_start_pct in range(0, 100, 2):
                band_start = int(front_w * band_start_pct / 100)
                band_end = int(front_w * (band_start_pct + 2) / 100)
                band = dark_mask[:, band_start:band_end]
                density = band.sum() / band.size * 100 if band.size > 0 else 0
                if density > 0.3:
                    band_coords = np.where(band)
                    if len(band_coords[0]) > 0:
                        by_min = band_coords[0].min() / front_h * 100
                        by_max = band_coords[0].max() / front_h * 100
                        print(f"    x={band_start_pct:2d}-{band_start_pct+2:2d}%: density={density:.1f}%, y-range: {by_min:.1f}%-{by_max:.1f}%")
            
            # Sample colors of dark elements at various positions
            print("\n  Dark element color sampling:")
            # Find the densest dark region (likely the monogram)
            row_densities = dark_mask.sum(axis=1)
            peak_row = row_densities.argmax()
            peak_y_pct = peak_row / front_h * 100
            
            col_densities = dark_mask.sum(axis=0)
            peak_col = col_densities.argmax()
            peak_x_pct = peak_col / front_w * 100
            
            print(f"  Peak dark density at: x={peak_x_pct:.1f}%, y={peak_y_pct:.1f}% of card")
            
            # Sample color at the peak
            peak_abs_x = lower_left + peak_col
            peak_abs_y = lower_top + peak_row
            region = arr[peak_abs_y-3:peak_abs_y+4, peak_abs_x-3:peak_abs_x+4]
            avg = region.reshape(-1, 3).mean(axis=0).astype(int)
            print(f"  Color at peak: {hex_color(*avg)} R={avg[0]} G={avg[1]} B={avg[2]}")
            
            # Cluster analysis: separate monogram from text
            print("\n  === ELEMENT CLUSTER DETECTION ===")
            
            # Find connected regions vertically
            row_active = np.zeros(front_h, dtype=bool)
            for y in range(front_h):
                if dark_mask[y].sum() > front_w * 0.005:  # At least 0.5% of width has dark pixels
                    row_active[y] = True
            
            # Find contiguous bands of active rows
            clusters = []
            in_cluster = False
            cluster_start = 0
            for y in range(front_h):
                if row_active[y] and not in_cluster:
                    cluster_start = y
                    in_cluster = True
                elif not row_active[y] and in_cluster:
                    clusters.append((cluster_start, y))
                    in_cluster = False
            if in_cluster:
                clusters.append((cluster_start, front_h))
            
            print(f"  Found {len(clusters)} vertical clusters:")
            for i, (cs, ce) in enumerate(clusters):
                cl_h = ce - cs
                cs_pct = cs / front_h * 100
                ce_pct = ce / front_h * 100
                
                # Find x range for this cluster
                cluster_band = dark_mask[cs:ce]
                cl_coords = np.where(cluster_band)
                if len(cl_coords[1]) > 0:
                    x_min = cl_coords[1].min() / front_w * 100
                    x_max = cl_coords[1].max() / front_w * 100
                    x_center = (x_min + x_max) / 2
                    cl_width = x_max - x_min
                    
                    # Sample color
                    mid_y = lower_top + (cs + ce) // 2
                    mid_x = lower_left + int(front_w * x_center / 100)
                    region = arr[mid_y-2:mid_y+3, mid_x-2:mid_x+3]
                    avg = region.reshape(-1, 3).mean(axis=0).astype(int)
                    
                    # Classify by size
                    cl_height_pct = cl_h / front_h * 100
                    size_class = "MONOGRAM" if cl_height_pct > 15 else ("TITLE/NAME" if cl_height_pct > 3 else "SMALL TEXT")
                    
                    print(f"    Cluster {i+1}: y={cs_pct:.1f}%-{ce_pct:.1f}% (h={cl_height_pct:.1f}%), x={x_min:.1f}%-{x_max:.1f}% (w={cl_width:.1f}%, center={x_center:.1f}%)")
                    print(f"      Color: {hex_color(*avg)}, Size class: {size_class}")
                    
                    # For large clusters (monogram), do detailed analysis
                    if cl_height_pct > 10:
                        print(f"      === LARGE ELEMENT DETAIL ===")
                        # Measure density (how filled is the bounding box?)
                        bb_area = cl_h * int(front_w * cl_width / 100)
                        filled = cluster_band[:, int(front_w * x_min / 100):int(front_w * x_max / 100)].sum()
                        fill_ratio = filled / bb_area * 100 if bb_area > 0 else 0
                        print(f"      Fill ratio: {fill_ratio:.1f}% (serif fonts typically 30-50%)")
                        
                        # Check for thin/thick stroke variation (serif indicator)
                        # Sample multiple horizontal slices
                        print(f"      Stroke analysis (width at different heights):")
                        for slice_pct in [10, 25, 50, 75, 90]:
                            slice_y = cs + int(cl_h * slice_pct / 100)
                            slice_row = dark_mask[slice_y]
                            dark_runs = []
                            in_run = False
                            run_start = 0
                            for x in range(front_w):
                                if slice_row[x] and not in_run:
                                    run_start = x
                                    in_run = True
                                elif not slice_row[x] and in_run:
                                    dark_runs.append((run_start/front_w*100, x/front_w*100, (x-run_start)/front_w*100))
                                    in_run = False
                            if in_run:
                                dark_runs.append((run_start/front_w*100, front_w/front_w*100, (front_w-run_start)/front_w*100))
                            
                            if dark_runs:
                                widths = [r[2] for r in dark_runs]
                                print(f"        y={slice_pct}%: {len(dark_runs)} strokes, widths: {[f'{w:.1f}%' for w in widths]}")
    
    # ===================================================================
    # SECTION 5: DECORATIVE ELEMENTS
    # ===================================================================
    print("\n" + "="*70)
    print("SECTION 5: DECORATIVE ELEMENTS (lines, dots, shapes)")
    print("="*70)
    
    if lower_top and lower_bottom and lower_left and lower_right:
        # Look for thin horizontal lines (separators)
        print("\nSearching for horizontal lines on front card:")
        for y in range(front_h):
            row = dark_mask[y]
            dark_count = row.sum()
            # A line would be >30% of width but <3px tall
            if dark_count > front_w * 0.15:
                # Check if it's a thin line (dark above/below should be much less)
                above_count = dark_mask[max(0,y-3):y].sum(axis=1).mean() if y > 3 else 0
                below_count = dark_mask[y+1:min(front_h,y+4)].sum(axis=1).mean() if y < front_h-4 else 0
                if dark_count > above_count * 3 and dark_count > below_count * 3:
                    y_pct = y / front_h * 100
                    # Find the line's x extent
                    line_idx = np.where(row)[0]
                    x_start = line_idx[0] / front_w * 100
                    x_end = line_idx[-1] / front_w * 100
                    print(f"  Possible line at y={y_pct:.1f}%: x={x_start:.1f}%-{x_end:.1f}% ({dark_count}px wide)")
        
        # Look for small circular elements (icons)
        print("\nSearching for small circular/icon elements:")
        # Icons would be small dark clusters (2-4% of card width)
        # Already captured in cluster analysis above
    
    # ===================================================================
    # SECTION 6: PRECISE COLOR PALETTE
    # ===================================================================
    print("\n" + "="*70)
    print("SECTION 6: COMPLETE COLOR PALETTE")
    print("="*70)
    
    # Collect all unique color regions
    print("\nAll distinct colors found:")
    
    # Back card background
    if upper_bottom:
        back_region = arr[upper_top+20:upper_bottom-20, upper_left+20:upper_right-20]
        # Filter to non-bright pixels (background)
        back_gray = back_region.mean(axis=2)
        bg_mask = back_gray < 100
        if bg_mask.sum() > 0:
            bg_pixels = back_region[bg_mask]
            avg = bg_pixels.mean(axis=0).astype(int)
            std = bg_pixels.std(axis=0)
            print(f"  Back card background: {hex_color(*avg)} R={avg[0]} G={avg[1]} B={avg[2]} σ=({std[0]:.1f},{std[1]:.1f},{std[2]:.1f})")
        
        # Back card text/monogram
        bright_mask_back = back_gray > 150
        if bright_mask_back.sum() > 0:
            text_pixels = back_region[bright_mask_back]
            avg = text_pixels.mean(axis=0).astype(int)
            print(f"  Back card text: {hex_color(*avg)} R={avg[0]} G={avg[1]} B={avg[2]}")
    
    # Front card background
    if lower_top and lower_bottom and lower_left and lower_right:
        front_region_full = arr[lower_top+10:lower_bottom-10, lower_left+10:lower_right-10]
        front_gray_full = front_region_full.mean(axis=2)
        bg_mask_front = front_gray_full > 180
        if bg_mask_front.sum() > 0:
            bg_pixels = front_region_full[bg_mask_front]
            avg = bg_pixels.mean(axis=0).astype(int)
            std = bg_pixels.std(axis=0)
            print(f"  Front card background: {hex_color(*avg)} R={avg[0]} G={avg[1]} B={avg[2]} σ=({std[0]:.1f},{std[1]:.1f},{std[2]:.1f})")
        
        # Front card dark elements
        dark_mask_front = front_gray_full < 100
        if dark_mask_front.sum() > 0:
            dark_pixels = front_region_full[dark_mask_front]
            avg = dark_pixels.mean(axis=0).astype(int)
            print(f"  Front card dark text: {hex_color(*avg)} R={avg[0]} G={avg[1]} B={avg[2]}")
        
        # Medium gray elements
        mid_mask = (front_gray_full > 100) & (front_gray_full < 170)
        if mid_mask.sum() > 0:
            mid_pixels = front_region_full[mid_mask]
            avg = mid_pixels.mean(axis=0).astype(int)
            print(f"  Front card medium gray: {hex_color(*avg)} R={avg[0]} G={avg[1]} B={avg[2]}")
    
    # ===================================================================
    # SECTION 7: SHADOW / 3D EFFECT ANALYSIS
    # ===================================================================
    print("\n" + "="*70)
    print("SECTION 7: SHADOW / 3D / OVERLAP ANALYSIS")
    print("="*70)
    
    # Check the overlap zone between the two cards
    if upper_bottom and lower_top:
        overlap_start = min(upper_bottom, lower_top)
        overlap_end = max(upper_bottom, lower_top)
        print(f"  Cards overlap/gap zone: y={overlap_start/h*100:.1f}% to y={overlap_end/h*100:.1f}%")
        
        # Check if front card casts shadow on back card
        print("\n  Shadow detection in overlap zone:")
        for y_pct in range(int(overlap_start/h*100)-5, int(overlap_end/h*100)+5):
            y = int(h * y_pct / 100)
            if 0 <= y < h:
                x = int(w * 0.50)
                val = int(gray[y, x])
                color = arr[y, x]
                print(f"    y={y_pct}%: L={val} color={hex_color(*color)}")
    
    # Check for drop shadow under the front card
    if lower_bottom:
        print("\n  Shadow below front card:")
        for dy in range(0, 30):
            y = lower_bottom + dy
            if y < h:
                x = int(w * 0.55)
                val = int(gray[y, x])
                if val < 20:
                    break
                print(f"    y+{dy}px: L={val}")
    
    # ===================================================================
    # SECTION 8: FINE DETAIL - MONOGRAM CHARACTER ANALYSIS
    # ===================================================================
    print("\n" + "="*70)
    print("SECTION 8: MONOGRAM CHARACTER SHAPE ANALYSIS")
    print("="*70)
    
    if lower_top and lower_bottom and lower_left and lower_right:
        # Use the largest cluster found earlier to zoom into the monogram
        # Re-find it
        front_region_gray = gray[lower_top:lower_bottom, lower_left:lower_right]
        dark_thresh2 = np.median(front_region_gray) - 40
        dark_mask2 = front_region_gray < dark_thresh2
        
        # Find the largest contiguous dark region
        row_active2 = np.zeros(front_h, dtype=bool)
        for y in range(front_h):
            if dark_mask2[y].sum() > front_w * 0.005:
                row_active2[y] = True
        
        clusters2 = []
        in_cluster = False
        for y in range(front_h):
            if row_active2[y] and not in_cluster:
                cluster_start = y
                in_cluster = True
            elif not row_active2[y] and in_cluster:
                clusters2.append((cluster_start, y))
                in_cluster = False
        if in_cluster:
            clusters2.append((cluster_start, front_h))
        
        # Find the tallest cluster (the monogram)
        if clusters2:
            tallest = max(clusters2, key=lambda c: c[1]-c[0])
            mono_start, mono_end = tallest
            mono_h = mono_end - mono_start
            
            mono_band = dark_mask2[mono_start:mono_end]
            mc = np.where(mono_band)
            if len(mc[1]) > 0:
                mono_x_start = mc[1].min()
                mono_x_end = mc[1].max()
                mono_w = mono_x_end - mono_x_start
                
                print(f"  Monogram bounding box (relative to card):")
                print(f"    Position: x={mono_x_start/front_w*100:.1f}%, y={mono_start/front_h*100:.1f}%")
                print(f"    Size: {mono_w/front_w*100:.1f}% x {mono_h/front_h*100:.1f}% of card")
                print(f"    Pixels: {mono_w}x{mono_h}px")
                
                # Character count detection
                # Look for vertical gaps in the monogram (spaces between letters)
                print(f"\n  Vertical gap detection (looking for letter boundaries):")
                col_density = mono_band.sum(axis=0)
                
                # Find gaps (columns with very low density in the monogram x range)
                gaps = []
                in_gap = False
                gap_start = 0
                for x in range(mono_x_start, mono_x_end):
                    is_gap = col_density[x] < mono_h * 0.05  # Less than 5% filled
                    if is_gap and not in_gap:
                        gap_start = x
                        in_gap = True
                    elif not is_gap and in_gap:
                        gap_w = x - gap_start
                        if gap_w > 2:  # Minimum gap width
                            gaps.append((gap_start, x, gap_w))
                        in_gap = False
                
                print(f"    Found {len(gaps)} gaps between characters:")
                for g_start, g_end, g_w in gaps:
                    g_center = (g_start + g_end) / 2
                    print(f"      Gap at x={g_center/front_w*100:.1f}%, width={g_w}px ({g_w/front_w*100:.2f}% of card)")
                
                # Serif detection: check for horizontal strokes at top and bottom
                print(f"\n  Serif detection:")
                # Top of monogram: measure horizontal extent of first few rows
                top_rows = mono_band[:max(3, mono_h//20)]
                top_width = 0
                for r in top_rows:
                    filled = np.where(r[mono_x_start:mono_x_end])[0]
                    if len(filled) > 0:
                        rw = filled[-1] - filled[0]
                        top_width = max(top_width, rw)
                
                # Middle of monogram
                mid_rows = mono_band[mono_h//2-2:mono_h//2+3]
                mid_width = 0
                for r in mid_rows:
                    filled = np.where(r[mono_x_start:mono_x_end])[0]
                    if len(filled) > 0:
                        rw = filled[-1] - filled[0]
                        mid_width = max(mid_width, rw)
                
                # Bottom of monogram
                bot_rows = mono_band[-max(3, mono_h//20):]
                bot_width = 0
                for r in bot_rows:
                    filled = np.where(r[mono_x_start:mono_x_end])[0]
                    if len(filled) > 0:
                        rw = filled[-1] - filled[0]
                        bot_width = max(bot_width, rw)
                
                print(f"    Top extent: {top_width}px ({top_width/front_w*100:.2f}% of card)")
                print(f"    Middle extent: {mid_width}px ({mid_width/front_w*100:.2f}% of card)")
                print(f"    Bottom extent: {bot_width}px ({bot_width/front_w*100:.2f}% of card)")
                
                if top_width > mid_width * 1.3 or bot_width > mid_width * 1.3:
                    print(f"    → SERIF DETECTED (extremities wider than middle strokes)")
                else:
                    print(f"    → Likely SANS-SERIF or modern serif (uniform stroke)")
                
                # Thick/thin stroke contrast
                print(f"\n  Stroke contrast analysis:")
                all_stroke_widths = []
                for y_off in range(0, mono_h, max(1, mono_h//30)):
                    row = mono_band[y_off]
                    runs = []
                    in_run = False
                    for x in range(mono_x_start, mono_x_end):
                        if row[x] and not in_run:
                            run_start = x
                            in_run = True
                        elif not row[x] and in_run:
                            runs.append(x - run_start)
                            in_run = False
                    if in_run:
                        runs.append(mono_x_end - run_start)
                    all_stroke_widths.extend(runs)
                
                if all_stroke_widths:
                    min_stroke = min(all_stroke_widths)
                    max_stroke = max(all_stroke_widths)
                    avg_stroke = sum(all_stroke_widths) / len(all_stroke_widths)
                    contrast_ratio = max_stroke / min_stroke if min_stroke > 0 else 0
                    print(f"    Min stroke: {min_stroke}px")
                    print(f"    Max stroke: {max_stroke}px")
                    print(f"    Avg stroke: {avg_stroke:.1f}px")
                    print(f"    Contrast ratio: {contrast_ratio:.1f}x")
                    if contrast_ratio > 3:
                        print(f"    → HIGH CONTRAST (Didone/Bodoni style)")
                    elif contrast_ratio > 2:
                        print(f"    → MODERATE CONTRAST (Transitional style - Times, Baskerville)")
                    else:
                        print(f"    → LOW CONTRAST (Old Style or Sans-Serif)")
    
    print("\n" + "="*70)
    print("ANALYSIS COMPLETE")
    print("="*70)

if __name__ == "__main__":
    analyze()
