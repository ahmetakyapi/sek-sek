"""Üretilen haritaları oyuna yazar.

  python3 scripts/art/newcities.py && python3 scripts/art/sig.py && python3 scripts/art/sync.py

- newcities.json → game/levels.ts içindeki `const konya = [...]` gibi bloklar
- sig.json       → game/signatures.ts içindeki her şehrin `rows: [...]` bloğu (metinler elle yazılır, dokunulmaz)
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))


def rows_block(rows, indent):
    return ''.join(f"{indent}'{r}',\n" for r in rows)


p = os.path.join(ROOT, 'game/levels.ts')
s = open(p).read()
for k, rows in json.load(open(os.path.join(HERE, 'newcities.json'))).items():
    new = f'const {k} = [\n' + rows_block(rows, '  ') + ']'
    s = re.sub(r"const " + k + r" = \[\n(?:  '.*',\n)+\]", lambda m: new, s, count=1)
open(p, 'w').write(s)

p = os.path.join(ROOT, 'game/signatures.ts')
s = open(p).read()
for k, v in json.load(open(os.path.join(HERE, 'sig.json'))).items():
    i = s.index(f'  {k}: {{')
    j = s.index('    rows: [\n', i)
    e = s.index('    ],', j)
    s = s[:j] + '    rows: [\n' + rows_block(v['rows'], '      ') + s[e:]
open(p, 'w').write(s)
print('haritalar yazıldı')
