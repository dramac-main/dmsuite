"""
Fix FONT_STACKS.geometric hardcodes in business-card-adapter.ts:
- Front layout functions: replace with `ff` parameter
- Back layout callbacks: replace with `cfg.fontFamily`
- Keep FONT_STACKS.serif for deliberate design choices (monograms)
"""

FILE = r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts"

with open(FILE, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Front layout functions: FONT_STACKS.geometric → ff
front_lines = [807, 1197, 1606, 2323, 2757, 2975]

# Back layout callbacks: FONT_STACKS.geometric → cfg.fontFamily
back_lines = [900, 1332, 1724, 2417, 2913, 3113]

changes = 0

for ln in front_lines:
    idx = ln - 1
    old = lines[idx]
    if 'FONT_STACKS.geometric' in old:
        new = old.replace('FONT_STACKS.geometric', 'ff')
        print(f"  FRONT L{ln}: {old.rstrip()}")
        print(f"          -> {new.rstrip()}")
        lines[idx] = new
        changes += 1
    else:
        print(f"  WARNING L{ln}: FONT_STACKS.geometric NOT FOUND: {old.rstrip()}")

for ln in back_lines:
    idx = ln - 1
    old = lines[idx]
    if 'FONT_STACKS.geometric' in old:
        new = old.replace('FONT_STACKS.geometric', 'cfg.fontFamily')
        print(f"  BACK L{ln}: {old.rstrip()}")
        print(f"         -> {new.rstrip()}")
        lines[idx] = new
        changes += 1
    else:
        print(f"  WARNING L{ln}: FONT_STACKS.geometric NOT FOUND: {old.rstrip()}")

# Also fix the back layout serif references (line 901) to use cfg.fontFamily
# Line 901 is in monogram-luxe back layout - FONT_STACKS.serif
# Line 808 is in monogram-luxe front layout - FONT_STACKS.serif (keep as ff for user font)
for ln in [808]:
    idx = ln - 1
    old = lines[idx]
    if 'FONT_STACKS.serif' in old:
        new = old.replace('FONT_STACKS.serif', 'ff')
        print(f"  FRONT-SERIF L{ln}: {old.rstrip()}")
        print(f"               -> {new.rstrip()}")
        lines[idx] = new
        changes += 1

for ln in [901]:
    idx = ln - 1
    old = lines[idx]
    if 'FONT_STACKS.serif' in old:
        new = old.replace('FONT_STACKS.serif', 'cfg.fontFamily')
        print(f"  BACK-SERIF L{ln}: {old.rstrip()}")
        print(f"              -> {new.rstrip()}")
        lines[idx] = new
        changes += 1

print(f"\nTotal changes: {changes}")

with open(FILE, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("File saved.")
