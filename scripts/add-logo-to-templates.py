#!/usr/bin/env python3
"""
Add buildWatermarkLogo to all 15 front layout functions that are missing it.
Also add if (!cfg.logoUrl) guards around company text for 3 templates.
"""
import re, sys

FILE = r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
original_count = len(lines)

# ── HELPERS ──────────────────────────────────────────────────────────────────

def find_function_range(func_name: str):
    """Find the start line and the 'return layers;' line for a layout function."""
    start = None
    for i, line in enumerate(lines):
        if f"function {func_name}(" in line:
            start = i
            break
    if start is None:
        print(f"  ⚠ Could not find function {func_name}")
        return None, None

    # Find the 'return layers;' line within the function
    brace_depth = 0
    for i in range(start, len(lines)):
        brace_depth += lines[i].count("{") - lines[i].count("}")
        stripped = lines[i].strip()
        if stripped == "return layers;" and brace_depth <= 1:
            return start, i

    print(f"  ⚠ Could not find 'return layers;' for {func_name}")
    return start, None


def insert_before_return(func_name: str, code_lines: list[str]):
    """Insert code lines before the 'return layers;' in the given function."""
    _, ret_line = find_function_range(func_name)
    if ret_line is None:
        return False

    # Insert the code lines before the return statement
    for j, cl in enumerate(code_lines):
        lines.insert(ret_line + j, cl)
    print(f"  ✓ Inserted {len(code_lines)} lines before return in {func_name}")
    return True


def wrap_company_with_guard(func_name: str, company_name_text: str):
    """Find company text push in function and wrap with if (!cfg.logoUrl) guard."""
    start, ret_line = find_function_range(func_name)
    if start is None or ret_line is None:
        return False

    # Search for the company push line within the function
    for i in range(start, ret_line + 10):
        if company_name_text in lines[i]:
            # Find the start of this layers.push block
            push_start = i
            while push_start > start and "layers.push(" not in lines[push_start]:
                push_start -= 1

            # Check if already guarded
            prev_line = lines[push_start - 1].strip() if push_start > 0 else ""
            if "if (!cfg.logoUrl)" in prev_line:
                print(f"  ⓘ {func_name} company already guarded")
                return True

            # Find the comment line above the push
            comment_line = push_start - 1
            while comment_line > start and lines[comment_line].strip() == "":
                comment_line -= 1
            if lines[comment_line].strip().startswith("//"):
                push_start = comment_line

            # Find end of the push block (closing });)
            push_end = i
            paren_depth = 0
            for j in range(i, min(i + 30, len(lines))):
                paren_depth += lines[j].count("(") - lines[j].count(")")
                if "}));" in lines[j] or (paren_depth <= 0 and lines[j].strip().endswith("));")):
                    push_end = j
                    break

            # Insert guard
            lines.insert(push_start, "  if (!cfg.logoUrl) {")
            lines.insert(push_end + 2, "  }")
            print(f"  ✓ Added if (!cfg.logoUrl) guard in {func_name}")
            return True

    print(f"  ⚠ Could not find company text '{company_name_text}' in {func_name}")
    return False


# ── TEMPLATES TO FIX ─────────────────────────────────────────────────────────

# Each entry: (func_name, logo_x, logo_y, logo_size, logo_color, logo_opacity)
# All coordinates are expressions relative to W and H
templates_no_company = [
    # func_name, x_expr, y_expr, size_expr, color_expr
    ("layoutMonogramLuxe",     "W * 0.48",  "H * 0.72",  "H * 0.10",  "t.frontText"),
    ("layoutGeometricMark",    "W * 0.09",  "H * 0.06",  "H * 0.06",  "t.frontText"),
    ("layoutFrameMinimal",     "W * 0.75",  "H * 0.08",  "H * 0.08",  "t.frontText"),
    ("layoutSplitVertical",    "W * 0.70",  "H * 0.10",  "H * 0.10",  '"#FFFFFF"'),
    ("layoutDiagonalMono",     "W * 0.06",  "H * 0.08",  "H * 0.08",  "t.frontText"),
    ("layoutHexSplit",         "W * 0.45",  "H * 0.06",  "H * 0.10",  "t.frontText"),
    ("layoutFlowingLines",     "W * 0.08",  "H * 0.08",  "H * 0.10",  "t.frontText ?? t.frontBg"),
    ("layoutNeonWatermark",    "W * 0.08",  "H * 0.08",  "H * 0.10",  "t.accent"),
    ("layoutBlueprintTech",    "W * 0.15",  "H * 0.06",  "H * 0.10",  "t.frontText"),
    ("layoutDiagonalGold",     "W * 0.05",  "H * 0.05",  "H * 0.12",  "t.accent"),
    ("layoutLuxuryDivider",    "W * 0.20",  "H * 0.12",  "H * 0.12",  "t.frontText"),
    ("layoutGoldConstruct",    "W * 0.15",  "H * 0.05",  "H * 0.10",  '"#FFFFFF"'),
]

# Templates WITH company text that needs guarding
templates_with_company = [
    # func_name, x_expr, y_expr, size_expr, color_expr, company_marker_text
    ("layoutCorporateChevron", "W * 0.07", "H * 0.42", "H * 0.06", "t.accent || \"#1C1C1E\"", "Company Branding"),
    ("layoutZigzagOverlay",    "W * 0.03", "H * 0.07", "H * 0.06", '"#FFFFFF"', 'name: "Company"'),
    ("layoutDotCircle",        "W * 0.67", "H * 0.14", "H * 0.10", '"#FFFFFF"', "Logo Text"),
]

print("=== Adding buildWatermarkLogo to 15 templates ===\n")

changes = 0

# 1. Process templates WITHOUT company text (just insert logo before return)
for func_name, x_expr, y_expr, size_expr, color_expr in templates_no_company:
    print(f"\n[{func_name}]")
    code = [
        "",
        f"  // -- Logo watermark --",
        f"  layers.push(...buildWatermarkLogo(",
        f"    cfg.logoUrl, cfg.company || \"Co\",",
        f"    Math.round({x_expr}), Math.round({y_expr}),",
        f"    Math.round({size_expr}), {color_expr}, 1.0, ff",
        f"  ));",
    ]
    if insert_before_return(func_name, code):
        changes += 1

# 2. Process templates WITH company text (insert logo + add guard)
for func_name, x_expr, y_expr, size_expr, color_expr, company_marker in templates_with_company:
    print(f"\n[{func_name}]")

    # First add the logo before return
    code = [
        "",
        f"  // -- Logo watermark --",
        f"  layers.push(...buildWatermarkLogo(",
        f"    cfg.logoUrl, cfg.company || \"Co\",",
        f"    Math.round({x_expr}), Math.round({y_expr}),",
        f"    Math.round({size_expr}), {color_expr}, 1.0, ff",
        f"  ));",
    ]
    if insert_before_return(func_name, code):
        changes += 1

    # Then add the company guard
    wrap_company_with_guard(func_name, company_marker)

# ── WRITE BACK ───────────────────────────────────────────────────────────────

new_content = "\n".join(lines)
with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"\n=== Done! {changes} templates updated. Lines: {original_count} → {len(lines)} ===")
