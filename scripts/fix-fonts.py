"""
Fix all FONT_STACKS.geometric hardcodes in business-card-adapter.ts

This script replaces hardcoded font family references with the proper
parameter-based font family, so user font selection actually works.
"""

import re

filepath = r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# ============================================================
# FRONT LAYOUT: const font = FONT_STACKS.geometric → const font = ff
# These are inside layoutXxx functions that receive ff as a parameter
# ============================================================
front_font_lines = [672, 1191, 1398, 1598, 1814, 2030, 2314, 2521, 2746, 2964]

# ============================================================
# BACK LAYOUT: const font = FONT_STACKS.geometric → const font = cfg.fontFamily
# These are inside registerBackLayout callbacks
# ============================================================
back_font_lines = [714, 1046, 1326, 1473, 1716, 1926, 2155, 2408, 2630, 2902, 3102]

# ============================================================
# FRONT LAYOUT (Classic): const ff = FONT_STACKS.geometric → DELETE
# In templates 13-18 where ff is already a parameter (was _ff, now renamed to ff)
# ============================================================
front_ff_delete_lines = [3175, 3334, 3499, 3647, 3808, 3938]

# ============================================================
# BACK LAYOUT (Classic): const ff = FONT_STACKS.geometric → const ff = cfg.fontFamily
# ============================================================
back_ff_lines = [3264, 3424, 3591, 3763, 3894, 4023]

# ============================================================
# MONOGRAM LUXE FRONT: const sansFont = FONT_STACKS.geometric → const sansFont = ff
# (keep serifFont for monogram letter only, which is design-specific)
# ============================================================
# Lines 803-804 in monogram-luxe front
# Lines 896-897 in monogram-luxe back

changes_made = 0

for i, line in enumerate(lines):
    line_num = i + 1  # 1-indexed
    
    if line_num in front_font_lines:
        old = lines[i]
        lines[i] = lines[i].replace('FONT_STACKS.geometric', 'ff')
        if old != lines[i]:
            changes_made += 1
            print(f"L{line_num}: FRONT font → ff")
    
    elif line_num in back_font_lines:
        old = lines[i]
        lines[i] = lines[i].replace('FONT_STACKS.geometric', 'cfg.fontFamily')
        if old != lines[i]:
            changes_made += 1
            print(f"L{line_num}: BACK font → cfg.fontFamily")
    
    elif line_num in front_ff_delete_lines:
        old = lines[i]
        if 'const ff = FONT_STACKS.geometric' in lines[i]:
            # Delete this line (replace with empty line to not shift line numbers)
            lines[i] = ''
            changes_made += 1
            print(f"L{line_num}: DELETED const ff = FONT_STACKS.geometric (ff is now a param)")
    
    elif line_num in back_ff_lines:
        old = lines[i]
        lines[i] = lines[i].replace('FONT_STACKS.geometric', 'cfg.fontFamily')
        if old != lines[i]:
            changes_made += 1
            print(f"L{line_num}: BACK ff → cfg.fontFamily")

# Handle monogram-luxe front (sansFont = FONT_STACKS.geometric → sansFont = ff)
# Find it precisely
for i, line in enumerate(lines):
    line_num = i + 1
    if 'const sansFont = FONT_STACKS.geometric' in line:
        # Check if it's the front (near layoutMonogramLuxe function def) or back (near registerBackLayout)
        # Look back up to 15 lines for context
        is_back = False
        for j in range(max(0, i-15), i):
            if 'registerBackLayout' in lines[j]:
                is_back = True
                break
        
        if is_back:
            lines[i] = lines[i].replace('FONT_STACKS.geometric', 'cfg.fontFamily')
            changes_made += 1
            print(f"L{line_num}: BACK monogram sansFont → cfg.fontFamily")
        else:
            lines[i] = lines[i].replace('FONT_STACKS.geometric', 'ff')
            changes_made += 1
            print(f"L{line_num}: FRONT monogram sansFont → ff")

# Note: We keep FONT_STACKS.serif for monogram letter (design-specific)
# but for back layout's serifFont we should use cfg.fontFamily
for i, line in enumerate(lines):
    line_num = i + 1
    if 'const serifFont = FONT_STACKS.serif' in line:
        is_back = False
        for j in range(max(0, i-15), i):
            if 'registerBackLayout' in lines[j]:
                is_back = True
                break
        
        if is_back:
            # Back layout monogram serif → also use cfg.fontFamily (user's choice)
            lines[i] = lines[i].replace('FONT_STACKS.serif', 'cfg.fontFamily')
            changes_made += 1
            print(f"L{line_num}: BACK monogram serifFont → cfg.fontFamily")
        # else: keep serif for front monogram letter (design-specific element)

print(f"\nTotal changes: {changes_made}")

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print("File written successfully.")
