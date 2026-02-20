"""
Final: precise text element positions on front card right side,
and monogram character identification
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
    
    # Front card bounds
    ft, fb, fl, fr = 108, 570, 256, 875
    fw, fh = fr-fl, fb-ft  # 619x462
    
    front = gray[ft:fb, fl:fr]
    front_rgb = arr[ft:fb, fl:fr]
    dark = front < 204
    
    # ===================================================================
    # FRONT CARD: Separate monogram from text by x position
    # ===================================================================
    print("="*70)
    print("FRONT CARD: ELEMENT ZONE ANALYSIS")
    print("="*70)
    
    # Left zone (monogram): x = 0-50% of card
    # Right zone (text): x = 50-100% of card
    
    # MONOGRAM ZONE (left half)
    print("\n--- MONOGRAM ZONE (left 50%) ---")
    mono_region = dark[:, :fw//2]
    
    # Find monogram vertical extent
    row_density = mono_region.sum(axis=1)
    mono_rows = np.where(row_density > fw*0.01)[0]
    if len(mono_rows) > 0:
        mono_top = mono_rows[0]
        mono_bot = mono_rows[-1]
        mono_height = mono_bot - mono_top
        print(f"Monogram vertical extent: y={mono_top/fh*100:.1f}% to y={mono_bot/fh*100:.1f}% (height={mono_height/fh*100:.1f}%)")
        print(f"Monogram center Y: {(mono_top+mono_bot)/2/fh*100:.1f}%")
        
        # Find horizontal extent
        col_density = dark[mono_top:mono_bot, :fw//2].sum(axis=0)
        mono_cols = np.where(col_density > mono_height*0.02)[0]
        if len(mono_cols) > 0:
            mono_left = mono_cols[0]
            mono_right = mono_cols[-1]
            mono_width = mono_right - mono_left
            print(f"Monogram horizontal extent: x={mono_left/fw*100:.1f}% to x={mono_right/fw*100:.1f}% (width={mono_width/fw*100:.1f}%)")
            print(f"Monogram center X: {(mono_left+mono_right)/2/fw*100:.1f}%")
            print(f"Monogram bounding box: {mono_width}x{mono_height}px ({mono_width/fw*100:.1f}% x {mono_height/fh*100:.1f}%)")
            
            # Character separation within monogram
            print("\nMonogram column density profile (finding gap between S and H):")
            for x in range(mono_left, mono_right):
                d = dark[mono_top:mono_bot, x].sum()
                if d < mono_height * 0.02:
                    if not hasattr(analyze, '_in_gap') or not analyze._in_gap:
                        print(f"  Gap start at x={x/fw*100:.1f}%")
                        analyze._in_gap = True
                elif hasattr(analyze, '_in_gap') and analyze._in_gap:
                    print(f"  Gap end at x={x/fw*100:.1f}%")
                    analyze._in_gap = False
            
            # Sample the darkest color in the monogram
            mono_mask = dark[mono_top:mono_bot, mono_left:mono_right]
            mono_pixels = front_rgb[mono_top:mono_bot, mono_left:mono_right][mono_mask]
            if len(mono_pixels) > 0:
                avg = mono_pixels.mean(axis=0).astype(int)
                darkest = mono_pixels[mono_pixels.mean(axis=1).argmin()]
                lightest = mono_pixels[mono_pixels.mean(axis=1).argmax()]
                print(f"\nMonogram color: avg={hex_color(*avg)}, darkest={hex_color(*darkest)}, lightest={hex_color(*lightest)}")
    
    # TEXT ZONE (right side)
    print("\n--- TEXT ZONE (right side, x > 48%) ---")
    text_start_x = int(fw * 0.48)
    text_region = dark[:, text_start_x:]
    text_rgb = front_rgb[:, text_start_x:]
    text_w = fw - text_start_x
    
    # Find individual text lines
    row_density_text = text_region.sum(axis=1) / text_w * 100
    
    in_line = False
    text_lines = []
    for y in range(fh):
        if row_density_text[y] > 0.5 and not in_line:
            line_start = y
            in_line = True
        elif row_density_text[y] < 0.5 and in_line:
            text_lines.append((line_start, y))
            in_line = False
    if in_line:
        text_lines.append((line_start, fh))
    
    print(f"\nFound {len(text_lines)} text lines on right side:")
    for i, (ls, le) in enumerate(text_lines):
        lh = le - ls
        line_dark = text_region[ls:le]
        cols = np.where(line_dark.any(axis=0))[0]
        if len(cols) == 0:
            continue
        lx_start = cols[0]
        lx_end = cols[-1]
        lw = lx_end - lx_start
        
        # Count approximate character count (based on small gaps)
        col_dens = line_dark.sum(axis=0)
        char_segments = 0
        in_char = False
        for x in range(lx_start, lx_end+1):
            if col_dens[x] > lh * 0.1 and not in_char:
                char_segments += 1
                in_char = True
            elif col_dens[x] < lh * 0.05 and in_char:
                in_char = False
        
        # Position relative to CARD
        abs_x_start = (text_start_x + lx_start) / fw * 100
        abs_x_end = (text_start_x + lx_end) / fw * 100
        abs_y_center = (ls + le) / 2 / fh * 100
        
        # Sample color
        dark_in_line = text_region[ls:le]
        mask = dark_in_line > 0
        # Get actual colors
        line_colors = []
        for sx in cols[::max(1, len(cols)//5)][:5]:
            col_dark = np.where(text_region[ls:le, sx])[0]
            if len(col_dark) > 0:
                sy = ls + col_dark[len(col_dark)//2]
                c = text_rgb[sy, sx]
                line_colors.append(c)
        
        avg_color = np.mean(line_colors, axis=0).astype(int) if line_colors else np.array([0,0,0])
        
        # Size classification
        h_pct = lh / fh * 100
        if h_pct > 4:
            size = "LARGE"
        elif h_pct > 2:
            size = "MEDIUM"
        elif h_pct > 1:
            size = "SMALL"
        else:
            size = "TINY"
        
        print(f"\n  Line {i+1} [{size}]:")
        print(f"    Y: {ls/fh*100:.1f}%-{le/fh*100:.1f}% (height: {h_pct:.1f}%, center: {abs_y_center:.1f}%)")
        print(f"    X: {abs_x_start:.1f}%-{abs_x_end:.1f}% (width: {lw/fw*100:.1f}%)")
        print(f"    Height: {lh}px, ~{char_segments} char segments")
        print(f"    Color: {hex_color(*avg_color)}")
    
    # ===================================================================
    # BACK CARD: Monogram and name
    # ===================================================================
    bt, bb, bl, br = 572, 971, 256, 875
    bw, bh_card = br-bl, bb-bt  # 619x399
    
    back = gray[bt:bb, bl:br]
    back_rgb = arr[bt:bb, bl:br]
    bright = back > 74
    
    print("\n" + "="*70)
    print("BACK CARD: ELEMENT DETAILS")
    print("="*70)
    
    # Monogram on back card
    print("\n--- BACK MONOGRAM ---")
    # Find bright element in central area
    center_region = bright[int(bh_card*0.15):int(bh_card*0.65)]
    center_rgb = back_rgb[int(bh_card*0.15):int(bh_card*0.65)]
    center_h = int(bh_card*0.50)
    
    # Find bounding box
    bright_coords = np.where(center_region)
    if len(bright_coords[0]) > 0:
        mono_back_top = bright_coords[0].min() + int(bh_card*0.15)
        mono_back_bot = bright_coords[0].max() + int(bh_card*0.15)
        mono_back_left = bright_coords[1].min()
        mono_back_right = bright_coords[1].max()
        
        mbw = mono_back_right - mono_back_left
        mbh = mono_back_bot - mono_back_top
        
        print(f"Back monogram position:")
        print(f"  Y: {mono_back_top/bh_card*100:.1f}% to {mono_back_bot/bh_card*100:.1f}% (height: {mbh/bh_card*100:.1f}%)")
        print(f"  X: {mono_back_left/bw*100:.1f}% to {mono_back_right/bw*100:.1f}% (width: {mbw/bw*100:.1f}%)")
        print(f"  Center: ({(mono_back_left+mono_back_right)/2/bw*100:.1f}%, {(mono_back_top+mono_back_bot)/2/bh_card*100:.1f}%)")
        
        # Character gap
        mono_back_region = bright[mono_back_top:mono_back_bot, mono_back_left:mono_back_right]
        col_dens = mono_back_region.sum(axis=0)
        
        # Find the main gap
        gap_start = None
        gap_end = None
        max_gap = 0
        current_gap_start = None
        for x in range(len(col_dens)):
            if col_dens[x] < mbh * 0.03:
                if current_gap_start is None:
                    current_gap_start = x
            else:
                if current_gap_start is not None:
                    gap_w = x - current_gap_start
                    if gap_w > max_gap:
                        max_gap = gap_w
                        gap_start = current_gap_start
                        gap_end = x
                    current_gap_start = None
        
        if gap_start is not None:
            gap_abs_x = mono_back_left + (gap_start + gap_end) / 2
            print(f"\n  Character gap:")
            print(f"    Gap at x={gap_abs_x/bw*100:.1f}% (width={max_gap}px, {max_gap/bw*100:.1f}%)")
            print(f"    Letter 1 (S): x={mono_back_left/bw*100:.1f}%-{(mono_back_left+gap_start)/bw*100:.1f}%")
            print(f"    Letter 2 (H): x={(mono_back_left+gap_end)/bw*100:.1f}%-{mono_back_right/bw*100:.1f}%")
            
            s_width = gap_start
            h_width = mbw - gap_end
            print(f"    S width: {s_width/bw*100:.1f}% of card")
            print(f"    H width: {h_width/bw*100:.1f}% of card")
        
        # Sample monogram color
        mono_pixels = back_rgb[mono_back_top:mono_back_bot, mono_back_left:mono_back_right][mono_back_region]
        if len(mono_pixels) > 0:
            avg = mono_pixels.mean(axis=0).astype(int)
            print(f"\n  Monogram color: {hex_color(*avg)} R={avg[0]} G={avg[1]} B={avg[2]}")
    
    # Name text on back card
    print("\n--- BACK NAME TEXT ---")
    # Look for text in y=65-85% range
    name_region = bright[int(bh_card*0.65):int(bh_card*0.85)]
    name_rgb = back_rgb[int(bh_card*0.65):int(bh_card*0.85)]
    name_h = int(bh_card*0.20)
    
    # Find text bands
    row_dens = name_region.sum(axis=1) / bw * 100
    in_band = False
    name_bands = []
    for y in range(name_h):
        if row_dens[y] > 0.3 and not in_band:
            bs = y
            in_band = True
        elif row_dens[y] < 0.3 and in_band:
            name_bands.append((bs, y))
            in_band = False
    if in_band:
        name_bands.append((bs, name_h))
    
    for i, (bs, be) in enumerate(name_bands):
        abs_y_start = (int(bh_card*0.65) + bs) / bh_card * 100
        abs_y_end = (int(bh_card*0.65) + be) / bh_card * 100
        lh = be - bs
        
        band = name_region[bs:be]
        cols = np.where(band.any(axis=0))[0]
        if len(cols) == 0:
            continue
        x_start = cols[0]
        x_end = cols[-1]
        
        # Sample color
        colors = []
        for sx in cols[::max(1, len(cols)//8)][:8]:
            col_bright = np.where(band[:, sx])[0]
            if len(col_bright) > 0:
                sy = bs + col_bright[len(col_bright)//2]
                c = name_rgb[sy, sx]
                colors.append(c)
        
        avg_color = np.mean(colors, axis=0).astype(int) if colors else np.array([128,128,128])
        
        # Character count
        col_dens_name = band.sum(axis=0)
        char_count = 0
        in_char = False
        for x in range(x_start, x_end+1):
            if col_dens_name[x] > lh * 0.15 and not in_char:
                char_count += 1
                in_char = True
            elif col_dens_name[x] < lh * 0.05 and in_char:
                in_char = False
        
        print(f"  Name line {i+1}:")
        print(f"    Y: {abs_y_start:.1f}%-{abs_y_end:.1f}% (height: {lh/bh_card*100:.1f}%)")
        print(f"    X: {x_start/bw*100:.1f}%-{x_end/bw*100:.1f}% (center: {(x_start+x_end)/2/bw*100:.1f}%)")
        print(f"    Color: {hex_color(*avg_color)} ({[hex_color(*c) for c in colors[:4]]})")
        print(f"    Est. char segments: {char_count}")
        print(f"    Height: {lh}px ({lh/bh_card*100:.1f}% of card)")
        print(f"    Width: {(x_end-x_start)/bw*100:.1f}% of card")
    
    # ===================================================================
    # FRONT CARD: fine text color analysis
    # ===================================================================
    print("\n" + "="*70)
    print("FRONT CARD: MONOGRAM SERIF/SANS DETECTION")
    print("="*70)
    
    if len(mono_rows) > 0:
        # For the first monogram letter on front card
        # Check horizontal strokes at character top vs vertical stems
        mono_mask_front = dark[mono_top:mono_bot, mono_left:mono_right]
        
        # Top 5% of character
        top_slice = mono_mask_front[:max(3, mono_height//20)]
        top_width = top_slice.sum(axis=1).max()
        
        # Bottom 5% of character
        bot_slice = mono_mask_front[-max(3, mono_height//20):]
        bot_width = bot_slice.sum(axis=1).max()
        
        # Middle
        mid_slice = mono_mask_front[mono_height//2-2:mono_height//2+3]
        mid_width = mid_slice.sum(axis=1).max()
        
        # Thin strokes (horizontal connectors)
        thin_rows = []
        thick_rows = []
        for y_off in range(mono_height):
            row_sum = mono_mask_front[y_off].sum()
            if row_sum > 0:
                if row_sum < mono_width * 0.15:
                    thin_rows.append(row_sum)
                else:
                    thick_rows.append(row_sum)
        
        thin_avg = sum(thin_rows)/len(thin_rows) if thin_rows else 0
        thick_avg = sum(thick_rows)/len(thick_rows) if thick_rows else 0
        
        print(f"  Top width: {top_width}px")
        print(f"  Mid width: {mid_width}px")
        print(f"  Bottom width: {bot_width}px")
        print(f"  Thin stroke avg: {thin_avg:.1f}px")
        print(f"  Thick stroke avg: {thick_avg:.1f}px")
        print(f"  Contrast ratio: {thick_avg/max(thin_avg,1):.1f}x")
        
        if thick_avg / max(thin_avg, 1) > 3:
            print("  → DIDONE (Bodoni/Didot) style — extreme stroke contrast")
        elif thick_avg / max(thin_avg, 1) > 2:
            print("  → TRANSITIONAL (Baskerville/Times) style")
        else:
            print("  → LOW CONTRAST (Old Style or Sans-Serif)")
    
    # ===================================================================
    # FRONT CARD: Identify all text on right side with spacing
    # ===================================================================
    print("\n" + "="*70)
    print("FRONT CARD: RIGHT-SIDE TEXT WITH SPACING")
    print("="*70)
    
    text_start_x = int(fw * 0.48)
    text_end_x = int(fw * 0.90)
    
    # Scan every row for text presence
    text_rows = []
    for y in range(fh):
        dark_count = dark[y, text_start_x:text_end_x].sum()
        if dark_count > 3:
            text_rows.append((y, dark_count))
    
    # Group into lines with gaps
    lines = []
    if text_rows:
        current_line_start = text_rows[0][0]
        current_line_end = text_rows[0][0]
        for y, count in text_rows[1:]:
            if y - current_line_end > 3:  # Gap of >3px = new line
                lines.append((current_line_start, current_line_end))
                current_line_start = y
            current_line_end = y
        lines.append((current_line_start, current_line_end))
    
    print(f"Found {len(lines)} text lines on right side:")
    prev_end = None
    for i, (ls, le) in enumerate(lines):
        lh = le - ls + 1
        
        # Gap from previous
        gap = ls - prev_end if prev_end is not None else 0
        
        # Find x extent in this area
        line_dark = dark[ls:le+1, text_start_x:text_end_x]
        cols = np.where(line_dark.any(axis=0))[0]
        if len(cols) == 0:
            continue
        
        lx_start = text_start_x + cols[0]
        lx_end = text_start_x + cols[-1]
        
        # Count characters
        col_dens = line_dark.sum(axis=0)
        chars = 0
        in_char = False
        for x in range(len(col_dens)):
            if col_dens[x] > 0 and not in_char:
                chars += 1
                in_char = True
            elif col_dens[x] == 0 and in_char:
                in_char = False
        
        # Color
        colors = []
        for sx_rel in cols[::max(1, len(cols)//3)][:3]:
            sx = text_start_x + sx_rel
            dark_in_col = np.where(dark[ls:le+1, sx])[0]
            if len(dark_in_col) > 0:
                sy = ls + dark_in_col[len(dark_in_col)//2]
                colors.append(front_rgb[sy, sx])
        
        avg_c = np.mean(colors, axis=0).astype(int) if colors else np.array([0,0,0])
        
        h_pct = lh / fh * 100
        if h_pct > 3:
            weight = "BOLD/HEAVY"
        elif h_pct > 1.5:
            weight = "REGULAR"
        elif h_pct > 0.8:
            weight = "LIGHT"
        else:
            weight = "HAIRLINE"
        
        print(f"\n  Line {i+1} [{weight}]:")
        print(f"    Y: {ls/fh*100:.1f}%-{le/fh*100:.1f}% | center: {(ls+le)/2/fh*100:.1f}%")
        print(f"    X: {lx_start/fw*100:.1f}%-{lx_end/fw*100:.1f}%")
        print(f"    Height: {lh}px ({h_pct:.2f}%)")
        print(f"    Width: {(lx_end-lx_start)/fw*100:.1f}%")
        print(f"    ~{chars} char groups")
        print(f"    Color: {hex_color(*avg_c)}")
        if prev_end is not None:
            print(f"    Gap from prev: {gap}px ({gap/fh*100:.1f}%)")
        
        prev_end = le
    
    print("\n" + "="*70)
    print("COMPLETE")
    print("="*70)

if __name__ == "__main__":
    analyze()
