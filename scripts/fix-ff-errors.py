"""
Fix TypeScript errors in business-card-adapter.ts:
1. Replace `ff` with `cfg.fontFamily` inside registerBackLayout callbacks for 5 templates
2. Remove `const ff = ff;` line in diamond-brand front layout
"""
import re

FILE = r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts"

with open(FILE, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Error lines (1-indexed) where `ff` needs to become `cfg.fontFamily`
# These are all inside registerBackLayout callbacks
ff_error_lines = [
    3292, 3298, 3308, 3322, 3329,  # circle-brand back
    3476, 3482, 3494,              # full-color-back back
    3626, 3632, 3642,              # engineering-pro back
    3784, 3790, 3802,              # clean-accent back
    3915, 3921, 3932,              # nature-clean back
]

changes = 0
for line_num in ff_error_lines:
    idx = line_num - 1  # 0-indexed
    old = lines[idx]
    # Replace ff that appears as a value (not part of another word)
    # Patterns: `1.0, ff)` or `fontFamily: ff,` or `ff)` at end
    new = re.sub(r'\bff\b', 'cfg.fontFamily', old)
    if new != old:
        print(f"  L{line_num}: {old.rstrip()}")
        print(f"       -> {new.rstrip()}")
        lines[idx] = new
        changes += 1

# Fix line 3950: `const ff = ff;` — remove it entirely
idx_3950 = 3950 - 1
line_3950 = lines[idx_3950]
if 'const ff = ff' in line_3950:
    print(f"  L3950: REMOVING: {line_3950.rstrip()}")
    lines[idx_3950] = ""  # Remove the line
    changes += 1

print(f"\nTotal changes: {changes}")

with open(FILE, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("File saved.")
