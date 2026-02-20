"""
Fix logo/company duplication in business-card-adapter.ts.

Rule: When cfg.logoUrl is present, hide the company name text layer
that appears adjacent to the logo (it's redundant — the logo IS the brand).
Only show company text when no logo is uploaded (as a fallback).

Pattern: Wrap `layers.push(styledText({ name: "Company", ... }));` in
`if (!cfg.logoUrl) { ... }` when it's adjacent to a buildWatermarkLogo call.
"""
import re

FILE = r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()
    lines = content.split('\n')

# Find all buildWatermarkLogo call line numbers (0-indexed)
logo_lines = []
for i, line in enumerate(lines):
    if 'buildWatermarkLogo' in line and 'import' not in line and '//' not in line.split('buildWatermarkLogo')[0]:
        logo_lines.append(i)

print(f"Found {len(logo_lines)} buildWatermarkLogo calls")

# For each logo call, find nearby Company text (within 20 lines)
# and wrap it in if (!cfg.logoUrl) { ... }
changes = []
for logo_idx in logo_lines:
    # Search +/- 25 lines for name: "Company"
    search_start = max(0, logo_idx - 25)
    search_end = min(len(lines), logo_idx + 25)
    
    for j in range(search_start, search_end):
        if 'name: "Company"' in lines[j]:
            # Found a Company text near a logo call
            # Now trace back to find the layers.push(styledText({ line
            push_start = None
            for k in range(j, max(j - 5, 0), -1):
                if 'layers.push(styledText({' in lines[k]:
                    push_start = k
                    break
            
            if push_start is None:
                print(f"  WARNING: Could not find layers.push(styledText({{ for Company at line {j+1}")
                continue
            
            # Now find the closing })); 
            push_end = None
            brace_count = 0
            for k in range(push_start, min(push_start + 15, len(lines))):
                brace_count += lines[k].count('{') - lines[k].count('}')
                if '}));' in lines[k] and brace_count <= 0:
                    push_end = k
                    break
            
            if push_end is None:
                print(f"  WARNING: Could not find closing }})); for Company at line {j+1}")
                continue
            
            # Check if already wrapped in if (!cfg.logoUrl)
            prev_line = lines[push_start - 1].strip() if push_start > 0 else ""
            if 'cfg.logoUrl' in prev_line:
                print(f"  SKIP: Company at line {j+1} already has logoUrl conditional")
                continue
            
            changes.append((push_start, push_end, logo_idx + 1, j + 1))
            print(f"  MATCH: buildWatermarkLogo at L{logo_idx+1}, Company text at L{j+1} (push L{push_start+1}-L{push_end+1})")
            break  # Only one Company text per logo call

print(f"\nTotal changes to make: {len(changes)}")

# Apply changes in REVERSE order (bottom to top) to preserve line numbers
changes.sort(key=lambda x: x[0], reverse=True)

for push_start, push_end, logo_ln, company_ln in changes:
    # Get the base indentation of the layers.push line
    indent = lines[push_start][:len(lines[push_start]) - len(lines[push_start].lstrip())]
    
    # Add 2 spaces of extra indentation to each line in the block
    for k in range(push_start, push_end + 1):
        lines[k] = '  ' + lines[k]
    
    # Insert opening conditional before the block
    lines.insert(push_start, f"{indent}if (!cfg.logoUrl) {{")
    
    # Insert closing brace after the block (push_end shifted by 1 due to insert)
    lines.insert(push_end + 2, f"{indent}}}")

# Write back
with open(FILE, "w", encoding="utf-8") as f:
    f.write('\n'.join(lines))

print(f"\nApplied {len(changes)} conditional wrappings. File saved.")
