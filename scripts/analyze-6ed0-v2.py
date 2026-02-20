from PIL import Image
import numpy as np

img = Image.open(r'd:\dramac-ai-suite\business-card-examples\6ed0ec5d9a915d54a12b7bd525d0a382.jpg')
w, h = img.size
arr = np.array(img)

# The image is a 3D perspective mockup.
# White card region: approx y=476-847, x=340-1088
# Front card: dark with teal-blue tones overlapping the left portion

# ============================================================
# PART 1: DETAILED ANALYSIS OF THE WHITE (BACK) CARD
# ============================================================
print("=" * 80)
print("PART 1: WHITE (BACK) CARD - DETAILED ELEMENT ANALYSIS")
print("=" * 80)

# The white card is a parallelogram due to perspective
# Let's trace its exact edges
print("\n--- White Card Edge Tracing ---")
for y in range(400, 900, 5):
    if y >= h:
        break
    row = arr[y, :, :3]
    whites = np.where((row[:, 0] > 210) & (row[:, 1] > 210) & (row[:, 2] > 210))[0]
    if len(whites) > 20:
        print(f"  y={y} ({y/h*100:.1f}%): white from x={whites[0]}-{whites[-1]} ({whites[0]/w*100:.1f}%-{whites[-1]/w*100:.1f}%), count={len(whites)}")

# Within the white card, find all dark elements with VERY tight threshold
print("\n--- White Card: Text Element Detection (threshold < 150) ---")
# Define white card region more precisely
wc_top, wc_bottom = 476, 847
wc_left, wc_right = 340, 1088

prev_has_text = False
block_start = None
text_blocks = []

for y in range(wc_top, wc_bottom + 1):
    row = arr[y, wc_left:wc_right, :3].astype(float)
    # Only check pixels that are within the white region
    is_white_bg = (row[:, 0] > 200) & (row[:, 1] > 200) & (row[:, 2] > 200)
    is_dark_element = np.mean(row, axis=1) < 150
    # Dark elements on white background
    dark_on_white_count = np.sum(is_dark_element)
    has_text = dark_on_white_count > 2
    
    if has_text and not prev_has_text:
        block_start = y
    elif not has_text and prev_has_text and block_start is not None:
        text_blocks.append((block_start, y))
        block_start = None
    prev_has_text = has_text

if block_start is not None:
    text_blocks.append((block_start, wc_bottom))

print(f"\n  Found {len(text_blocks)} text blocks on white card:")
for i, (start, end) in enumerate(text_blocks):
    mid_y = (start + end) // 2
    row = arr[mid_y, wc_left:wc_right, :3]
    dark_mask = np.mean(row.astype(float), axis=1) < 150
    dark_indices = np.where(dark_mask)[0]
    
    height = end - start
    rel_y_start = (start - wc_top) / (wc_bottom - wc_top) * 100
    rel_y_end = (end - wc_top) / (wc_bottom - wc_top) * 100
    
    if len(dark_indices) > 0:
        abs_left = wc_left + dark_indices[0]
        abs_right = wc_left + dark_indices[-1]
        # Sample multiple colors from this block
        colors = []
        for dy in range(start, end, max(1, (end - start) // 3)):
            r_slice = arr[dy, wc_left:wc_right, :3]
            d_mask = np.mean(r_slice.astype(float), axis=1) < 150
            d_idx = np.where(d_mask)[0]
            if len(d_idx) > 0:
                sample_x = wc_left + d_idx[len(d_idx) // 2]
                colors.append(tuple(arr[dy, sample_x, :3]))
        
        print(f"\n  Block {i+1}: y={start}-{end} (card-rel {rel_y_start:.1f}%-{rel_y_end:.1f}%)")
        print(f"    Height: {height}px")
        print(f"    X range: {abs_left}-{abs_right} (abs)")
        print(f"    Dark pixel count: {len(dark_indices)}")
        print(f"    Sample colors: {colors[:5]}")
    else:
        print(f"\n  Block {i+1}: y={start}-{end} (card-rel {rel_y_start:.1f}%-{rel_y_end:.1f}%), h={height}px, NO dark pixels at mid")

# ============================================================
# PART 2: DETAILED ANALYSIS OF THE FRONT (DARK) CARD  
# ============================================================
print("\n" + "=" * 80)
print("PART 2: FRONT (DARK) CARD - DETAILED ELEMENT ANALYSIS")
print("=" * 80)

# The front card has a teal/blue-gray gradient
# Look for the teal-toned region
print("\n--- Front Card: Teal/Blue-Gray Region Detection ---")
for y in range(0, h, 20):
    row = arr[y, :, :3].astype(int)
    # Teal = blue > red, green > red
    teal_mask = (row[:, 2] > row[:, 0] + 5) & (row[:, 1] > row[:, 0] + 5) & (row[:, 0] > 50)
    teal_indices = np.where(teal_mask)[0]
    if len(teal_indices) > 10:
        sample = arr[y, teal_indices[len(teal_indices)//2], :3]
        print(f"  y={y} ({y/h*100:.1f}%): teal x={teal_indices[0]}-{teal_indices[-1]}, count={len(teal_indices)}, sample=RGB{tuple(sample)}")

# The front dark card seems to be in the upper-left quadrant
# Let me analyze specific regions for text
print("\n--- Front Card: Bright Element Scan (looking for white/light text) ---")
# Focus on the dark teal region roughly y=250-780, x=0-600
fc_top, fc_bottom = 250, 780
fc_left, fc_right = 0, 600

prev_has_bright = False
block_start = None
bright_blocks = []

for y in range(fc_top, fc_bottom + 1):
    row = arr[y, fc_left:fc_right, :3].astype(float)
    # Look for very bright pixels (white text on dark bg)
    bright_mask = np.mean(row, axis=1) > 180
    bright_count = np.sum(bright_mask)
    has_bright = bright_count > 2
    
    if has_bright and not prev_has_bright:
        block_start = y
    elif not has_bright and prev_has_bright and block_start is not None:
        bright_blocks.append((block_start, y))
        block_start = None
    prev_has_bright = has_bright

if block_start is not None:
    bright_blocks.append((block_start, fc_bottom))

print(f"\n  Found {len(bright_blocks)} bright blocks on front card region:")
for i, (start, end) in enumerate(bright_blocks):
    mid_y = (start + end) // 2
    row = arr[mid_y, fc_left:fc_right, :3]
    bright_mask = np.mean(row.astype(float), axis=1) > 180
    bright_indices = np.where(bright_mask)[0]
    
    height = end - start
    if len(bright_indices) > 0:
        abs_left = fc_left + bright_indices[0]
        abs_right = fc_left + bright_indices[-1]
        sample = tuple(arr[mid_y, fc_left + bright_indices[len(bright_indices)//2], :3])
        print(f"    Block {i+1}: y={start}-{end}, h={height}px, x={abs_left}-{abs_right}, color={sample}, bright_px={len(bright_indices)}")

# ============================================================
# PART 3: DETAILED SCAN OF THE VISIBLE WHITE CARD TEXT
# ============================================================
print("\n" + "=" * 80)
print("PART 3: WHITE CARD - LINE-BY-LINE DARK ELEMENT DETAIL")
print("=" * 80)

# Scan every row of the white card for dark elements with fine granularity
print("\n--- Row-by-row dark element scan (every 2 rows) ---")
for y in range(wc_top, wc_bottom, 2):
    row = arr[y, :, :3].astype(float)
    # Check each pixel: is it on white background AND dark?
    white_bg = (row[:, 0] > 200) | (row[:, 1] > 200) | (row[:, 2] > 200)  # broader white check
    dark_element = np.mean(row, axis=1) < 120  # strict dark threshold
    combined = dark_element  # just look for dark pixels in the card region
    
    # Only within white card x bounds
    card_dark = np.zeros(w, dtype=bool)
    card_dark[wc_left:wc_right] = combined[wc_left:wc_right]
    dark_indices = np.where(card_dark)[0]
    
    if len(dark_indices) > 2:
        sample = tuple(arr[y, dark_indices[len(dark_indices)//2], :3])
        span = dark_indices[-1] - dark_indices[0]
        print(f"  y={y} ({y/h*100:.1f}%): dark x={dark_indices[0]}-{dark_indices[-1]}, span={span}px, count={len(dark_indices)}, color=RGB{sample}")

# ============================================================
# PART 4: DETAILED TEAL GRADIENT ON FRONT CARD
# ============================================================
print("\n" + "=" * 80)
print("PART 4: FRONT CARD TEAL GRADIENT - VERTICAL PROFILE")
print("=" * 80)

# Sample the teal gradient vertically at x=300 (center of front card)
for x_sample in [200, 300, 400]:
    print(f"\n  Vertical profile at x={x_sample}:")
    for y in range(200, 800, 10):
        if y < h:
            r, g, b = arr[y, x_sample, :3]
            print(f"    y={y} ({y/h*100:.1f}%): RGB({r},{g},{b})")

# ============================================================
# PART 5: LOOK FOR ACCENT LINE ON FRONT CARD
# ============================================================
print("\n" + "=" * 80)
print("PART 5: FRONT CARD ACCENT LINE / DIVIDER DETECTION")
print("=" * 80)

# Look for a thin horizontal line that's different from the gradient
# Check for sudden brightness changes (line would be brighter or darker)
print("\n--- Horizontal brightness change detection ---")
for x_check in [200, 250, 300, 350, 400]:
    print(f"\n  At x={x_check}:")
    prev_brightness = None
    for y in range(200, 800):
        r, g, b = int(arr[y, x_check, 0]), int(arr[y, x_check, 1]), int(arr[y, x_check, 2])
        brightness = (r + g + b) / 3
        if prev_brightness is not None:
            diff = abs(brightness - prev_brightness)
            if diff > 15:  # significant change
                print(f"    y={y}: brightness jump {prev_brightness:.0f} -> {brightness:.0f} (diff={diff:.0f}), RGB({r},{g},{b})")
        prev_brightness = brightness
