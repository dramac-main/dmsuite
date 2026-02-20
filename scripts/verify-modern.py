#!/usr/bin/env python3
"""Verify Modern templates are in place."""

with open(r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

layouts = ['layoutCyanTech', 'layoutCorporateChevron', 'layoutZigzagOverlay',
           'layoutHexSplit', 'layoutDotCircle', 'layoutWaveGradient']
backs = ['cyan-tech', 'corporate-chevron', 'zigzag-overlay',
         'hex-split', 'dot-circle', 'wave-gradient']

print("=== Layout Functions ===")
for name in layouts:
    found = [(i+1, l.strip()[:70]) for i, l in enumerate(lines) if f'function {name}(' in l]
    print(f"  {name}: {'OK at line ' + str(found[0][0]) if found else 'MISSING!'}")

print("\n=== Back Layouts ===")
for tid in backs:
    found = [(i+1) for i, l in enumerate(lines) if f'registerBackLayout("{tid}"' in l]
    print(f"  {tid}: {'OK at line ' + str(found[0]) if found else 'MISSING!'}")

print(f"\nTotal lines: {len(lines)}")

# Check section markers
for i, l in enumerate(lines):
    if "MODERN TEMPLATES" in l and "====" in l:
        print(f"MODERN marker at line {i+1}")
    if "CLASSIC" in l and "====" in l:
        print(f"CLASSIC marker at line {i+1}")
