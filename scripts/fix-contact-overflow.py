"""
Add maxY parameter to all contactWithIcons calls in business-card-adapter.ts.
This ensures contact blocks don't overflow past the card bottom edge.
maxY = H * 0.95 leaves a 30px bottom margin for safety.
"""

FILE = r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts"

with open(FILE, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Lines containing contactWithIcons calls (minus import)
call_lines = [3244, 3398, 3592, 3851, 4202, 4357, 4513, 4653, 4867, 4990, 5547, 5689, 5775, 5843]

changes = 0
for ln in call_lines:
    idx = ln - 1
    # Find the closing })); or })) for the contactWithIcons call
    # Search forward from the call line
    for k in range(idx, min(idx + 20, len(lines))):
        line = lines[k]
        # Look for the closing of the opts object (before the final ))
        # Pattern: something like `  }));` or `  }));`
        if '}));' in line or '}))' in line:
            # Check if maxY is already present in the block
            block = ''.join(lines[idx:k+1])
            if 'maxY' in block:
                print(f"  SKIP L{ln}: maxY already present")
                break
            
            # Insert maxY before the closing
            stripped = line.rstrip()
            # Find the closing })); and insert maxY before it
            # We need to add maxY as a property in the opts object
            # The pattern is typically:
            #   tags: ["..."],
            # }));
            # So we add maxY before the }))
            
            # Find the last property line before closing
            prev_line_idx = k - 1
            prev_line = lines[prev_line_idx]
            
            # Get indentation from the property lines
            prop_indent = prev_line[:len(prev_line) - len(prev_line.lstrip())]
            
            # Add trailing comma to prev line if needed
            prev_stripped = prev_line.rstrip()
            if not prev_stripped.endswith(','):
                lines[prev_line_idx] = prev_stripped + ',\n'
            
            # Insert maxY line
            lines.insert(k, f"{prop_indent}maxY: H * 0.95,\n")
            changes += 1
            print(f"  ADDED maxY at L{k+1} (for contactWithIcons at L{ln})")
            
            # Adjust remaining line numbers since we inserted a line
            for j in range(len(call_lines)):
                if call_lines[j] > ln:
                    call_lines[j] += 1
            break

print(f"\nTotal changes: {changes}")

with open(FILE, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("File saved.")
