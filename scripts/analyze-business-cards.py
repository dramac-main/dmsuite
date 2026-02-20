"""
Business Card Reference Image Analyzer
Uses Claude's vision to perform extremely detailed analysis of business card designs.
"""
import anthropic
import base64
import os
import json
import sys

# Load API key from .env.local
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
    env_vars = {}
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    return env_vars

env = load_env()
api_key = env.get('ANTHROPIC_API_KEY')
if not api_key:
    print("ERROR: ANTHROPIC_API_KEY not found in .env.local")
    sys.exit(1)

client = anthropic.Anthropic(api_key=api_key)

ANALYSIS_PROMPT = """You are an expert graphic designer and typographer. Analyze this business card design image in EXTREME detail. This analysis will be used to recreate the card pixel-perfectly in code.

Provide your analysis in the following structured format:

## CARD OVERVIEW
- Overall dimensions/aspect ratio visible
- Number of sides shown (front only, front+back, etc.)
- Overall style category (minimalist, luxury, corporate, creative, etc.)

## FRONT SIDE

### LAYOUT
- Exact positioning of EVERY element using percentage-based coordinates (e.g., "name positioned at 15% from left, 30% from top")
- Overall layout pattern (centered, left-aligned, split, asymmetric, etc.)
- Content zones and their boundaries

### TYPOGRAPHY
For EACH text element:
- Content/text shown
- Font style (serif, sans-serif, script, monospace, slab-serif, display)
- Font weight (thin/100, light/300, regular/400, medium/500, semibold/600, bold/700, black/900)
- Approximate font size relative to card height (e.g., "~4% of card height")
- Case treatment (UPPERCASE, lowercase, Title Case, Sentence case)
- Letter-spacing (tight/-0.05em, normal/0, wide/0.1em, very-wide/0.2em+)
- Line height (tight/1.0, normal/1.4, relaxed/1.6)
- Color (exact hex value)
- Any text effects (shadow, outline, gradient fill, etc.)

### COLORS
- Background: exact hex color(s), gradients (direction, stops with positions)
- Text colors: list each distinct color used with hex
- Accent colors: any highlight or decorative colors with hex
- If there are overlays, transparencies, or blending modes

### DECORATIVE ELEMENTS
For EACH decorative element:
- Type (line, shape, pattern, border, icon, logo placeholder, geometric element)
- Exact position (percentage-based)
- Size (percentage of card width/height)
- Color (hex) and opacity (0-100%)
- Stroke width if applicable
- Corner radius if applicable
- Any rotation or transformation

### SPACING & ALIGNMENT
- Margins from card edges (percentage)
- Gaps between elements (percentage)
- Alignment relationships (what aligns with what)
- Visual hierarchy description

## BACK SIDE (if visible)
(Same structure as front)

## DESIGN DNA
- What makes this design premium/unique
- Key design principles used (contrast, whitespace, hierarchy, etc.)
- Color palette harmony type (monochrome, complementary, analogous, etc.)
- Mood/feeling conveyed
- Target audience impression

Be EXTREMELY precise with colors — estimate hex values as accurately as possible. Be precise with positioning — use percentage-based coordinates. Don't skip ANY element, no matter how small (thin lines, dots, subtle gradients, watermarks, etc.)."""

# Images to analyze
images = [
    'd470b54b4667bbb67204e858d6f0a01f.jpg',
    'd528f0b618c11009c08bd2a93beb890e.jpg',
    'dd0acc18c0824cdca8a1969e711c4e4e.jpg',
    'Digital Marketing Agency Visiting Card.jpg',
    'eadf9c427d539e35f32ac013c0d85254.jpg',
    'ed5aed70cf66b85baf0a7a9af5b80f2c.jpg',
    'f7aaa659853a816e36f98a2513b16387.jpg',
    'f8d2061b39a68b3adb11ece796042007.jpg',
    'Message Us on WhatsApp for Custom Design Orders!.jpg',
]

base_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'business-card-examples')
output_dir = os.path.join(base_dir, 'analysis')
os.makedirs(output_dir, exist_ok=True)

for i, filename in enumerate(images):
    filepath = os.path.join(base_dir, filename)
    print(f"\n{'='*80}")
    print(f"[{i+1}/{len(images)}] Analyzing: {filename}")
    print(f"{'='*80}")
    
    # Read and encode image
    with open(filepath, 'rb') as f:
        image_data = base64.standard_b64encode(f.read()).decode('utf-8')
    
    # Determine media type
    media_type = "image/jpeg"
    
    # Call Claude Vision
    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": image_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": ANALYSIS_PROMPT
                        }
                    ],
                }
            ],
        )
        
        analysis = message.content[0].text
        
        # Save individual analysis
        output_file = os.path.join(output_dir, f"{os.path.splitext(filename)[0]}.md")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"# Business Card Analysis: {filename}\n\n")
            f.write(analysis)
        
        print(analysis)
        print(f"\n✅ Saved to: {output_file}")
        
    except Exception as e:
        print(f"❌ Error analyzing {filename}: {e}")

print(f"\n{'='*80}")
print(f"All analyses saved to: {output_dir}")
print(f"{'='*80}")
