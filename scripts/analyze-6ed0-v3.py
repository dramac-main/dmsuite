from PIL import Image
import numpy as np

img = Image.open(r'd:\dramac-ai-suite\business-card-examples\6ed0ec5d9a915d54a12b7bd525d0a382.jpg')
w, h = img.size
arr = np.array(img)

print("=" * 80)
print("FINAL TARGETED ANALYSIS - 6ed0ec5d9a915d54a12b7bd525d0a382.jpg")
print("=" * 80)

# ============================================================
# SECTION A: FRONT CARD - TEAL GRADIENT CARD ANALYSIS
# ============================================================
print("\n" + "=" * 60)
print("SECTION A: FRONT CARD (Dark Teal Gradient)")
print("=" * 60)

# The front card has a teal/blue-gray gradient
# Based on prior scans, the teal region is approx y=350-670, x=90-750 (a parallelogram)
# The gradient goes from lighter teal at top to darker at bottom

# Precise teal card boundary tracing
print("\n--- Teal Card Precise Boundaries ---")
teal_rows = []
for y in range(300, 750):
    row = arr[y, :, :3].astype(int)
    # Teal criterion: B>R+3 and G>R+3 and R>60
    teal_mask = (row[:, 2] > row[:, 0] + 3) & (row[:, 1] > row[:, 0] + 3) & (row[:, 0] > 60) & (row[:, 0] < 180)
    teal_idx = np.where(teal_mask)[0]
    if len(teal_idx) > 30:
        teal_rows.append((y, teal_idx[0], teal_idx[-1], len(teal_idx)))

if teal_rows:
    print(f"  Teal card found from y={teal_rows[0][0]} to y={teal_rows[-1][0]}")
    print(f"  Y range: {teal_rows[0][0]/h*100:.1f}% to {teal_rows[-1][0]/h*100:.1f}%")
    # Sample key rows
    for i in [0, len(teal_rows)//4, len(teal_rows)//2, 3*len(teal_rows)//4, len(teal_rows)-1]:
        y, xl, xr, cnt = teal_rows[i]
        mid_x = (xl + xr) // 2
        c = tuple(arr[y, mid_x, :3])
        print(f"  Row y={y} ({y/h*100:.1f}%): x={xl}-{xr} ({xl/w*100:.1f}%-{xr/w*100:.1f}%), center color=RGB{c}")

# Gradient profile at the center of the teal card
print("\n--- Teal Card Center Gradient Profile ---")
if teal_rows:
    for y, xl, xr, cnt in teal_rows[::max(1, len(teal_rows)//15)]:
        mid_x = (xl + xr) // 2
        c = tuple(arr[y, mid_x, :3])
        hex_c = f"#{c[0]:02x}{c[1]:02x}{c[2]:02x}"
        print(f"  y={y} ({y/h*100:.1f}%): RGB{c} = {hex_c}")

# Look for ANY distinct element on the teal card (text, line, mark)
print("\n--- Front Card: Looking for Elements ON the Teal Gradient ---")
if teal_rows:
    for y, xl, xr, cnt in teal_rows:
        mid_x = (xl + xr) // 2
        card_slice = arr[y, xl:xr, :3].astype(float)
        # Expected teal gradient color at this position
        expected_b = np.median(card_slice[:, 2])
        expected_g = np.median(card_slice[:, 1])
        expected_r = np.median(card_slice[:, 0])
        # Find pixels that deviate significantly from the median
        deviation = np.abs(card_slice - np.array([expected_r, expected_g, expected_b])).sum(axis=1)
        outlier_mask = deviation > 40
        outlier_count = np.sum(outlier_mask)
        if outlier_count > 3:
            outlier_idx = np.where(outlier_mask)[0]
            sample = tuple(arr[y, xl + outlier_idx[len(outlier_idx)//2], :3])
            print(f"  y={y} ({y/h*100:.1f}%): {outlier_count} outlier pixels, x={xl+outlier_idx[0]}-{xl+outlier_idx[-1]}, sample=RGB{sample}")

# ============================================================
# SECTION B: BACK CARD - WHITE CARD ANALYSIS  
# ============================================================
print("\n" + "=" * 60)
print("SECTION B: BACK CARD (White)")
print("=" * 60)

# White card region: approximately y=476-847, x=340-1088
# But it's a parallelogram due to perspective
# Let's trace the white card boundaries precisely

print("\n--- White Card Precise Boundaries ---")
white_rows = []
for y in range(400, 900):
    row = arr[y, :, :3].astype(int)
    # White criterion: all channels > 200 and channels similar
    white_mask = (row[:, 0] > 200) & (row[:, 1] > 200) & (row[:, 2] > 200)
    white_idx = np.where(white_mask)[0]
    if len(white_idx) > 30:
        white_rows.append((y, white_idx[0], white_idx[-1], len(white_idx)))

if white_rows:
    print(f"  White card: y={white_rows[0][0]} to y={white_rows[-1][0]}")
    print(f"  Y range: {white_rows[0][0]/h*100:.1f}% to {white_rows[-1][0]/h*100:.1f}%")
    for i in [0, len(white_rows)//4, len(white_rows)//2, 3*len(white_rows)//4, len(white_rows)-1]:
        y, xl, xr, cnt = white_rows[i]
        mid_x = (xl + xr) // 2
        c = tuple(arr[y, mid_x, :3])
        print(f"  Row y={y} ({y/h*100:.1f}%): x={xl}-{xr} ({xl/w*100:.1f}%-{xr/w*100:.1f}%), center color=RGB{c}, white_px={cnt}")

# Now find dark elements ON the white card
print("\n--- Back Card: Dark Elements on White Background ---")
if white_rows:
    # For each white row, find dark pixels that are surrounded by white
    prev_has_dark = False
    block_start = None
    dark_blocks = []
    
    for y, xl, xr, cnt in white_rows:
        # Get the white card region
        card = arr[y, xl:xr, :3].astype(float)
        # Very dark pixels on white bg (< 100 mean brightness)
        dark_mask = np.mean(card, axis=1) < 100
        dark_count = np.sum(dark_mask)
        has_dark = dark_count > 2
        
        if has_dark and not prev_has_dark:
            block_start = y
        elif not has_dark and prev_has_dark and block_start is not None:
            dark_blocks.append((block_start, y))
            block_start = None
        prev_has_dark = has_dark
    
    if block_start is not None:
        dark_blocks.append((block_start, white_rows[-1][0]))
    
    print(f"\n  Found {len(dark_blocks)} dark element blocks on white card:")
    wc_top = white_rows[0][0]
    wc_bottom = white_rows[-1][0]
    wc_height = wc_bottom - wc_top
    
    for i, (start, end) in enumerate(dark_blocks):
        mid_y = (start + end) // 2
        # Find the white card bounds at this y
        card_xl = None
        card_xr = None
        for wy, wxl, wxr, wcnt in white_rows:
            if wy == mid_y or (card_xl is None and wy >= mid_y):
                card_xl = wxl
                card_xr = wxr
                break
        if card_xl is None:
            continue
            
        card = arr[mid_y, card_xl:card_xr, :3].astype(float)
        dark_mask = np.mean(card, axis=1) < 100
        dark_idx = np.where(dark_mask)[0]
        
        height = end - start
        rel_y_start = (start - wc_top) / wc_height * 100
        rel_y_end = (end - wc_top) / wc_height * 100
        
        if len(dark_idx) > 0:
            abs_left = card_xl + dark_idx[0]
            abs_right = card_xl + dark_idx[-1]
            sample = tuple(arr[mid_y, card_xl + dark_idx[len(dark_idx)//2], :3])
            
            # Card-relative x positions
            card_width = card_xr - card_xl
            rel_x_start = dark_idx[0] / card_width * 100
            rel_x_end = dark_idx[-1] / card_width * 100
            
            # Sample multiple colors
            colors_at_block = []
            for dy in range(start, end, max(1, height // 4)):
                for wry, wrxl, wrxr, wrcnt in white_rows:
                    if wry >= dy:
                        r = arr[dy, wrxl:wrxr, :3].astype(float)
                        dm = np.mean(r, axis=1) < 100
                        di = np.where(dm)[0]
                        if len(di) > 0:
                            colors_at_block.append(tuple(arr[dy, wrxl + di[len(di)//2], :3]))
                        break
            
            hex_sample = f"#{sample[0]:02x}{sample[1]:02x}{sample[2]:02x}"
            print(f"\n  Block {i+1}:")
            print(f"    Y: {start}-{end} (card-relative: {rel_y_start:.1f}%-{rel_y_end:.1f}%)")
            print(f"    Height: {height}px ({height/wc_height*100:.1f}% of card)")
            print(f"    X: {abs_left}-{abs_right} (card-relative: {rel_x_start:.1f}%-{rel_x_end:.1f}%)")
            print(f"    Width span: {abs_right-abs_left}px ({(abs_right-abs_left)/card_width*100:.1f}% of card)")
            print(f"    Dark pixel count: {len(dark_idx)}")
            print(f"    Color sample: RGB{sample} = {hex_sample}")
            print(f"    Multi-row colors: {colors_at_block[:5]}")
        else:
            print(f"\n  Block {i+1}: y={start}-{end}, NO dark pixels at mid row")

# ============================================================
# SECTION C: PRECISE COLOR EXTRACTION
# ============================================================
print("\n" + "=" * 60)
print("SECTION C: PRECISE COLOR VALUES")
print("=" * 60)

# White card background
if white_rows:
    bg_samples = []
    for y, xl, xr, cnt in white_rows[::max(1, len(white_rows)//10)]:
        mid_x = (xl + xr) // 2
        c = arr[y, mid_x, :3]
        bg_samples.append(c)
    bg_avg = np.mean(bg_samples, axis=0).astype(int)
    print(f"\n  White card background average: RGB({bg_avg[0]},{bg_avg[1]},{bg_avg[2]}) = #{bg_avg[0]:02x}{bg_avg[1]:02x}{bg_avg[2]:02x}")

# Teal card gradient colors
if teal_rows:
    print("\n  Teal card gradient (top to bottom):")
    for y, xl, xr, cnt in teal_rows[::max(1, len(teal_rows)//8)]:
        mid_x = (xl + xr) // 2
        c = tuple(arr[y, mid_x, :3])
        print(f"    y={y}: RGB{c} = #{c[0]:02x}{c[1]:02x}{c[2]:02x}")

# Background color (mockup surface)
print("\n  Mockup background samples:")
for label, px, py in [("top-left corner", 30, 30), ("top-right corner", 1170, 30), ("bottom-left corner", 30, 1170), ("bottom-right corner", 1170, 1170)]:
    c = tuple(arr[py, px, :3])
    print(f"    {label}: RGB{c} = #{c[0]:02x}{c[1]:02x}{c[2]:02x}")

# ============================================================
# SECTION D: SPACING & PROPORTIONS
# ============================================================
print("\n" + "=" * 60)
print("SECTION D: SPACING & PROPORTIONS SUMMARY")
print("=" * 60)

if white_rows and dark_blocks:
    print(f"\n  White card total height: {wc_height}px")
    print(f"  White card approximate width (at mid): {white_rows[len(white_rows)//2][2] - white_rows[len(white_rows)//2][1]}px")
    
    prev_end = wc_top
    for i, (start, end) in enumerate(dark_blocks):
        gap_before = start - prev_end
        print(f"\n  Gap before block {i+1}: {gap_before}px ({gap_before/wc_height*100:.1f}% of card height)")
        print(f"  Block {i+1} height: {end-start}px ({(end-start)/wc_height*100:.1f}% of card height)")
        prev_end = end
    
    gap_after_last = wc_bottom - dark_blocks[-1][1]
    print(f"\n  Gap after last block to bottom: {gap_after_last}px ({gap_after_last/wc_height*100:.1f}% of card height)")

if teal_rows:
    teal_height = teal_rows[-1][0] - teal_rows[0][0]
    teal_mid_width = teal_rows[len(teal_rows)//2][2] - teal_rows[len(teal_rows)//2][1]
    print(f"\n  Teal card total height: {teal_height}px")
    print(f"  Teal card approximate width (at mid): {teal_mid_width}px")

# ============================================================
# SECTION E: ULTRA-FINE ELEMENT SCAN ON WHITE CARD
# ============================================================
print("\n" + "=" * 60)
print("SECTION E: ULTRA-FINE SCAN - White Card Elements (threshold < 150)")
print("=" * 60)

if white_rows:
    prev_has_element = False
    block_start = None
    fine_blocks = []
    
    for y, xl, xr, cnt in white_rows:
        card = arr[y, xl:xr, :3].astype(float)
        element_mask = np.mean(card, axis=1) < 150
        element_count = np.sum(element_mask)
        has_element = element_count > 1
        
        if has_element and not prev_has_element:
            block_start = y
        elif not has_element and prev_has_element and block_start is not None:
            fine_blocks.append((block_start, y))
            block_start = None
        prev_has_element = has_element
    
    if block_start is not None:
        fine_blocks.append((block_start, white_rows[-1][0]))
    
    print(f"\n  Found {len(fine_blocks)} element blocks (threshold < 150):")
    for i, (start, end) in enumerate(fine_blocks):
        height = end - start
        rel_y_start = (start - wc_top) / wc_height * 100
        rel_y_end = (end - wc_top) / wc_height * 100
        
        # Get detailed color at mid
        mid_y = (start + end) // 2
        for wry, wrxl, wrxr, wrcnt in white_rows:
            if wry >= mid_y:
                card = arr[mid_y, wrxl:wrxr, :3].astype(float)
                element_mask = np.mean(card, axis=1) < 150
                element_idx = np.where(element_mask)[0]
                if len(element_idx) > 0:
                    card_width = wrxr - wrxl
                    sample = tuple(arr[mid_y, wrxl + element_idx[len(element_idx)//2], :3])
                    hex_s = f"#{sample[0]:02x}{sample[1]:02x}{sample[2]:02x}"
                    span = element_idx[-1] - element_idx[0]
                    print(f"    Block {i+1}: y={start}-{end} ({rel_y_start:.1f}%-{rel_y_end:.1f}%), "
                          f"h={height}px, x-span={span}px ({span/card_width*100:.1f}% width), "
                          f"color=RGB{sample}={hex_s}, px_count={len(element_idx)}")
                break
