from PIL import Image
import numpy as np

img = Image.open(r'd:\dramac-ai-suite\business-card-examples\6ed0ec5d9a915d54a12b7bd525d0a382.jpg')
w, h = img.size
arr = np.array(img)
print(f"Image size: {w}x{h}")

# === FULL IMAGE COLOR MAP (20x20 grid) ===
print("\n=== FULL IMAGE COLOR MAP (20x20 grid) ===")
for gy in range(20):
    row_data = []
    for gx in range(20):
        py = int(h * gy / 20)
        px = int(w * gx / 20)
        r, g, b = arr[py, px, :3]
        row_data.append(f"({r:3d},{g:3d},{b:3d})")
    line1 = " ".join(row_data[:10])
    line2 = " ".join(row_data[10:])
    pct = gy * 5
    print(f"  y={pct:2d}%: {line1}")
    print(f"         {line2}")

# === IDENTIFY WHITE (back card) REGIONS ===
print("\n=== WHITE REGION DETECTION (back card) ===")
for y_pct in [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]:
    py = int(h * y_pct)
    whites = []
    for px in range(w):
        r, g, b = arr[py, px, :3]
        if r > 200 and g > 200 and b > 200:
            whites.append(px)
    if whites:
        print(f"  y={y_pct*100:5.1f}%: white x={whites[0]}-{whites[-1]} ({whites[0]/w*100:.1f}%-{whites[-1]/w*100:.1f}%), count={len(whites)}")
    else:
        print(f"  y={y_pct*100:5.1f}%: NO white pixels")

# === IDENTIFY VERY DARK REGIONS (front card on dark bg) ===
print("\n=== DARK REGION ANALYSIS ===")
for y_pct in [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]:
    py = int(h * y_pct)
    darks = []
    for px in range(w):
        r, g, b = arr[py, px, :3]
        if r < 50 and g < 50 and b < 50:
            darks.append(px)
    if darks:
        print(f"  y={y_pct*100:5.1f}%: dark x={darks[0]}-{darks[-1]} ({darks[0]/w*100:.1f}%-{darks[-1]/w*100:.1f}%), count={len(darks)}")

# === Look for colored accent elements (non-gray) ===
print("\n=== COLORED (NON-GRAY) PIXEL DETECTION ===")
for y_pct in range(0, 100, 2):
    py = int(h * y_pct / 100)
    colored = []
    for px in range(0, w, 2):
        r, g, b = int(arr[py, px, 0]), int(arr[py, px, 1]), int(arr[py, px, 2])
        # Check for saturation - significant difference between channels
        max_c = max(r, g, b)
        min_c = min(r, g, b)
        if max_c > 30 and (max_c - min_c) > 30:
            colored.append((px, r, g, b))
    if colored:
        samples = colored[:3] + colored[-3:] if len(colored) > 6 else colored
        sample_str = ", ".join([f"x={c[0]}:RGB({c[1]},{c[2]},{c[3]})" for c in samples])
        print(f"  y={y_pct}%: {len(colored)} colored pixels - {sample_str}")

# === HORIZONTAL LINE SCAN on the back (white) card ===
# Look for thin horizontal elements within the white region
print("\n=== BACK CARD: HORIZONTAL LINE/ELEMENT DETECTION ===")
# First identify the white card bounding box
white_top = None
white_bottom = None
white_left = w
white_right = 0
for y in range(h):
    row = arr[y, :, :3]
    bright = np.where((row[:, 0] > 220) & (row[:, 1] > 220) & (row[:, 2] > 220))[0]
    if len(bright) > 50:
        if white_top is None:
            white_top = y
        white_bottom = y
        white_left = min(white_left, bright[0])
        white_right = max(white_right, bright[-1])

if white_top is not None:
    print(f"  White card bounds: y={white_top}-{white_bottom}, x={white_left}-{white_right}")
    print(f"  As percentages: y={white_top/h*100:.1f}%-{white_bottom/h*100:.1f}%, x={white_left/w*100:.1f}%-{white_right/w*100:.1f}%")
    
    # Scan within white card for non-white elements (text, lines)
    print("\n  --- Elements within white card ---")
    prev_has_dark = False
    block_start = None
    blocks = []
    for y in range(white_top, white_bottom + 1):
        # Only look within white card horizontal bounds
        row_slice = arr[y, white_left:white_right, :3]
        # Find pixels significantly darker than white
        dark_mask = np.mean(row_slice, axis=1) < 180
        dark_count = np.sum(dark_mask)
        has_dark = dark_count > 3
        
        if has_dark and not prev_has_dark:
            block_start = y
        elif not has_dark and prev_has_dark and block_start is not None:
            blocks.append((block_start, y))
            block_start = None
        prev_has_dark = has_dark
    
    if block_start is not None:
        blocks.append((block_start, white_bottom))
    
    for start, end in blocks:
        mid_y = (start + end) // 2
        row_slice = arr[mid_y, white_left:white_right, :3]
        dark_mask = np.mean(row_slice, axis=1) < 180
        dark_indices = np.where(dark_mask)[0]
        if len(dark_indices) > 0:
            abs_left = white_left + dark_indices[0]
            abs_right = white_left + dark_indices[-1]
            height = end - start
            # Sample color
            sample_idx = dark_indices[len(dark_indices) // 2]
            sample_color = tuple(arr[mid_y, white_left + sample_idx, :3])
            
            # Calculate relative position within white card
            rel_y_start = (start - white_top) / (white_bottom - white_top) * 100
            rel_y_end = (end - white_top) / (white_bottom - white_top) * 100
            rel_x_start = dark_indices[0] / (white_right - white_left) * 100
            rel_x_end = dark_indices[-1] / (white_right - white_left) * 100
            
            print(f"    Block y={start}-{end} (rel {rel_y_start:.1f}%-{rel_y_end:.1f}%), h={height}px, "
                  f"x={abs_left}-{abs_right} (rel {rel_x_start:.1f}%-{rel_x_end:.1f}%), "
                  f"color=RGB{sample_color}, dark_px={len(dark_indices)}")

# === FRONT CARD: Find the dark card region and scan for lighter elements ===
print("\n=== FRONT CARD: ELEMENT DETECTION ===")
# The front card is the dark region - find it
dark_top = None
dark_bottom = None
dark_left = w
dark_right = 0
for y in range(h):
    row = arr[y, :, :3]
    dark = np.where((row[:, 0] < 80) & (row[:, 1] < 80) & (row[:, 2] < 80))[0]
    if len(dark) > 100:
        if dark_top is None:
            dark_top = y
        dark_bottom = y
        dark_left = min(dark_left, dark[0])
        dark_right = max(dark_right, dark[-1])

if dark_top is not None:
    print(f"  Dark card bounds: y={dark_top}-{dark_bottom}, x={dark_left}-{dark_right}")
    print(f"  As percentages: y={dark_top/h*100:.1f}%-{dark_bottom/h*100:.1f}%, x={dark_left/w*100:.1f}%-{dark_right/w*100:.1f}%")
    
    # Within the dark card, look for lighter elements (text, accent lines)
    print("\n  --- Light elements within dark card ---")
    prev_has_light = False
    block_start = None
    blocks = []
    for y in range(dark_top, dark_bottom + 1):
        row_slice = arr[y, dark_left:dark_right, :3]
        # Find pixels significantly brighter than dark bg
        bright_mask = np.mean(row_slice, axis=1) > 120
        bright_count = np.sum(bright_mask)
        has_light = bright_count > 3
        
        if has_light and not prev_has_light:
            block_start = y
        elif not has_light and prev_has_light and block_start is not None:
            blocks.append((block_start, y))
            block_start = None
        prev_has_light = has_light
    
    if block_start is not None:
        blocks.append((block_start, dark_bottom))
    
    for start, end in blocks:
        mid_y = (start + end) // 2
        row_slice = arr[mid_y, dark_left:dark_right, :3]
        bright_mask = np.mean(row_slice, axis=1) > 120
        bright_indices = np.where(bright_mask)[0]
        if len(bright_indices) > 0:
            abs_left = dark_left + bright_indices[0]
            abs_right = dark_left + bright_indices[-1]
            height = end - start
            sample_idx = bright_indices[len(bright_indices) // 2]
            sample_color = tuple(arr[mid_y, dark_left + sample_idx, :3])
            
            rel_y_start = (start - dark_top) / (dark_bottom - dark_top) * 100
            rel_y_end = (end - dark_top) / (dark_bottom - dark_top) * 100
            
            print(f"    Block y={start}-{end} (rel {rel_y_start:.1f}%-{rel_y_end:.1f}%), h={height}px, "
                  f"x={abs_left}-{abs_right}, color=RGB{sample_color}, bright_px={len(bright_indices)}")

# === Detailed color analysis of detected elements ===
print("\n=== UNIQUE COLOR CLUSTERS IN IMAGE ===")
# Sample every 4th pixel for efficiency
sampled = arr[::4, ::4, :3].reshape(-1, 3)
# Find unique-ish colors by rounding to nearest 10
rounded = (sampled // 10) * 10
unique_colors = {}
for c in rounded:
    key = tuple(c)
    unique_colors[key] = unique_colors.get(key, 0) + 1

# Sort by frequency
sorted_colors = sorted(unique_colors.items(), key=lambda x: -x[1])
print("  Top 30 color clusters (rounded to nearest 10):")
for color, count in sorted_colors[:30]:
    pct = count / len(sampled) * 100
    print(f"    RGB{color}: {count} pixels ({pct:.1f}%)")
