"""Uygulama ikonu, logo amblemi ve favicon: elle kurulan piksel ızgaralar, Boğaz sahnesi.

- app/icon.png, app/apple-icon.png: 60x60 ızgara (iPhone ana ekranında tam 3 kat = 180 px), mavi kurdelede SEK-SEK
- public/logo-emblem.png: aynı sahnenin kurdelesiz hali (arayüzde "Sek-Sek" yazısının yanında durur)
- app/favicon.ico: 32x32; güneşin önünde küçük Uktun, sekmede 16 px'te de okunur

    python3 scripts/art/icons.py
    python3 scripts/art/icons.py --og-scene out.png    # paylaşım görselinin arka planı (scripts/art/og.cjs yazıyı dizer)
"""
import math
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)

INK = (18, 15, 26)
CREAM = (244, 234, 216)
CREAM_D = (206, 188, 160)
RED = (214, 64, 58)
RED_D = (150, 38, 40)
GOLD = (242, 193, 78)
GOLD_L = (255, 230, 150)
GOLD_D = (214, 138, 52)
ORANGE = (232, 129, 74)
SIL = (36, 24, 56)
TOWER = (40, 28, 58)
DUSK = [(30, 22, 52), (52, 36, 84), (88, 50, 102), (138, 66, 104), (192, 90, 94), (234, 140, 86), (248, 186, 104)]
SEA = [(54, 60, 112), (40, 52, 98), (30, 40, 80)]
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


class C:
    """Piksel tuvali: None = şeffaf."""

    def __init__(self, n, bg=None):
        self.n = n
        self.g = [[bg for _ in range(n)] for _ in range(n)]

    def put(self, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < self.n and 0 <= y < self.n and c is not None:
            self.g[y][x] = c

    def get(self, x, y):
        return self.g[y][x] if 0 <= x < self.n and 0 <= y < self.n else None

    def rect(self, x0, y0, w, h, c):
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                self.put(x, y, c)

    def gradient(self, y0, y1, bands, x0=0, x1=None):
        x1 = self.n if x1 is None else x1
        for y in range(y0, y1):
            t = (y - y0) / max(1, y1 - y0 - 1) * (len(bands) - 1)
            k = int(t)
            f = t - k
            for x in range(x0, x1):
                self.put(x, y, bands[min(k + (1 if f * 16 > BAYER[y % 4][x % 4] else 0), len(bands) - 1)])

    def disc(self, cx, cy, r, c, dither=None):
        for y in range(self.n):
            for x in range(self.n):
                d = math.hypot(x + 0.5 - cx, y + 0.5 - cy)
                if d <= r:
                    self.put(x, y, c)
                elif dither and d <= r + 1 and BAYER[y % 4][x % 4] < 8:
                    self.put(x, y, dither)

    def ring(self, cx, cy, r0, r1, c):
        for y in range(self.n):
            for x in range(self.n):
                if r0 <= math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r1:
                    self.put(x, y, c)

    def stamp(self, rows, pal, x0, y0):
        for j, r in enumerate(rows):
            for i, ch in enumerate(r):
                if ch != '.' and ch in pal:
                    self.put(x0 + i, y0 + j, pal[ch])

    def outline(self, c=INK, mask=None):
        """Şeffaf komşusu olan dolu piksellerin dışına 1 px kontur (mask: yalnız bu renklerin çevresi)."""
        src = [r[:] for r in self.g]
        for y in range(self.n):
            for x in range(self.n):
                if src[y][x] is not None:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    v = src[y + dy][x + dx] if 0 <= x + dx < self.n and 0 <= y + dy < self.n else None
                    if v is not None and (mask is None or v in mask):
                        self.g[y][x] = c
                        break

    def layer(self, other, x0=0, y0=0):
        for y, row in enumerate(other.g):
            for x, v in enumerate(row):
                if v is not None:
                    self.put(x0 + x, y0 + y, v)

    def round_corners(self, r):
        for y in range(self.n):
            for x in range(self.n):
                cx = min(max(x, r), self.n - 1 - r)
                cy = min(max(y, r), self.n - 1 - r)
                if math.hypot(x - cx, y - cy) > r + 0.3:
                    self.g[y][x] = None

    def image(self):
        im = Image.new('RGBA', (self.n, self.n), (0, 0, 0, 0))
        for y, row in enumerate(self.g):
            for x, v in enumerate(row):
                if v is not None:
                    im.putpixel((x, y), v + (255,))
        return im


# ── harf seti: 2 piksel kalın, 6x7; "SEK-SEK" için ─────────────────────────────
GLYPH = {
    'S': ['.####.', '##..##', '##....', '.####.', '....##', '##..##', '.####.'],
    'E': ['######', '##....', '##....', '#####.', '##....', '##....', '######'],
    'K': ['##..##', '##.##.', '####..', '###...', '####..', '##.##.', '##..##'],
    '-': ['....', '....', '....', '####', '....', '....', '....'],
}
def text_layer(word, font, light, mid, shadow, outline=INK, gap=1):
    """Başlık yazısı: üst yarı açık, alt yarı orta ton, kontur, alta 1 px gölge."""
    h = len(next(iter(font.values())))
    w = sum(len(font[ch][0]) + gap for ch in word) - gap
    n = max(w, h) + 4
    t = C(n)
    x = 2
    for ch in word:
        rows = font[ch]
        for j, r in enumerate(rows):
            for i, v in enumerate(r):
                if v == '#':
                    t.put(x + i, 2 + j, light if j < (h + 1) // 2 else mid)
        x += len(rows[0]) + gap
    # gölge: harfin altına
    for y in range(n - 1, -1, -1):
        for xx in range(n):
            if t.get(xx, y) in (light, mid) and t.get(xx, y + 1) is None:
                t.put(xx, y + 1, shadow)
    t.outline(outline)
    return t, w + 4, h + 5


def hero_sprite(frame='jump', cid='uktun'):
    import hero
    rows = hero.frames(cid)[frame]
    pal = {k: tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)) for k, v in hero.PAL[cid].items()}
    s = C(26)
    s.stamp(rows, pal, 3, 1)
    # atkı ucu rüzgârda
    s.stamp(['rrR', '.rR', '..R'], {'r': RED, 'R': RED_D}, 2, 10)
    s.outline(INK)
    return s


def tri(c, cx, top, base, half, col):
    """Tepeden tabana genişleyen üçgen (kule külahı)."""
    for y in range(int(top), int(base) + 1):
        hw = half * (y - top) / max(1, base - top)
        for x in range(int(cx - hw), int(cx + hw) + 1):
            c.put(x, y, col)


def bogaz(c, horizon=33, glints=((35, 25, 10), (37, 22, 16), (39, 26, 8), (41, 23, 13))):
    """Deniz, güneşin sudaki yansıması, Kız Kulesi, vapur ve martılar."""
    c.gradient(horizon, 60, SEA)
    for y, x0, w in glints:
        c.rect(x0, y, w, 1, GOLD)
    c.rect(3, horizon - 2, 9, 2, TOWER)
    c.rect(6, horizon - 11, 3, 9, TOWER)
    c.rect(5, horizon - 9, 5, 1, TOWER)
    tri(c, 7, horizon - 15, horizon - 11, 2, TOWER)
    c.rect(41, horizon - 4, 15, 4, CREAM)
    c.rect(40, horizon - 2, 17, 2, SIL)
    c.rect(44, horizon - 7, 7, 3, CREAM_D)
    c.rect(47, horizon - 10, 2, 3, RED)
    c.put(47, horizon - 11, INK)
    for gx, gy in ((10, 9), (15, 6), (49, 13)):
        c.stamp(['#...#', '.#.#.'], {'#': CREAM}, gx, gy)


# Boğaz mavisi kurdele: ana, ışık, gölge
RIBBON = ((44, 104, 196), (100, 156, 236), (24, 58, 128))


def icon(ribbon=True):
    """Gökyüzü → güneş → Boğaz → zıplayan Uktun → (mavi kurdelede SEK-SEK)."""
    c = C(60)
    c.gradient(0, 60, DUSK)
    sy = 25 if ribbon else 30
    c.disc(30, sy, 17, ORANGE, dither=DUSK[4])
    c.disc(30, sy, 14.5, GOLD, dither=ORANGE)
    c.disc(30, sy, 11, GOLD_L, dither=GOLD)
    if ribbon:
        bogaz(c)
    else:
        bogaz(c, 40, ((43, 24, 12), (46, 20, 20), (49, 25, 10), (52, 22, 16), (55, 26, 8)))
    c.layer(hero_sprite('jump'), 18, 9 if ribbon else 12)
    if ribbon:
        main_, light, dark = RIBBON
        rb = C(60)
        rb.rect(4, 43, 52, 12, main_)
        rb.rect(4, 43, 52, 1, light)
        rb.rect(4, 53, 52, 2, dark)
        for k in range(4):           # katlanan uçlar
            rb.rect(k, 46 + k, 1, 12 - 2 * k, dark)
            rb.rect(59 - k, 46 + k, 1, 12 - 2 * k, dark)
        rb.outline(INK)
        c.layer(rb)
        t, w, h = text_layer('SEK-SEK', GLYPH, CREAM, CREAM_D, dark)
        c.layer(t, 30 - w // 2, 44)
    c.round_corners(9)
    return c


def favicon():
    """32x32: güneşin önünde zıplayan küçük Uktun, altta deniz ve yansıma."""
    c = C(32)
    c.gradient(0, 32, DUSK)
    c.disc(16, 13, 11, ORANGE)
    c.disc(16, 13, 9.5, GOLD)
    c.disc(16, 13, 7, GOLD_L)
    c.gradient(25, 32, SEA)
    for y, x0, w in ((26, 9, 14), (28, 11, 10), (30, 13, 6)):
        c.rect(x0, y, w, 1, GOLD)
    mini = C(16)
    mini.stamp([
        's........s.',
        'j..HHHH..j.',
        'j.HhhhhH.j.',
        'j.Hhhsses.j',
        'jHhhsssss.j',
        '.jHhSsssSj.',
        '..jrrSsjj..',
        '.rrjjjJj...',
        'rr.jjjJj...',
        '...pppPp...',
        '..pP...pP..',
        '.bb.....bb.',
    ], {'s': (246, 200, 162), 'S': (217, 153, 122), 'e': INK, 'H': (90, 36, 32), 'h': (142, 62, 38),
        'j': (224, 162, 58), 'J': (168, 108, 28), 'p': (62, 74, 122), 'P': (42, 50, 86), 'b': (90, 52, 36), 'r': RED}, 1, 1)
    mini.outline(INK)
    c.layer(mini, 10, 7)
    c.round_corners(5)
    return c


def og_scene(path):
    """Paylaşım görselinin arka planı: 300x158 ızgara, 4 kat = 1200x632. Sol yarı yazıya ayrılır."""
    c = C(300)
    c.gradient(0, 96, DUSK)
    for x, y in ((14, 8), (40, 20), (66, 6), (98, 14), (130, 4), (226, 10), (262, 22), (288, 6), (200, 18)):
        c.put(x, y, CREAM)
    c.disc(206, 62, 40, ORANGE, dither=DUSK[4])
    c.disc(206, 62, 34, GOLD, dither=ORANGE)
    c.disc(206, 62, 26, GOLD_L, dither=GOLD)
    # karşı kıyı: alçak tepeler
    for x in range(300):
        top = 88 + int(3 * math.sin(x / 17) + 2 * math.sin(x / 7))
        c.rect(x, top, 1, 96 - top, (58, 36, 78))
    c.gradient(96, 158, SEA)
    for k, y in enumerate(range(99, 150, 3)):
        w = max(4, 46 - k * 2)
        x0 = 206 - w // 2 + (3 if k % 2 else -3)
        c.rect(x0, y, w, 1, GOLD if k < 9 else GOLD_D)
    # Kız Kulesi
    c.rect(144, 98, 22, 4, TOWER)
    c.rect(150, 78, 9, 20, TOWER)
    c.rect(148, 82, 13, 2, TOWER)
    tri(c, 154, 68, 78, 5, TOWER)
    c.put(154, 66, TOWER)
    c.put(154, 67, TOWER)
    c.rect(153, 86, 2, 3, GOLD)
    # vapur
    c.rect(246, 92, 40, 7, CREAM)
    c.rect(244, 97, 44, 4, SIL)
    c.rect(252, 86, 22, 6, CREAM_D)
    for x in range(254, 272, 4):
        c.rect(x, 88, 2, 2, GOLD)
    c.rect(262, 79, 4, 7, RED)
    c.rect(262, 78, 4, 1, INK)
    for gx, gy in ((140, 26), (150, 20), (240, 34), (120, 44), (270, 48)):
        c.stamp(['#...#', '.#.#.'], {'#': CREAM}, gx, gy)
    c.layer(hero_sprite('jump', 'uktun'), 180, 30)
    c.layer(hero_sprite('jump', 'memo'), 206, 38)
    im = c.image().crop((0, 0, 300, 158))
    im.resize((1200, 632), Image.NEAREST).crop((0, 0, 1200, 630)).save(path)


def main():
    full = Image.new('RGBA', (60, 60), INK + (255,))
    full.alpha_composite(icon().image())
    full.resize((180, 180), Image.NEAREST).save(os.path.join(ROOT, 'app/apple-icon.png'))
    full.resize((540, 540), Image.NEAREST).resize((512, 512), Image.NEAREST).save(os.path.join(ROOT, 'app/icon.png'))
    icon(ribbon=False).image().resize((180, 180), Image.NEAREST).save(os.path.join(ROOT, 'public/logo-emblem.png'))
    fav = favicon().image()
    fav.save(os.path.join(ROOT, 'app/favicon.ico'), sizes=[(16, 16), (32, 32)])


if __name__ == '__main__':
    if '--og-scene' in sys.argv:
        og_scene(sys.argv[sys.argv.index('--og-scene') + 1])
    else:
        main()
