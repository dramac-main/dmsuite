import sys
with open('src/lib/editor/business-card-adapter.ts', 'r', encoding='utf-8') as f:
    content = f.read()

for fn in ['layoutUltraMinimal', 'layoutMonogramLuxe', 'layoutGeometricMark', 
           'layoutFrameMinimal', 'layoutSplitVertical', 'layoutDiagonalMono']:
    idx = content.find('function ' + fn)
    line = content[:idx].count('\n') + 1 if idx >= 0 else 'NOT FOUND'
    print(f'{fn}: line {line}')

for tid in ['ultra-minimal', 'monogram-luxe', 'geometric-mark', 'frame-minimal',
            'split-vertical', 'diagonal-mono']:
    idx = content.find(f'registerBackLayout("{tid}"')
    found = 'YES' if idx >= 0 else 'NO'
    print(f'Back layout {tid}: {found}')

idx = content.find('MODERN TEMPLATES')
print(f'MODERN section: line {content[:idx].count(chr(10)) + 1 if idx >= 0 else "MISSING"}')

# Check total lines
print(f'Total lines: {content.count(chr(10)) + 1}')
