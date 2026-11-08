"""Oynanabilir karakterler: 20x24 tuval, eklem açılarıyla çizilen kollar ve bacaklar.

Kafa ve gövde elle çizilmiş damgalardır; kollar ve bacaklar her karede omuz/kalça noktasından
açılarla çizilir. Uzak taraftaki uzuvlar koyu tonla önce, yakın taraftakiler açık tonla sonra boyanır.
Çıktı: game/heroFrames.ts (her karakter için kare sözlüğü + palet).

  python3 scripts/art/hero.py            # TS dosyasını yazar
  python3 scripts/art/hero.py --preview out.png
"""
import json
import math
import os
import sys

W, H = 20, 24

PAL = {
    'uktun': {
        'e': '#1d1a22', 'w': '#ffffff', 'r': '#d6403a', 'R': '#9e2a2a',
        'H': '#4e1e1c', 'h': '#86361f', 'q': '#ad552e', 'Q': '#d98048',
        's': '#f6c8a2', 'S': '#d9997a', 'n': '#ec8f7e', 'm': '#b04652',
        'j': '#e0a23a', 'J': '#a86c1c', 'y': '#ffd27a',
        'p': '#4a5888', 'P': '#2e3660', 'b': '#6a3c28', 'B': '#3e2218', 'X': '#f4e4c0',
    },
    'memo': {
        'e': '#1d1a22', 'w': '#ffffff', 'r': '#d6403a', 'R': '#9e2a2a',
        'H': '#140e0c', 'h': '#2a1e1a', 'q': '#44322a', 'Q': '#5e4838',
        's': '#e0aa80', 'S': '#b87a58', 'n': '#c88a68', 'm': '#7a3a30', 'g': '#3a2a22',
        'j': '#2f7a8a', 'J': '#1e5662', 'y': '#6cb8bc',
        'p': '#3e3e50', 'P': '#26262f', 'b': '#5a3424', 'B': '#341c14', 'X': '#7ad8ff', 'x': '#1d1a22',
    },
}

# ── kafa damgaları (yüz sağa); sol üst köşe (3, 0) ──────────────────────────
HEAD = {
    'uktun': [
        '.....HHHHH....',
        '...HHhqQQqHH..',
        '..HhqQQqqqqhH.',
        '.HhqqhhhhhhqhH',
        '.HhhhhhhhhhhqH',
        '.HhhhhhHssshhH',
        '.HhhhhHssesseshH',
        '.HhhhhHssesses.',
        '.HhhhhSsnssnss.',
        '.HhhhhhSssmsS..',
        '..HhhhhhSSSS...',
    ],
    'memo': [
        '......HHHH....',
        '....HHqQqhH...',
        '...HhqQQqqhH..',
        '..HhhqhhhhhhH.',
        '..HhhhhhhhhhhH',
        '..HhhSsssssshH',
        '..HhSssesssesS',
        '..HSssesssess.',
        '..HSsssssssss.',
        '...SsgggggsS..',
        '....SSsgmsS...',
    ],
}
# uzun saçın sırta düşen kısmı (kafa damgasıyla aynı koordinat), kare başına salınım ofseti alır
HAIR_BACK = {
    'uktun': [
        '.Hhhh.',
        '.Hhqh.',
        '.Hhhh.',
        '..Hhq.',
        '..Hhh.',
        '...Hh.',
        '...H..',
    ],
    'memo': [],
}

# ── gövde damgası: atkı + ceket (sol üst köşe gövde noktasına göre) ───────────
TORSO = [
    '..RrrrR..',
    '.JjrRjjJ.',
    '.yjjjjjJ.',
    '.yjjJjjJ.',
    '..jjJjjJ.',
    '..jjJjJ..',
    '..JjJjJ..',
    '..JJJJJ..',
]


# ── bacaklar: elle çizilmiş 7 satır (18..24. satır), eski 16x20 üslubun büyük hali ──
# p: yakın bacak, P: uzak bacak/gölge kenarı, b/B: çizme ve taban. Sütun 0 = tuvalde 2 + eğim.
LEGS = {
    'idle': [
        '.....pppPP......',
        '.....PP.pP......',
        '.....PP.pP......',
        '.....PP.pP......',
        '.....PP.pP......',
        '.....BBbbbB.....',
        '....BBBBBBBB....',
    ],
    'jump': [
        '.....pppPP......',
        '.....PP.ppP.....',
        '....PP...pP.....',
        '....PP..pP......',
        '....BBB.bbB.....',
        '...BBB..BBBB....',
        '................',
    ],
    'fall': [
        '.....pppPP......',
        '....PP...pP.....',
        '...PP.....pP....',
        '...PP.....pP....',
        '..BBB.....bbB...',
        '.BBBB.....BBBB..',
        '................',
    ],
    'wall': [
        '.....pppPP......',
        '......PPppP.....',
        '......PP.pP.....',
        '......PP..bbB...',
        '.....BBB..BBBB..',
        '.....BBBB.......',
        '................',
    ],
    'dash': [
        '.....pppPPp.....',
        '...PPP...ppP....',
        '.BBPP......pP...',
        'BBB.........pP..',
        '.............bbB',
        '............BBBB',
        '................',
    ],
    # koşu: temas → çöküş → geçiş → yükselme, sonra öbür bacakla aynısı
    'run0': [
        '.....pppPP......',
        '....PP...pP.....',
        '...PP.....pP....',
        '..PP.......pP...',
        '.BBB........pP..',
        'BBB.........bbB.',
        '...........BBBB.',
    ],
    'run1': [
        '.....pppPP......',
        '....PP...pP.....',
        '...PP.....pP....',
        '...PP.....pP....',
        '..BBB.....pP....',
        '..BB......bbB...',
        '.........BBBB...',
    ],
    'run2': [
        '.....pppPP......',
        '.....PPPpP......',
        '......PPpP......',
        '.....BBBpP......',
        '.....BB.pP......',
        '........bbB.....',
        '.......BBBB.....',
    ],
    'run3': [
        '.....pppPP......',
        '.....pP.PP......',
        '....pP...PP.....',
        '...pP....BBB....',
        '..pP.....BB.....',
        '.bbB............',
        'BBB.............',
    ],
    'run4': [
        '.....pppPP......',
        '....pP...PP.....',
        '...pP.....PP....',
        '..pP.......PP...',
        '.bbB........PP..',
        'BBB.........BBB.',
        '...........BBBB.',
    ],
    'run5': [
        '.....pppPP......',
        '....pP...PP.....',
        '...pP.....PP....',
        '...pP.....PP....',
        '..bbB.....PP....',
        '..BB......BBB...',
        '.........BBBB...',
    ],
    'run6': [
        '.....pppPP......',
        '......pPPP......',
        '......pPPP......',
        '.....bbBPP......',
        '.....BB.PP......',
        '........BBB.....',
        '.......BBBB.....',
    ],
    'run7': [
        '.....pppPP......',
        '.....PP.pP......',
        '....PP...pP.....',
        '...PP....bbB....',
        '..PP.....BB.....',
        '.BBB............',
        'BBB.............',
    ],
}


def canvas():
    return [['.'] * W for _ in range(H)]


def stamp(g, rows, x0, y0):
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            x, y = x0 + i, y0 + j
            if ch != '.' and 0 <= x < W and 0 <= y < H:
                g[y][x] = ch


def dot(g, x, y, ch):
    x, y = int(round(x)), int(round(y))
    if 0 <= x < W and 0 <= y < H:
        g[y][x] = ch


def line(g, x0, y0, x1, y1, ch, thick=2):
    n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
    for k in range(n + 1):
        t = k / n
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t
        dot(g, x, y, ch)
        if thick == 2:
            dot(g, x + 1, y, ch)


def limb(g, ox, oy, a1, l1, a2, l2, ch, end=None, end_ch=None):
    """Omuz/kalçadan iki parçalı uzuv. Açılar dikeyden derece (pozitif = sağa/ileri)."""
    kx = ox + math.sin(math.radians(a1)) * l1
    ky = oy + math.cos(math.radians(a1)) * l1
    ex = kx + math.sin(math.radians(a2)) * l2
    ey = ky + math.cos(math.radians(a2)) * l2
    line(g, ox, oy, kx, ky, ch)
    line(g, kx, ky, ex, ey, ch)
    return ex, ey


def hand(g, x, y):
    dot(g, x, y, 's')
    dot(g, x + 1, y, 'S')


# ── pozlar: (gövde eğimi, zıplama, uzak bacak, yakın bacak, uzak kol, yakın kol) ─
def pose_frame(cid, pose):
    g = canvas()
    bob = pose.get('bob', 0)
    lean = pose.get('lean', 0)
    hx, hy = 10 + lean, 15 + bob                # kalça
    sx, sy = 10 + lean, 10 + bob                # omuz hizası
    # saç arkası
    if HAIR_BACK[cid]:
        stamp(g, HAIR_BACK[cid], 3 + lean + pose.get('hair', 0), 5 + bob)
    # uzak kol ve bacak (koyu)
    fa = pose['arms'][0]
    ax, ay = limb(g, sx - 2, sy + 1, fa[0], 3, fa[1], 2, 'J')
    dot(g, ax, ay, 'S')
    # gövde
    stamp(g, TORSO, sx - 5, sy - 1)
    # yakın bacak ve kol (açık)
    stamp(g, LEGS[pose['legs']], 2 + lean, 17)
    if pose.get('item'):
        # elde eşya: Uktun harita rulosu, Memo telefon
        dot(g, sx + 3, sy + 4, 'X')
        dot(g, sx + 3, sy + 3, 'X' if cid == 'uktun' else 'x')
    na = pose['arms'][1]
    ax, ay = limb(g, sx + 2, sy + 1, na[0], 3, na[1], 2, 'j')
    hand(g, ax, ay)
    # kafa
    head = HEAD[cid]
    if pose.get('blink'):
        head = [r.replace('e', 'S').replace('w', 's') for r in head]
    stamp(g, head, 3 + lean, bob - 1 + pose.get('hy', 0))
    return [''.join(r) for r in g]


def gait(i, n=8):
    """Koşu döngüsü: bacaklar zıt fazda, diz geri kırılır; kollar bacaklara zıt sallanır."""
    ph = (i / n) * math.tau
    s = math.sin(ph)
    # kol: üst kol zıt fazda sallanır, ön kol yalnız öne giderken bükülür
    arm_n = (-28 * s, -28 * s + 20 + 25 * max(0, -s))
    arm_f = (28 * s, 28 * s + 20 + 25 * max(0, s))
    bob = 1 if i % 4 == 1 else 0
    return {'legs': f'run{i}', 'arms': (arm_f, arm_n), 'bob': bob, 'lean': 1, 'hair': -1 if bob else 0}


POSES = {
    'idle0': {'legs': 'idle', 'arms': ((6, 10), (-4, 8))},
    'idle1': {'legs': 'idle', 'arms': ((6, 12), (-4, 10)), 'bob': 1},
    'jump': {'legs': 'jump', 'arms': ((-140, -150), (150, 160)), 'hy': 0, 'hair': 1},
    'fall': {'legs': 'fall', 'arms': ((-110, -100), (110, 100)), 'hair': 1},
    'wall': {'legs': 'wall', 'arms': ((60, 80), (150, 170))},
    'dash': {'legs': 'dash', 'arms': ((-70, -80), (-80, -90)), 'lean': 2, 'hair': -1},
}
for k in range(8):
    POSES[f'run{k}'] = gait(k)


def frames(cid):
    out = {}
    for name, p in POSES.items():
        out[name] = pose_frame(cid, p)
        if name.startswith('idle0'):
            out['blink'] = pose_frame(cid, {**p, 'blink': True})
    return out


def write_ts(path):
    data = {cid: {'pal': PAL[cid], 'frames': frames(cid)} for cid in PAL}
    lines = ['/** scripts/art/hero.py ile üretilir: 20x24 tuval, eklem açılarıyla çizilmiş kareler. Elle düzenleme. */',
             'export const HERO_W = 20', 'export const HERO_H = 24', '',
             'export type HeroFrame = ' + ' | '.join(f"'{k}'" for k in data['uktun']['frames']), '',
             'export const HERO: Record<string, { pal: Record<string, string>; frames: Record<HeroFrame, string[]> }> = {']
    for cid, d in data.items():
        lines.append(f'  {cid}: {{')
        lines.append(f'    pal: {json.dumps(d["pal"])},')
        lines.append('    frames: {')
        for name, rows in d['frames'].items():
            lines.append(f'      {name}: [')
            lines += [f"        '{r}'," for r in rows]
            lines.append('      ],')
        lines.append('    },')
        lines.append('  },')
    lines.append('}')
    open(path, 'w').write('\n'.join(lines) + '\n')


def preview(path, scale=8):
    from PIL import Image
    names = ['idle0', 'run0', 'run1', 'run2', 'run3', 'run4', 'run5', 'run6', 'run7', 'jump', 'fall', 'wall', 'dash']
    hexrgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
    mix = lambda c, t, a: tuple(round(c[i] + (t[i] - c[i]) * a) for i in range(3))
    im = Image.new('RGB', ((W + 3) * scale * len(names), (H + 3) * scale * 2), (110, 138, 176))
    px = im.load()
    for ci, cid in enumerate(['uktun', 'memo']):
        fr = frames(cid)
        for ni, n in enumerate(names):
            rows = fr[n]
            on = lambda x, y: 0 <= y < H and 0 <= x < W and rows[y][x] != '.'
            for y in range(-1, H + 1):
                for x in range(-1, W + 1):
                    if on(x, y):
                        c = hexrgb(PAL[cid][rows[y][x]])
                        if not on(x, y - 1):
                            c = mix(c, (255, 244, 220), 0.2)
                        elif not on(x, y + 1):
                            c = mix(c, (30, 18, 44), 0.22)
                    elif any(on(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                        c = (18, 15, 26)
                    else:
                        continue
                    for yy in range(scale):
                        for xx in range(scale):
                            px[(ni * (W + 3) + x + 1) * scale + xx, (ci * (H + 3) + y + 1) * scale + yy] = c
    im.save(path)


if __name__ == '__main__':
    if '--preview' in sys.argv:
        preview(sys.argv[sys.argv.index('--preview') + 1])
    else:
        write_ts(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'game', 'heroFrames.ts'))
