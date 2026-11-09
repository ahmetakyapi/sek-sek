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


# ── bacaklar da kollar gibi eklem açılarıyla çizilir: kalça → diz → bilek → bot.
# Uyluk 3, baldır 2 piksel; bot iki satır (üst + taban). Yerdeki pozlarda en alttaki taban
# tuvalin son satırına oturtulur, gövde aradaki farkı "bob" olarak alır: adım açılınca kalça iner.
THIGH, SHIN = 3.0, 2.0
HIP_Y = 16.0
GROUND = H - 1


def leg_points(hx, hy, thigh, bend):
    """Açılar dikeyden derece, pozitif = ileri. Diz yalnız geriye kırılır (baldır = uyluk - bükülme)."""
    kx = hx + math.sin(math.radians(thigh)) * THIGH
    ky = hy + math.cos(math.radians(thigh)) * THIGH
    shin = thigh - bend
    ax = kx + math.sin(math.radians(shin)) * SHIN
    ay = ky + math.cos(math.radians(shin)) * SHIN
    return (kx, ky), (ax, ay), shin


def draw_leg(g, hx, hy, thigh, bend, near):
    (kx, ky), (ax, ay), shin = leg_points(hx, hy, thigh, bend)
    ch = 'p' if near else 'P'
    line(g, hx, hy, kx, ky, ch)
    line(g, kx, ky, ax, ay, ch)
    x, y = int(round(ax)), int(round(ay))
    top, sole = ('b', 'B') if near else ('B', 'B')
    if shin < -55:
        # ayak arkaya kalkık: burun aşağı bakar
        for dx, dy, c in ((0, 0, top), (1, 0, top), (-1, 1, sole), (0, 1, sole)):
            dot(g, x + dx, y + dy, c)
    elif shin > 60:
        # ayak öne uzanmış: taban öne döner
        for dx, dy, c in ((1, 0, top), (1, -1, sole), (2, 0, sole), (1, 1, sole)):
            dot(g, x + dx, y + dy, c)
    else:
        for dx, dy, c in ((0, 1, top), (1, 1, top), (0, 2, sole), (1, 2, sole), (2, 2, sole), (-1, 2, sole)):
            dot(g, x + dx, y + dy, c)


# iki bacak da aynı kalça noktasından çıkar (yandan görünüş); uzak bacak yarım piksel geride
HIPS = (-1.0, -0.5)


def ground_bob(legs, lean):
    """Yerdeki pozda tabanı zemine oturtan dikey kayma (aşağı pozitif)."""
    low = max(leg_points(10 + lean + dx, HIP_Y, t, k)[1][1] for (t, k), dx in zip(legs, HIPS))
    return int(round(GROUND - 2 - low))


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
    lean = pose.get('lean', 0)
    bob = pose_bob(pose)
    # nefes: üst gövde bir piksel iner, bacaklar yerinde kalır
    breath = pose.get('breath', 0)
    hx = 10 + lean                              # kalça
    sx, sy = 10 + lean, 10 + bob                # omuz hizası
    # saç arkası
    if HAIR_BACK[cid]:
        stamp(g, HAIR_BACK[cid], 3 + lean + pose.get('hair', 0), 5 + bob)
    # uzak kol ve bacak (koyu)
    fa = pose['arms'][0]
    ax, ay = limb(g, sx - 2, sy + 1, fa[0], 3, fa[1], 2, 'J')
    dot(g, ax, ay, 'S')
    (ft, fk), (nt, nk) = pose['legs']
    draw_leg(g, hx + HIPS[0], HIP_Y + bob - breath, ft, fk, False)
    # gövde
    stamp(g, TORSO, sx - 5, sy - 1)
    # yakın bacak ve kol (açık)
    draw_leg(g, hx + HIPS[1], HIP_Y + bob - breath, nt, nk, True)
    if pose.get('item'):
        # elde eşya: Uktun harita rulosu, Memo telefon
        dot(g, sx + 3, sy + 4, 'X')
        dot(g, sx + 3, sy + 3, 'X' if cid == 'uktun' else 'x')
    na = pose['arms'][1]

    def near_arm():
        ax, ay = limb(g, sx + 2, sy + 1, na[0], 3, na[1], 2, 'j')
        hand(g, ax, ay)

    if not pose.get('arm_front'):
        near_arm()
    # kafa
    head = HEAD[cid]
    if pose.get('blink'):
        head = [r.replace('e', 'S').replace('w', 's') for r in head]
    stamp(g, head, 3 + lean, bob - 1 + pose.get('hy', 0))
    # el sallarken kol yüzün önünden kalkar
    if pose.get('arm_front'):
        near_arm()
    return [''.join(r) for r in g]


def gait(i, n=8):
    """Koşu döngüsü: kare 0 ve 4 temas (adım en açık, kalça en alçak), 2 ve 6 geçiş (salınan bacağın
    dizi en yüksekte, kalça yukarıda). Salınan bacak dizden çok kırılır, basan bacak hafifçe esner;
    kollar bacaklara zıt sallanır."""
    ph = (i / n) * math.tau + math.pi / 2
    s, c = math.sin(ph), math.cos(ph)

    def leg(sign):
        t = 30 * s * sign
        v = -c * sign                      # >0: bacak öne salınıyor (havada)
        bend = 8 + 62 * max(0, v) ** 1.2 if v > 0 else 6 + 10 * (-v)
        return (t, bend)

    # dirsek hep yarı bükük; öne gelen kolda biraz daha kırılır (yumruk göğüs hizasına çıkmaz)
    arm_n = (-22 * s, -22 * s + 30 + 18 * max(0, -s))
    arm_f = (22 * s, 22 * s + 30 + 18 * max(0, s))
    return {'legs': (leg(-1), leg(1)), 'arms': (arm_f, arm_n), 'lean': 1, 'ground': True, 'hair': -1 if i % 4 == 0 else 0}


POSES = {
    'idle0': {'legs': ((-9, 2), (8, 2)), 'arms': ((6, 10), (-4, 8)), 'ground': True},
    'idle1': {'legs': ((-9, 2), (8, 2)), 'arms': ((6, 14), (-4, 12)), 'ground': True, 'breath': 1},
    # kalkış: yakın diz göğse çekilir, uzak bacak itişi bitirip geride uzar; yakın kol yukarı
    'jump': {'legs': ((-16, 12), (58, 95)), 'arms': ((-55, -35), (150, 165)), 'hair': 1},
    # tepe noktası: iki diz toplanır, kollar dengede açık
    'apex': {'legs': ((28, 80), (52, 95)), 'arms': ((-95, -75), (105, 120)), 'hair': 1, 'bob': -1},
    # düşüş: bacaklar zemine uzanır, kollar havada
    'fall': {'legs': ((-22, 26), (20, 34)), 'arms': ((-115, -135), (115, 140)), 'hair': 2},
    # iniş: dizler bükük, gövde çöker (esnemeyle birlikte)
    'land': {'legs': ((24, 70), (44, 88)), 'arms': ((-40, -20), (50, 75)), 'ground': True, 'hair': 1},
    # uzun beklemede ekrana el sallar
    'wave0': {'legs': ((-9, 2), (8, 2)), 'arms': ((6, 10), (80, 140)), 'ground': True, 'arm_front': True},
    'wave1': {'legs': ((-9, 2), (8, 2)), 'arms': ((6, 12), (80, 175)), 'ground': True, 'arm_front': True},
    'wall': {'legs': ((8, 30), (42, 70)), 'arms': ((60, 80), (150, 170))},
    'dash': {'legs': ((-78, 10), (-52, 40)), 'arms': ((-70, -80), (-80, -90)), 'lean': 2, 'hair': -1},
}
for k in range(8):
    POSES[f'run{k}'] = gait(k)


def pose_bob(pose):
    bob = pose.get('bob', 0)
    if pose.get('ground'):
        bob += ground_bob(pose['legs'], pose.get('lean', 0))
    return bob + pose.get('breath', 0)


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
    lines.append('')
    lines.append('/** Her karede gövdenin dikey kayması (aşağı pozitif): atkı ensede kalsın diye çizer bunu okur */')
    lines.append('export const HERO_BOB: Record<HeroFrame, number> = {')
    lines += [f'  {n}: {pose_bob(POSES[n if n != "blink" else "idle0"])},' for n in data['uktun']['frames']]
    lines.append('}')
    open(path, 'w').write('\n'.join(lines) + '\n')


def preview(path, scale=8, names=None, only=None):
    from PIL import Image
    names = names or ['idle0', 'idle1', 'run0', 'run1', 'run2', 'run3', 'run4', 'run5', 'run6', 'run7', 'jump', 'apex', 'fall', 'land', 'wave0', 'wave1', 'wall', 'dash']
    hexrgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
    mix = lambda c, t, a: tuple(round(c[i] + (t[i] - c[i]) * a) for i in range(3))
    im = Image.new('RGB', ((W + 3) * scale * len(names), (H + 3) * scale * 2), (110, 138, 176))
    px = im.load()
    for ci, cid in enumerate(only or ['uktun', 'memo']):
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
