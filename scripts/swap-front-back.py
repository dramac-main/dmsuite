"""
Script to swap front/back layouts for 11 templates that have their content reversed.
Also swaps theme frontBg↔backBg and frontText↔backText for those templates.
"""

import re
import sys
import os

SWAPPED = [
    "ultra-minimal", "geometric-mark", "split-vertical",
    "cyan-tech", "corporate-chevron", "hex-split",
    "diamond-brand", "flowing-lines", "blueprint-tech",
    "skyline-silhouette", "premium-crest",
]

# Map template ID → front function name
FUNC_NAMES = {
    "ultra-minimal": "layoutUltraMinimal",
    "geometric-mark": "layoutGeometricMark",
    "split-vertical": "layoutSplitVertical",
    "cyan-tech": "layoutCyanTech",
    "corporate-chevron": "layoutCorporateChevron",
    "hex-split": "layoutHexSplit",
    "diamond-brand": "layoutDiamondBrand",
    "flowing-lines": "layoutFlowingLines",
    "blueprint-tech": "layoutBlueprintTech",
    "skyline-silhouette": "layoutSkylineSilhouette",
    "premium-crest": "layoutPremiumCrest",
}


def find_matching_brace(content: str, open_pos: int) -> int:
    """Find position of matching closing brace, handling strings and comments."""
    assert content[open_pos] == '{', f"Expected '{{' at position {open_pos}, got '{content[open_pos]}'"
    depth = 1
    pos = open_pos + 1
    length = len(content)
    while depth > 0 and pos < length:
        ch = content[pos]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
        elif ch in ('"', "'"):
            quote = ch
            pos += 1
            while pos < length and content[pos] != quote:
                if content[pos] == '\\':
                    pos += 1
                pos += 1
        elif ch == '`':
            pos += 1
            while pos < length and content[pos] != '`':
                if content[pos] == '\\':
                    pos += 1
                elif content[pos] == '$' and pos + 1 < length and content[pos + 1] == '{':
                    # Template literal expression - skip recursively
                    pos += 1
                    # Find matching }
                    td = 1
                    pos += 1
                    while td > 0 and pos < length:
                        if content[pos] == '{': td += 1
                        elif content[pos] == '}': td -= 1
                        elif content[pos] == '`':
                            # Nested template literal
                            pos += 1
                            while pos < length and content[pos] != '`':
                                if content[pos] == '\\': pos += 1
                                pos += 1
                        pos += 1
                    continue  # Don't increment pos again
                pos += 1
        elif ch == '/' and pos + 1 < length:
            if content[pos + 1] == '/':
                # Line comment
                while pos < length and content[pos] != '\n':
                    pos += 1
            elif content[pos + 1] == '*':
                # Block comment
                pos += 2
                while pos + 1 < length and not (content[pos] == '*' and content[pos + 1] == '/'):
                    pos += 1
                pos += 1  # skip past /
        pos += 1
    return pos - 1  # position of the closing }


def find_front_function(content: str, func_name: str):
    """Find the front layout function: `function funcName(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {`"""
    pattern = rf'function {func_name}\('
    match = re.search(pattern, content)
    if not match:
        print(f"ERROR: Could not find function {func_name}")
        return None
    func_start = match.start()
    # Find opening brace
    brace_pos = content.find('{', match.end())
    if brace_pos == -1:
        print(f"ERROR: Could not find opening brace for {func_name}")
        return None
    brace_close = find_matching_brace(content, brace_pos)
    # Extract body (between braces)
    body = content[brace_pos + 1:brace_close]
    # Full function text (from 'function' to closing '}')
    full = content[func_start:brace_close + 1]
    return {
        'start': func_start,
        'end': brace_close + 1,
        'body': body,
        'full': full,
        'brace_start': brace_pos,
        'brace_end': brace_close,
    }


def find_back_registration(content: str, template_id: str):
    """Find registerBackLayout("template_id", (W, H, cfg, theme) => { ... });"""
    pattern = rf'registerBackLayout\("{re.escape(template_id)}"'
    match = re.search(pattern, content)
    if not match:
        print(f"ERROR: Could not find registerBackLayout for {template_id}")
        return None
    reg_start = match.start()
    # Find the arrow function body opening brace
    # Pattern: registerBackLayout("xxx", (W, H, cfg, theme) => {
    arrow_match = re.search(r'=>\s*\{', content[match.end():])
    if not arrow_match:
        print(f"ERROR: Could not find arrow function for {template_id}")
        return None
    brace_pos = match.end() + arrow_match.start() + arrow_match.group().index('{')
    brace_close = find_matching_brace(content, brace_pos)
    # The registration ends with });
    reg_end = brace_close + 1  # closing } of arrow function
    # Find the ); after the }
    rest = content[reg_end:]
    close_match = re.match(r'\s*\)\s*;', rest)
    if close_match:
        reg_end += close_match.end()
    # Extract body
    body = content[brace_pos + 1:brace_close]
    full = content[reg_start:reg_end]
    return {
        'start': reg_start,
        'end': reg_end,
        'body': body,
        'full': full,
        'brace_start': brace_pos,
        'brace_end': brace_close,
    }


def transform_back_to_front(body: str, template_id: str) -> str:
    """Transform back layout body to front layout body.
    Changes: cfg.contacts.xxx → cfg.xxx, cfg.fontFamily → ff, theme → t, remove back-element tags."""

    # Remove 'const t = theme;' line (we'll add our own theme lookup)
    body = re.sub(r'\n\s*const t = theme;\n', '\n', body)

    # Replace cfg.contacts.xxx with cfg.xxx (longer matches first)
    body = body.replace('cfg.contacts.linkedin', 'cfg.linkedin')
    body = body.replace('cfg.contacts.twitter', 'cfg.twitter')
    body = body.replace('cfg.contacts.instagram', 'cfg.instagram')
    body = body.replace('cfg.contacts.website', 'cfg.website')
    body = body.replace('cfg.contacts.address', 'cfg.address')
    body = body.replace('cfg.contacts.phone', 'cfg.phone')
    body = body.replace('cfg.contacts.email', 'cfg.email')

    # Replace contacts: cfg.contacts with contacts: extractContacts(cfg)
    body = re.sub(r'contacts:\s*cfg\.contacts\b', 'contacts: extractContacts(cfg)', body)

    # Replace cfg.fontFamily with ff
    body = body.replace('cfg.fontFamily', 'ff')

    # Replace FONT_STACKS.geometric with ff
    body = body.replace('FONT_STACKS.geometric', 'ff')

    # Replace theme.backXxx → t.frontXxx (longer matches first to avoid partial replace)
    body = body.replace('theme.backAccent', 't.accent')
    body = body.replace('theme.backBg', 't.frontBg')
    body = body.replace('theme.backText', 't.frontText')
    # Also handle theme.accent, theme.divider etc.
    body = body.replace('theme.accent', 't.accent')
    body = body.replace('theme.divider', 't.divider')
    body = body.replace('theme.contactText', 't.contactText')
    body = body.replace('theme.contactIcon', 't.contactIcon')
    body = body.replace('theme.frontText', 't.frontText')  # some back layouts reference frontText
    body = body.replace('theme.frontBg', 't.frontBg')
    body = body.replace('theme.frontBgAlt', 't.frontBgAlt')
    body = body.replace('theme.frontTextAlt', 't.frontTextAlt')

    # Also handle t.backXxx → t.frontXxx (for templates using const t = theme pattern)
    # Use markers to avoid double-replacement
    body = body.replace('t.backAccent', '___ACCENT___')
    body = body.replace('t.backBg', '___FRONT_BG___')
    body = body.replace('t.backText', '___FRONT_TEXT___')
    body = body.replace('___ACCENT___', 't.accent')
    body = body.replace('___FRONT_BG___', 't.frontBg')
    body = body.replace('___FRONT_TEXT___', 't.frontText')

    # Remove "back-element" from tags arrays
    body = re.sub(r',?\s*"back-element"\s*,?\s*', lambda m: ', ' if m.group().count(',') > 1 else '', body)
    # Clean up resulting empty or malformed tag arrays
    body = re.sub(r'\[\s*,\s*', '[', body)
    body = re.sub(r',\s*\]', ']', body)

    # Rename layers named "Back ..."
    body = body.replace('"Back Background"', '"Background"')
    body = re.sub(r'"Back ([^"]+)"', r'"\1"', body)

    # Add theme lookup at the beginning
    body = f'\n  const t = TEMPLATE_FIXED_THEMES["{template_id}"];\n' + body

    return body


def transform_front_to_back(body: str, template_id: str) -> str:
    """Transform front layout body to back layout body.
    Changes: ff → cfg.fontFamily, t → theme, t.frontXxx → theme.backXxx, add back-element tags."""

    # Handle TEMPLATE_FIXED_THEMES lookup → use theme parameter directly
    # Some templates use: const theme = TEMPLATE_FIXED_THEMES["xxx"]
    body = re.sub(r'\s*const theme = TEMPLATE_FIXED_THEMES\["[^"]+"\];\s*\n', '\n', body)
    # Some use: const t = TEMPLATE_FIXED_THEMES["xxx"]
    body = re.sub(r'const t = TEMPLATE_FIXED_THEMES\["[^"]+"\]', 'const t = theme', body)

    # Replace FONT_STACKS.geometric with cfg.fontFamily
    body = body.replace('FONT_STACKS.geometric', 'cfg.fontFamily')

    # Replace fontFamily: ff with fontFamily: cfg.fontFamily
    body = body.replace('fontFamily: ff', 'fontFamily: cfg.fontFamily')
    # Replace other ff references in function calls (buildWatermarkLogo etc.)
    # Be careful not to replace 'ff' inside words like 'off', 'staff', etc.
    # We target specific patterns:
    body = re.sub(r',\s*ff\)', ', cfg.fontFamily)', body)  # trailing ff in function calls
    body = re.sub(r',\s*ff,', ', cfg.fontFamily,', body)  # ff as middle arg
    body = re.sub(r':\s*ff\b', ': cfg.fontFamily', body)  # ff as value

    # Replace cfg.website → cfg.contacts.website (for front layouts that use contact fields)
    # Be careful: only replace direct cfg.xxx contact fields, not cfg.company etc.
    body = body.replace('cfg.website', 'cfg.contacts.website')
    body = body.replace('cfg.email', 'cfg.contacts.email')
    body = body.replace('cfg.phone', 'cfg.contacts.phone')
    body = body.replace('cfg.address', 'cfg.contacts.address')

    # Fix over-replacements: cfg.contacts.contacts.xxx → cfg.contacts.xxx
    body = body.replace('cfg.contacts.contacts.', 'cfg.contacts.')

    # Replace extractContacts(cfg) → cfg.contacts
    body = body.replace('extractContacts(cfg)', 'cfg.contacts')

    # Replace t.frontBg → t.backBg (use markers for Alt variants)
    # First protect Alt variants
    body = body.replace('t.frontBgAlt', '___FBA___')
    body = body.replace('t.frontTextAlt', '___FTA___')
    body = body.replace('theme.frontBgAlt', '___TFBA___')
    body = body.replace('theme.frontTextAlt', '___TFTA___')

    # Now replace base variants
    body = body.replace('t.frontBg', 't.backBg')
    body = body.replace('t.frontText', 't.backText')
    body = body.replace('theme.frontBg', 'theme.backBg')
    body = body.replace('theme.frontText', 'theme.backText')

    # Restore Alt variants (they use frontBgAlt/frontTextAlt which weren't swapped in theme)
    body = body.replace('___FBA___', 't.frontBgAlt')
    body = body.replace('___FTA___', 't.frontTextAlt')
    body = body.replace('___TFBA___', 'theme.frontBgAlt')
    body = body.replace('___TFTA___', 'theme.frontTextAlt')

    # Add "back-element" tag to all tag arrays that don't already have it
    def add_back_tag(match):
        tags = match.group()
        if '"back-element"' in tags:
            return tags
        # Add "back-element" before the closing bracket
        return tags.rstrip(']').rstrip() + ', "back-element"]'

    body = re.sub(r'tags:\s*\[[^\]]+\]', add_back_tag, body)

    return body


def swap_theme_colors(helpers_content: str) -> str:
    """Swap frontBg↔backBg and frontText↔backText for the 11 swapped templates."""
    for tid in SWAPPED:
        # Find the theme entry for this template
        pattern = rf'"{re.escape(tid)}":\s*\{{[^}}]+\}}'
        match = re.search(pattern, helpers_content)
        if not match:
            print(f"WARNING: Could not find theme for {tid}")
            continue

        theme_text = match.group()

        # Extract frontBg and backBg values
        fb_match = re.search(r'frontBg:\s*"([^"]+)"', theme_text)
        bb_match = re.search(r'backBg:\s*"([^"]+)"', theme_text)
        ft_match = re.search(r'frontText:\s*"([^"]+)"', theme_text)
        bt_match = re.search(r'backText:\s*"([^"]+)"', theme_text)

        if not (fb_match and bb_match and ft_match and bt_match):
            print(f"WARNING: Missing theme fields for {tid}")
            continue

        frontBg = fb_match.group(1)
        backBg = bb_match.group(1)
        frontText = ft_match.group(1)
        backText = bt_match.group(1)

        # Swap using markers
        new_theme = theme_text
        new_theme = new_theme.replace(f'frontBg: "{frontBg}"', f'frontBg: "___NEWFB___"')
        new_theme = new_theme.replace(f'backBg: "{backBg}"', f'backBg: "___NEWBB___"')
        new_theme = new_theme.replace(f'frontText: "{frontText}"', f'frontText: "___NEWFT___"')
        new_theme = new_theme.replace(f'backText: "{backText}"', f'backText: "___NEWBT___"')

        new_theme = new_theme.replace('___NEWFB___', backBg)    # frontBg gets old backBg
        new_theme = new_theme.replace('___NEWBB___', frontBg)   # backBg gets old frontBg
        new_theme = new_theme.replace('___NEWFT___', backText)   # frontText gets old backText
        new_theme = new_theme.replace('___NEWBT___', frontText)  # backText gets old frontText

        helpers_content = helpers_content.replace(theme_text, new_theme)
        print(f"  Theme swapped for {tid}: frontBg {frontBg}↔{backBg}, frontText {frontText}↔{backText}")

    return helpers_content


def process_adapter(adapter_content: str) -> str:
    """Process the adapter file: swap front/back function bodies for 11 templates."""

    for tid in SWAPPED:
        func_name = FUNC_NAMES[tid]
        print(f"\nProcessing {tid} ({func_name})...")

        # Find front function
        front = find_front_function(adapter_content, func_name)
        if not front:
            print(f"  SKIP: Could not find front function")
            continue

        # Find back registration
        back = find_back_registration(adapter_content, tid)
        if not back:
            print(f"  SKIP: Could not find back registration")
            continue

        # Determine which comes first in the file
        if front['start'] < back['start']:
            first, second = 'front', 'back'
            first_info, second_info = front, back
        else:
            first, second = 'back', 'front'
            first_info, second_info = back, front

        # Extract bodies
        front_body = front['body']
        back_body = back['body']

        # Transform
        new_front_body = transform_back_to_front(back_body, tid)
        new_back_body = transform_front_to_back(front_body, tid)

        # Build new function texts
        # Front function signature stays the same
        front_sig_end = front['brace_start']
        front_sig = adapter_content[front['start']:front_sig_end + 1]  # includes {
        new_front_full = front_sig + new_front_body + '\n}'

        # Back registration signature stays the same
        back_sig_end = back['brace_start']
        back_sig = adapter_content[back['start']:back_sig_end + 1]  # includes {
        # Find what comes after the closing } of the arrow function
        back_suffix = adapter_content[back['brace_end']:back['end']]  # });
        new_back_full = back_sig + new_back_body + '\n' + back_suffix.strip()

        # Replace in content - replace the SECOND occurrence first to not shift positions
        if first == 'front':
            # Front comes first, back comes second
            adapter_content = (
                adapter_content[:second_info['start']] +
                new_back_full +
                adapter_content[second_info['end']:]
            )
            adapter_content = (
                adapter_content[:first_info['start']] +
                new_front_full +
                adapter_content[first_info['end']:]
            )
        else:
            # Back comes first, front comes second
            adapter_content = (
                adapter_content[:second_info['start']] +
                new_front_full +
                adapter_content[second_info['end']:]
            )
            adapter_content = (
                adapter_content[:first_info['start']] +
                new_back_full +
                adapter_content[first_info['end']:]
            )

        print(f"  ✅ Swapped front ({len(front_body)} chars) ↔ back ({len(back_body)} chars)")

    return adapter_content


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    adapter_path = os.path.join(base_dir, 'src', 'lib', 'editor', 'business-card-adapter.ts')
    helpers_path = os.path.join(base_dir, 'src', 'lib', 'editor', 'card-template-helpers.ts')

    # Read files
    print("Reading files...")
    with open(adapter_path, 'r', encoding='utf-8', errors='replace') as f:
        adapter_content = f.read()
    with open(helpers_path, 'r', encoding='utf-8', errors='replace') as f:
        helpers_content = f.read()

    # Step 1: Swap theme colors
    print("\n=== Step 1: Swapping theme colors ===")
    helpers_content = swap_theme_colors(helpers_content)
    with open(helpers_path, 'w', encoding='utf-8') as f:
        f.write(helpers_content)
    print("Theme colors swapped and saved.")

    # Step 2: Swap function bodies
    print("\n=== Step 2: Swapping function bodies ===")
    adapter_content = process_adapter(adapter_content)
    with open(adapter_path, 'w', encoding='utf-8') as f:
        f.write(adapter_content)
    print("\nFunction bodies swapped and saved.")

    print("\n=== Done! Run 'npx tsc --noEmit' to verify. ===")


if __name__ == "__main__":
    main()
