"""Sek-Sek portre ressamı.

64x76 piksellik büstleri ışık yönüyle (sol üstten, gün batımı) boyar:
malzeme rampaları, ton atlamalı (sıcak ışık / soğuk gölge) renkler, seçici dış hat,
sol kenarda sıcak kenar ışığı, el çizimi göz/ağız ve şehir arka planı.
Çıktı: rows + pal (+ göz kırpma kareleri) JSON.
"""
import json
import math
import sys

W, H = 64, 76
CX = 31.5
L = (-0.45, -0.45, 0.77)
_n = math.sqrt(sum(v * v for v in L))
L = tuple(v / _n for v in L)


def clamp(v, a, b):
    return a if v < a else b if v > b else v


def hexmix(a, b, t):
    pa = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    pb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(pa[i] + (pb[i] - pa[i]) * t):02x}' for i in range(3))


# ───────────────────────── rampalar (0 = dış hat, en sonda en açık) ─────────────────────────
RAMPS = {
    'skinF': ['#5e2e3a', '#9a5250', '#c97c66', '#e5a684', '#f6c8a2', '#ffe4c6'],
    'blushF': ['#5e2e3a', '#a24e52', '#cf6e66', '#e48c7c', '#f2a690', '#ffc6ae'],
    'skinM': ['#3e2226', '#74443a', '#a0644a', '#c08560', '#d9a67c', '#efc69a'],
    'skinOld': ['#46282a', '#7c4c40', '#a86e54', '#c88e6c', '#e0ae88', '#f2caa4'],
    'skinYoung': ['#4a2a2c', '#86503e', '#b47456', '#d39872', '#ebba92', '#fbd8b2'],
    'hairAuburn': ['#1a0a10', '#36131a', '#5e2020', '#86361f', '#b05428', '#d6803e', '#f0ae68'],
    'hairBlack': ['#0b0809', '#18120f', '#271d1a', '#3a2c27', '#524038', '#6e5a4e', '#8c7868'],
    'hairWhite': ['#3e3a40', '#7c7880', '#a8a4aa', '#c8c4c6', '#e2dedb', '#f4f0ea', '#ffffff'],
    'hairGrey': ['#26222a', '#46404a', '#666068', '#87828a', '#a6a2a8', '#c6c2c4', '#e2dedc'],
    'hairBrown': ['#140c0a', '#2a1a14', '#40281c', '#5a3a26', '#764e32', '#946a44', '#b48a5c'],
    'scarf': ['#2e0a16', '#641822', '#9c2a2c', '#cc3e36', '#e8604a', '#ff9070'],
    'mustard': ['#2e1c10', '#664016', '#a06a1c', '#d39528', '#efb846', '#ffda84'],
    'teal': ['#0b2026', '#143a44', '#1e5662', '#29717e', '#3e909a', '#6cb8bc'],
    'cream': ['#4a3c44', '#8e7e80', '#c2b2aa', '#e6d9cc', '#f7efe4', '#fffaf2'],
    'cap': ['#1c1a20', '#34303a', '#4c4652', '#625c68', '#7c7682', '#9a94a0'],
    'cardigan': ['#241a18', '#463228', '#634836', '#7e5e46', '#9a785a', '#b89472'],
    'purple': ['#1c1228', '#3a2450', '#56356e', '#704a8a', '#8c66a6', '#ab88c2'],
    'white': ['#4a4452', '#8e8894', '#c2bec4', '#e2dee0', '#f4f2ee', '#ffffff'],
    'green': ['#0c2018', '#1a3e2c', '#265a40', '#327656', '#4a9470', '#76b896'],
    'felt': ['#1e140c', '#3e2a1a', '#5c4026', '#7a5834', '#967046', '#b28c5e'],
    'fur': ['#060506', '#121012', '#1e1a1e', '#2c272c', '#3c363c', '#4e474e', '#625a62'],
    'maroon': ['#1c080c', '#3e1218', '#601e24', '#80302e', '#9e4a40', '#bc6a58'],
    'jeans': ['#121a2c', '#203052', '#2e4672', '#3e5c8e', '#5476a8', '#7494c0'],
    'wood': ['#24120a', '#4a2614', '#743e1e', '#9a5a2a', '#bc7a3c', '#dca060'],
}

FIX = {
    'L': '#1c1018', 'w': '#f6eee6', 's': '#c8b8bc', 'h': '#ffffff', 'p': '#120a0c',
    'lipLine': '#5c1e2c', 'lipU': '#a8404e', 'lipD': '#cf6470', 'lipH': '#f2a2a0',
    'lipLineM': '#4a2422', 'lipDM': '#9e5a4c',
    'gold': '#f2c14e', 'goldD': '#a8781c',
    'phone': '#1d1a22', 'scr': '#7ad8ff', 'scrH': '#d2f6ff', 'scrD': '#3a8ab8',
    'oyaR': '#d8423a', 'oyaG': '#3f8f5a', 'oyaY': '#f2c14e',
    'glass': '#2a2430',
}

IRIS = {
    'hazel': ['#3e220e', '#6a3e1a', '#a0682c'],
    'brown': ['#24140c', '#4a2a16', '#704424'],
    'dark': ['#160e0a', '#2e1c12', '#4e3020'],
    'green': ['#1e2a14', '#3e5a24', '#6e8e3a'],
}


class Canvas:
    def __init__(self):
        self.c = [[('bg', '#000000')] * W for _ in range(H)]
        self.layer = [[0] * W for _ in range(H)]  # 0 = arka plan

    def put(self, x, y, mat, tone, layer=1):
        if 0 <= x < W and 0 <= y < H:
            self.c[y][x] = (mat, tone)
            self.layer[y][x] = layer

    def bg(self, x, y, col):
        if 0 <= x < W and 0 <= y < H:
            self.c[y][x] = ('bg', col)
            self.layer[y][x] = 0

    def get(self, x, y):
        return self.c[y][x]

    def shift(self, x, y, d, lo=1):
        m, t = self.c[y][x]
        if m in RAMPS:
            self.c[y][x] = (m, clamp(t + d, lo, len(RAMPS[m]) - 1))

    def color(self, x, y):
        m, t = self.c[y][x]
        if m == 'bg':
            return t
        if m == 'fix':
            return FIX[t] if t in FIX else t
        return RAMPS[m][t]


def tone_from(I, n, lo=1):
    # I ~ [-0.3, 1] -> lo..n-1
    k = (I + 0.15) / 1.1
    return clamp(lo + int(math.floor(clamp(k, 0, 0.999) * (n - lo))), lo, n - 1)


BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def gradient_bg(cv, stops):
    """stops: [(y, renk)] — bantlar, sınırda 4x4 Bayer geçişi."""
    for y in range(H):
        for x in range(W):
            col = stops[-1][1]
            for (y0, c0), (y1, c1) in zip(stops, stops[1:]):
                if y0 <= y < y1:
                    t = (y - y0) / (y1 - y0)
                    # yalnızca bandın son çeyreğinde bir sonraki renge kırıntı
                    th = BAYER[y % 4][x % 4] / 16
                    edge = clamp((t - 0.62) / 0.38, 0, 1)
                    col = c1 if edge > th + 0.03 else c0
                    break
            cv.bg(x, y, col)


def disc(cv, cx, cy, r, col, only_bg=True):
    for y in range(int(cy - r - 1), int(cy + r + 2)):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 < r * r and 0 <= x < W and 0 <= y < H:
                cv.bg(x, y, col)


def rect_bg(cv, x0, y0, x1, y1, col):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            cv.bg(x, y, col)


# ───────────────────────── arka planlar ─────────────────────────
def bg_istanbul(cv):
    gradient_bg(cv, [(0, '#1e1a38'), (12, '#2e2550'), (24, '#523060'), (34, '#86426a'), (43, '#c25e6a'), (50, '#e8826a'), (56, '#f6aa70'), (58, '#f6aa70')])
    for (x, y) in [(6, 3), (19, 6), (47, 4), (58, 9), (37, 2), (27, 10)]:
        cv.bg(x, y, '#d8cce8')
    # güneş + hale
    for y in range(36, 60):
        for x in range(0, 20):
            d = math.hypot(x + 0.5 - 8, y + 0.5 - 47)
            if d < 9.5 and BAYER[y % 4][x % 4] / 16 < (9.5 - d) / 4:
                cv.bg(x, y, '#f8b878')
    disc(cv, 8, 47, 5.6, '#ffd796')
    disc(cv, 8, 47, 3.8, '#fff0c6')
    # deniz
    for y in range(57, H):
        for x in range(W):
            t = (y - 57) / 18
            col = '#6a4472' if t < 0.25 else '#4e3a66' if t < 0.6 else '#3a2e56'
            cv.bg(x, y, col)
    for i, y in enumerate(range(58, 75, 2)):
        span = 6 - i // 2
        for x in range(8 - span, 8 + span + (i % 2)):
            if 0 <= x < W and (x + y) % 3:
                cv.bg(x, y, '#f8c088' if i < 4 else '#c88a7a')
    sil = '#2a2042'
    # sol: cami, kubbe + iki minare
    for x in range(0, 18):
        for y in range(46, 58):
            d = math.hypot(x + 0.5 - 9, y + 0.5 - 55)
            if d < 6.2 and y <= 55:
                cv.bg(x, y, sil)
        for y in range(53, 58):
            cv.bg(x, y, sil)
    for x in range(3, 7):
        for y in range(50, 58):
            if math.hypot(x + 0.5 - 4.5, y + 0.5 - 53.5) < 3:
                cv.bg(x, y, sil)
    for mx, top in [(1, 34), (16, 38)]:
        for y in range(top, 58):
            cv.bg(mx, y, sil)
        cv.bg(mx, top - 1, sil)
        cv.bg(mx, top - 2, sil)
        for dx in (-1, 0, 1):
            cv.bg(mx + dx, top + 7, sil)
    cv.bg(9, 48, sil)
    cv.bg(9, 47, '#f2c14e')
    # sağ: Galata Kulesi + çatılar
    for y in range(36, 58):
        for x in range(54, 61):
            cv.bg(x, y, sil)
    for i, y in enumerate(range(28, 36)):
        half = 0.5 + i * 0.45
        for x in range(54, 61):
            if abs(x + 0.5 - 57.5) <= half:
                cv.bg(x, y, sil)
    cv.bg(57, 27, sil)
    for x in range(53, 62):
        cv.bg(x, 39, '#3a2c52')
    for (x, y) in [(55, 42), (58, 42), (56, 47), (59, 51), (55, 52)]:
        cv.bg(x, y, '#ffc87a')
    for x in range(44, 64):
        roof = 51 + (x * 7 % 5) // 2
        for y in range(roof, 58):
            cv.bg(x, y, '#251c3a')
    for (x, y) in [(46, 54), (49, 55), (62, 53), (51, 53)]:
        cv.bg(x, y, '#ffc87a')
    # martılar
    for gx, gy in [(41, 14), (50, 8), (23, 18)]:
        for dx, dy in [(-2, -1), (-1, 0), (0, 1), (1, 0), (2, -1)]:
            cv.bg(gx + dx, gy + dy, '#2a2042')


def bg_diyarbakir(cv):
    gradient_bg(cv, [(0, '#1a1628'), (12, '#2e2238'), (24, '#56303e'), (34, '#8e4440'), (43, '#c46a46'), (50, '#e8904e'), (56, '#f4b25c'), (58, '#f4b25c')])
    for (x, y) in [(5, 4), (21, 7), (44, 3), (60, 11), (33, 1)]:
        cv.bg(x, y, '#e8d4c8')
    for y in range(22, 46):
        for x in range(0, 20):
            d = math.hypot(x + 0.5 - 8, y + 0.5 - 33)
            if d < 9 and BAYER[y % 4][x % 4] / 16 < (9 - d) / 4:
                cv.bg(x, y, '#f0a868')
    disc(cv, 8, 33, 5.2, '#ffd08a')
    disc(cv, 8, 33, 3.4, '#ffeec0')
    basalt, basalt2, mortar = '#241e2a', '#30283a', '#3c3446'
    # sur
    for y in range(50, H):
        for x in range(W):
            cv.bg(x, y, basalt)
            if (y % 4 == 1) or ((x + (y // 4) * 3) % 7 == 0):
                cv.bg(x, y, basalt2)
    for x in range(W):
        if x % 6 < 4:
            for y in range(46, 50):
                cv.bg(x, y, basalt)
            cv.bg(x, 46, mortar)
    # sol burç
    for y in range(38, 50):
        for x in range(0, 13):
            cv.bg(x, y, basalt)
            if y % 4 == 2:
                cv.bg(x, y, basalt2)
    for x in range(0, 13):
        if x % 4 < 2:
            for y in range(34, 38):
                cv.bg(x, y, basalt)
    for y in (41, 42):
        cv.bg(6, y, '#ffb860')
    # sağ: Ulu Cami'nin kare minaresi
    for y in range(26, 50):
        for x in range(54, 61):
            cv.bg(x, y, basalt if (y // 3) % 2 else basalt2)
    for i, y in enumerate(range(20, 26)):
        for x in range(54, 61):
            if abs(x + 0.5 - 57.5) <= 0.5 + i * 0.6:
                cv.bg(x, y, basalt)
    cv.bg(57, 19, '#f2c14e')
    for x in range(53, 62):
        cv.bg(x, 31, mortar)
    for y in (35, 36, 42, 43):
        cv.bg(57, y, '#ffb860')
    for (x, y) in [(20, 58), (34, 62), (48, 57), (11, 66), (62, 63)]:
        cv.bg(x, y, '#ffb860')


def bg_plain(cv, top='#2a2238', mid='#46304a', low='#6a3e4c'):
    gradient_bg(cv, [(0, top), (26, mid), (52, low), (60, low)])
    for y in range(H):
        for x in range(W):
            d = math.hypot((x + 0.5 - 32) / 32, (y + 0.5 - 38) / 38)
            if d > 0.95 and BAYER[y % 4][x % 4] / 16 < (d - 0.95) * 3:
                cv.bg(x, y, '#1c1626')


# ───────────────────────── yüz geometrisi ─────────────────────────
PROFILES = {
    'f': [(20, 9.5), (23, 13.0), (28, 14.4), (35, 14.6), (39, 14.0), (43, 12.4), (46, 10.2), (49, 7.4), (51, 4.6), (52.4, 2.2)],
    'm': [(19, 10.5), (22, 14.0), (28, 15.4), (36, 15.6), (42, 15.2), (46, 14.4), (49, 13.0), (52, 10.6), (54, 7.4), (55.6, 3.6)],
    'old': [(19, 10.5), (22, 14.0), (28, 15.2), (36, 15.4), (42, 15.0), (46, 14.0), (49, 12.4), (52, 10.0), (54, 7.0), (55.4, 3.4)],
}


def make_hw(profile):
    pts = PROFILES[profile]

    def hw(y):
        if y < pts[0][0] or y > pts[-1][0]:
            return 0.0
        for (y0, w0), (y1, w1) in zip(pts, pts[1:]):
            if y0 <= y <= y1:
                return w0 + (w1 - w0) * (y - y0) / (y1 - y0)
        return 0.0
    return hw


def face_light(x, y, hw):
    w = max(hw(y + 0.5), 1)
    nx = (x + 0.5 - CX) / w
    ny = (y + 0.5 - 38) / 22
    nz = math.sqrt(max(0.05, 1 - 0.75 * nx * nx - 0.5 * ny * ny))
    n = math.sqrt(nx * nx + ny * ny + nz * nz)
    return (nx * L[0] + ny * L[1] + nz * L[2]) / n


def skin_tone(I):
    return 5 if I > 0.86 else 4 if I > 0.6 else 3 if I > 0.33 else 2 if I > 0.08 else 1


# ───────────────────────── boyama ─────────────────────────
def paint(spec, blink=False):
    cv = Canvas()
    spec['bg'](cv)
    hw = make_hw(spec['face'])
    skin = spec['skin']
    FACE = 2
    HAIR = 4

    def in_face(x, y):
        return abs(x + 0.5 - CX) < hw(y + 0.5)

    # ── arka saç (uzun) ──
    hb = spec.get('hairBack')
    if hb:
        ramp = hb['ramp']
        for y in range(18, H):
            for x in range(W):
                dx = abs(x + 0.5 - CX)
                half = hb['half'](y)
                tip = hb['tip'](x)
                if dx < half and y < tip:
                    I = 0.35 - 0.5 * (x + 0.5 - CX) / 26 - 0.012 * (y - 30)
                    t = tone_from(I, len(RAMPS[ramp]) - 1)
                    u = x + 1.5 * math.sin(y / 5.0)
                    if math.sin(u * 1.3) > 0.55:
                        t += 1
                    cv.put(x, y, ramp, clamp(t - 1, 1, 5), 1)

    # ── gövde ──
    top = spec['top']
    sw = lambda y: 0 if y < 59 else min(32.5, 12 + (y - 59) * 3.1 - max(0, (y - 63)) * 1.6)
    for y in range(59, H):
        for x in range(W):
            dx = x + 0.5 - CX
            if abs(dx) < sw(y):
                nx = dx / 33
                I = -0.6 * nx + 0.42 - 0.012 * (y - 62) + (0.12 if y < 63 else 0)
                ramp = top['coat']
                t = tone_from(I, len(RAMPS[ramp]))
                # kol dikişi: koltuk altı
                if abs(abs(dx) - 21.5) < 0.6 and y > 66:
                    t = max(1, t - 2)
                cv.put(x, y, ramp, t, 1)
    # yaka
    collar = top.get('collar', 'v')
    if collar in ('v', 'crew', 'apron', 'hood'):
        for y in range(56, H):
            for x in range(W):
                dx = x + 0.5 - CX
                if collar == 'v':
                    open_ = (y - 57) * 0.42
                    if abs(dx) < open_ and abs(dx) < sw(y):
                        cv.put(x, y, top['shirt'], 4 if dx < 0 else 3, 1)
                    elif abs(dx) < open_ + 2.6 and abs(dx) < sw(y) and y > 59:
                        cv.shift(x, y, -1 if dx > 0 else 1)
                        if abs(dx) > open_ + 1.8:
                            cv.shift(x, y, -1)
                elif collar == 'crew':
                    if abs(dx) < 7.5 and y < 64 and abs(dx) < sw(y):
                        cv.put(x, y, top['shirt'], 3 if dx > 0 else 4, 1)
                elif collar == 'apron':
                    if abs(dx) < 10 - max(0, 64 - y) * 0.6 and y > 62:
                        cv.put(x, y, top['shirt'], 4 if dx < 2 else 3, 1)
                        if abs(dx) > 8.6 - max(0, 64 - y) * 0.6:
                            cv.put(x, y, top['shirt'], 2, 1)
                elif collar == 'hood':
                    # kapüşon: boynun etrafında kalın yuvarlak
                    d = math.hypot(dx / 13, (y - 61) / 5)
                    if 0.55 < d < 1.0 and y > 57:
                        cv.put(x, y, top['coat'], 2 if dx > 0 else 4, 1)
                    if abs(dx) < 1 and 63 < y < 72:
                        cv.put(x, y, 'fix', 'cream' if False else 'w', 1)
    # ── boyun ──
    nw = spec.get('neck', 5.5)
    for y in range(46, 63):
        for x in range(W):
            dx = x + 0.5 - CX
            if abs(dx) < nw:
                I = -0.8 * dx / nw * 0.6 + 0.35
                t = clamp(skin_tone(I) - 1, 1, 4)
                cv.put(x, y, skin, t, 1)
    # ── kulaklar ──
    if spec.get('ears'):
        for side in (-1, 1):
            ex = CX + side * (hw(39.5) + 0.2)
            for y in range(34, 46):
                for x in range(W):
                    d = math.hypot((x + 0.5 - ex) / 2.2, (y + 0.5 - 39.5) / 4.4)
                    if d < 1:
                        t = 4 if side < 0 else 2
                        if d < 0.5:
                            t -= 1
                        cv.put(x, y, skin, t, FACE)
    # ── yüz ──
    soft = spec['face'] == 'f'
    for y in range(18, 57):
        for x in range(W):
            if in_face(x, y):
                I = face_light(x, y, hw) + (0.06 if soft else 0)
                tn = skin_tone(I)
                if soft:
                    # ışık daha önden: iki yanak arasında sert dikiş kalmasın, gölge yalnız kenarda
                    I = face_light(x, y, lambda yy: hw(yy) * 1.6) + 0.04
                    tn = max(2, skin_tone(I))
                cv.put(x, y, skin, tn, FACE)
    if soft:
        # çene ucunda ışık, çene altında yumuşak gölge
        cv.put(31, 49, skin, 5, FACE)
        cv.put(32, 49, skin, 4, FACE)
    # çene altı gölgesi boyunda
    for y in range(46, 63):
        for x in range(W):
            if cv.layer[y][x] == 1 and cv.get(x, y)[0] == skin:
                yy = y
                k = 0
                while yy > 40 and k < 6:
                    yy -= 1
                    k += 1
                    if in_face(x, yy):
                        break
                if in_face(x, yy) and k <= 4:
                    cv.put(x, y, skin, 1, 1)

    # yanak allığı
    blush = spec.get('blush')
    if blush:
        for bx in (CX - 7.5, CX + 7.5):
            for y in range(40, 46):
                for x in range(W):
                    d = ((x + 0.5 - bx) / 3.0) ** 2 + ((y + 0.5 - 41.5) / 1.3) ** 2
                    if in_face(x, y) and d < 0.75:
                        m, t = cv.get(x, y)
                        cv.put(x, y, blush, t, FACE)

    def sk(x, y, d):
        if cv.get(x, y)[0] in (skin, blush):
            cv.shift(x, y, d)

    # göz çukuru gölgesi (yalnızca gölge tarafı ve iç köşe)
    for ex in (CX - 5.5, CX + 5.5):
        for y in range(32, 40):
            for x in range(W):
                if ((x + 0.5 - ex) / 5) ** 2 + ((y + 0.5 - 36) / 2.8) ** 2 < 1 and cv.get(x, y)[1] >= 4:
                    if spec['eye'] != 'f' or x + 0.5 > ex + 2:
                        sk(x, y, -1)

    # burun
    nose = spec.get('nose', 'f')
    nlen = 1 if nose == 'm' else -1
    for y in range(37, 43 + nlen):
        sk(33, y, -1)
    sk(32, 42 + nlen, +1)
    cv.put(31, 41 + nlen, skin, 5, FACE)
    cv.put(30, 44 + nlen, skin, 1 if nose == 'm' else 2, FACE)
    cv.put(33, 44 + nlen, skin, 1 if nose == 'm' else 2, FACE)
    cv.put(31, 44 + nlen, skin, 2, FACE)
    cv.put(32, 44 + nlen, skin, 2, FACE)
    sk(34, 43 + nlen, -1)
    sk(29, 43 + nlen, -1)
    if nose != 'm':
        # burun ucunun gölge yanı ve kemerin ince çizgisi
        sk(33, 42 + nlen, -1)
        sk(33, 40 + nlen, -1)
    if nose == 'm':
        sk(34, 42, -1)

    # gözler
    eye = spec['eye']
    iris = IRIS[spec.get('iris', 'brown')]
    lash = spec.get('lash', 'L')
    # sol göz (izleyiciye göre), dış köşe solda
    if blink:
        Lft = ['.KKKKK..', 'LKKKKKK.', '.LLLLL..', '........']
    elif eye == 'f':
        Lft = ['..KKKK..', '.LLLLLL.', 'LwhIiwL.', 'LwIpIws.', '.sIiIs..', '..KKK...']
    elif eye == 'old':
        Lft = ['.KKKK...', '.LLLLL..', 'KshpIwK.', '.KiIiK..', 'K.KKK...']
    else:
        Lft = ['.KKKK...', '.LLLLL..', 'LshpIw..', '.siIiw..', '..KKK...']
    Rgt = []
    for r in Lft:
        rr = r[:7][::-1] + r[7:]
        Rgt.append(rr)
    # sağ gözde parlama yine sol üstte kalsın
    if not blink:
        Rgt = [r.replace('Ihp', 'hpI') if 'Ihp' in r else r for r in Rgt]
    flick = eye == 'f' and not blink
    for (ex0, sprite) in ((CX - 9.5, Lft), (CX + 2.5, Rgt)):
        x0 = int(round(ex0))
        for j, r in enumerate(sprite):
            y = (32 if eye == 'f' and not blink else 33) + j
            for i, ch in enumerate(r):
                x = x0 + i
                if ch == '.':
                    continue
                if ch == 'K':
                    sk(x, y, -1)
                elif ch == 'L':
                    cv.put(x, y, 'fix', lash, 3)
                elif ch in 'wsh':
                    cv.put(x, y, 'fix', ch, 3)
                elif ch == 'p':
                    cv.put(x, y, 'fix', 'p', 3)
                elif ch == 'I':
                    cv.put(x, y, 'fix', iris[1], 3)
                elif ch == 'i':
                    cv.put(x, y, 'fix', iris[2], 3)
    if flick:
        lx = int(round(CX - 9.5))
        rx = int(round(CX + 2.5))
        cv.put(lx - 1, 33, 'fix', 'L', 3)
        cv.put(rx + 7, 33, 'fix', 'L', 3)
    if spec.get('wrinkles'):
        for (x, y) in [(20, 36), (20, 38), (43, 36), (43, 38)]:
            sk(x, y, -1)
        for x in range(25, 29):
            sk(x, 39, -1)
        for x in range(35, 39):
            sk(x, 39, -1)
        for x in range(27, 37):
            sk(x, 28, -1) if x % 3 else None
        sk(27, 46, -1)
        sk(26, 47, -1)
        sk(36, 46, -1)
        sk(37, 47, -1)
    if spec.get('glasses'):
        for (gx0) in (21, 33):
            for x in range(gx0, gx0 + 10):
                cv.put(x, 32, 'fix', 'glass', 3)
                cv.put(x, 39, 'fix', 'glass', 3)
            for y in range(32, 40):
                cv.put(gx0, y, 'fix', 'glass', 3)
                cv.put(gx0 + 9, y, 'fix', 'glass', 3)
        cv.put(31, 33, 'fix', 'glass', 3)
        cv.put(32, 33, 'fix', 'glass', 3)
        cv.put(22, 33, 'fix', 'h', 3)
        cv.put(34, 33, 'fix', 'h', 3)

    # kaşlar
    brows = spec['brows']
    br = brows['ramp']
    if brows['style'] == 'f':
        # içte kalın ve alçak, dış üçte birde tepe, kuyruk incelir
        pts = [(29, 30, 3), (28, 30, 3), (27, 30, 3), (26, 29, 3), (25, 29, 3), (24, 29, 3), (23, 29, 2), (22, 30, 2)]
    elif brows['style'] == 'bushy':
        pts = [(21, 31, 3), (22, 30, 3), (23, 30, 4), (24, 29, 4), (25, 29, 4), (26, 29, 4), (27, 29, 3), (28, 30, 3), (29, 30, 2), (22, 31, 2), (23, 31, 2), (24, 30, 3), (26, 30, 3)]
    else:
        pts = [(21, 31, 2), (22, 30, 2), (23, 30, 2), (24, 29, 3), (25, 29, 3), (26, 29, 3), (27, 29, 2), (28, 30, 2), (29, 30, 1), (23, 31, 1), (24, 30, 1), (25, 30, 1), (26, 30, 1), (27, 30, 1)]
    for (x, y, t) in pts:
        cv.put(x, y, br, t, 3)
        mx = int(2 * CX) - x
        cv.put(mx, y, br, max(1, t - 1), 3)

    # ağız
    mouth = spec['mouth']
    if mouth == 'f':
        my = 45
        # üst dudak: ortada küçük çukur (cupid yayı)
        for x in (29, 30, 33, 34):
            cv.put(x, my, 'fix', 'lipU', 3)
        cv.put(30, my - 1, 'fix', 'lipU', 3)
        cv.put(33, my - 1, 'fix', 'lipU', 3)
        cv.put(31, my, 'fix', 'lipD', 3)
        cv.put(32, my, 'fix', 'lipD', 3)
        # ağız çizgisi, köşeler hafif yukarı (gülümseme)
        for x in range(29, 35):
            cv.put(x, my + 1, 'fix', 'lipLine', 3)
        cv.put(28, my, 'fix', 'lipLine', 3)
        cv.put(35, my, 'fix', 'lipLine', 3)
        # alt dudak dolgun, ışık solda
        for x in range(29, 35):
            cv.put(x, my + 2, 'fix', 'lipD', 3)
        for x in range(30, 34):
            cv.put(x, my + 3, 'fix', 'lipU', 3)
        cv.put(30, my + 2, 'fix', 'lipH', 3)
        cv.put(31, my + 2, 'fix', 'lipH', 3)
        for x in range(30, 34):
            sk(x, my + 4, -1)
    else:
        for x in range(29, 35):
            cv.put(x, 48, 'fix', 'lipLineM', 3)
        cv.put(28, 47, 'fix', 'lipLineM', 3) if mouth == 'smile' else None
        cv.put(35, 47, 'fix', 'lipLineM', 3) if mouth == 'smile' else None
        for x in range(30, 34):
            cv.put(x, 49, 'fix', 'lipDM', 3)
        for x in range(30, 34):
            sk(x, 50, -1)

    # sakal / bıyık
    beard = spec.get('beard')
    if beard:
        ramp = beard['ramp']
        style = beard['style']
        for y in range(38, 58):
            for x in range(W):
                if not in_face(x, y):
                    continue
                dx = x + 0.5 - CX
                edge = hw(y + 0.5) - abs(dx)
                lips = 28 <= x <= 35 and 47 <= y <= 49
                mus = (45 <= y <= 47 and abs(dx) < 5.6) or (abs(abs(dx) - 4.6) < 1.2 and 47 <= y <= 50)
                full = style in ('box', 'full') and ((y > 44 and edge < 4.5) or y >= 50 or (y >= 41 and edge < 2.2))
                stub = style in ('box', 'full') and ((y >= 39 and edge < 3.5 and y <= 44) or (y == 44 and edge < 5.5))
                if style == 'mustache':
                    full = False
                    stub = False
                if style in ('mustache', 'box', 'full') and mus and not (47 <= y <= 49 and abs(dx) < 3.5):
                    full = True
                if style == 'full' and y >= 49:
                    full = True
                if lips and not (y == 47 and mus):
                    continue
                if full:
                    I = face_light(x, y, hw)
                    t = tone_from(I, len(RAMPS[ramp]) - 1)
                    if (x * 3 + y * 5) % 7 == 0:
                        t += 1
                    cv.put(x, y, ramp, clamp(t, 1, len(RAMPS[ramp]) - 2), 3)
                elif stub and (x + y) % 2 == 0:
                    cv.put(x, y, ramp, 3, 3)
        if style == 'full':
            # sakal çeneden aşağı taşar
            for y in range(55, 62):
                for x in range(W):
                    dx = x + 0.5 - CX
                    if abs(dx) < 8 - (y - 55) * 1.0:
                        I = -0.5 * dx / 8 + 0.45
                        cv.put(x, y, ramp, tone_from(I, len(RAMPS[ramp]) - 1), 3)

    # ── atkı ──
    scarf = spec.get('scarf')
    if scarf:
        sr = 'scarf'
        for y in range(54, 64):
            for x in range(W):
                dx = x + 0.5 - CX
                topy = 55.5 + 0.035 * dx * dx
                if abs(dx) < 10.5 - (y - 56) * 0.15 and y >= topy and y <= 61.5 + 0.02 * dx * dx:
                    fold = math.sin((y - 55) * 1.7 + dx * 0.25)
                    I = -0.55 * dx / 10 + 0.45 + 0.22 * fold
                    t = tone_from(I, len(RAMPS[sr]) - 1)
                    cv.put(x, y, sr, t, 3)
        side = scarf.get('side', -1)
        for y in range(60, H):
            for x in range(W):
                c0 = CX + side * (5.5 + (y - 60) * 0.18)
                if abs(x + 0.5 - c0) < 3.2:
                    I = 0.5 - 0.35 * (x + 0.5 - c0) / 3 * (1) + (0.1 if side < 0 else -0.15)
                    t = tone_from(I, len(RAMPS[sr]) - 1)
                    if y in (69, 70):
                        cv.put(x, y, 'fix', 'gold' if (x + y) % 3 else 'goldD', 3)
                        continue
                    if y == 72 and x % 2:
                        cv.put(x, y, 'fix', 'gold', 3)
                        continue
                    if y >= 74 and x % 2 == 0:
                        continue
                    cv.put(x, y, sr, t, 3)

    # ── saç (ön) ──
    hf = spec.get('hairFront')
    if hf:
        ramp = hf['ramp']
        n = len(RAMPS[ramp])
        mask = [[False] * W for _ in range(H)]
        for y in range(H):
            for x in range(W):
                mask[y][x] = hf['mask'](x, y, hw)
        for y in range(H):
            for x in range(W):
                if not mask[y][x]:
                    continue
                I = hf['light'](x, y)
                t = tone_from(I, n - 2)
                tx = hf['tex'](x, y)
                if tx > 0.55:
                    t += 1
                elif tx < -0.6:
                    t -= 1
                if hf.get('ring') and hf['ring'](x, y):
                    t += 2
                # yüze bakan iç kenar gölgede
                near_face = any(0 <= x + dx < W and 0 <= y + dy < H and cv.layer[y + dy][x + dx] == FACE and not mask[y + dy][x + dx] for dx, dy in ((-1, 0), (1, 0), (0, 1)))
                if near_face:
                    t = min(t, 2)
                cv.put(x, y, ramp, clamp(t, 1, n - 1), HAIR)
        # saçın yüze düşürdüğü gölge
        for y in range(H):
            for x in range(W):
                if cv.layer[y][x] == FACE and y > 0 and (cv.layer[y - 1][x] == HAIR or (x > 0 and cv.layer[y][x - 1] == HAIR and x < CX) or (x < W - 1 and cv.layer[y][x + 1] == HAIR and x > CX)):
                    cv.shift(x, y, -1)

    # ── şapka / başörtüsü ──
    hat = spec.get('hat')
    if hat:
        hat(cv, hw)

    # ── ekler (telefon, saz) ──
    for fn in spec.get('extras', []):
        fn(cv)

    # ── dış hat + kenar ışığı ──
    out = [[cv.c[y][x] for x in range(W)] for y in range(H)]
    for y in range(H):
        for x in range(W):
            if cv.layer[y][x] == 0:
                continue
            m, t = cv.c[y][x]
            nb = []
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                xx, yy = x + dx, y + dy
                if 0 <= xx < W and 0 <= yy < H and cv.layer[yy][xx] == 0:
                    nb.append((dx, dy))
            if not nb or y >= H - 1:
                continue
            if m in RAMPS:
                if any(d == (-1, 0) or d == (0, -1) for d in nb) and x < CX + 6:
                    out[y][x] = (m, len(RAMPS[m]) - 1)
                else:
                    out[y][x] = (m, 0)
            elif m == 'fix' and t in ('w', 'h'):
                pass
    cv.c = out

    # renk ızgarası
    return [[cv.color(x, y) for x in range(W)] for y in range(H)]


# ───────────────────────── saç modelleri ─────────────────────────
def long_hair(part=36.5):
    def bang_y(x):
        if x + 0.5 < part:
            return 22.5 + (part - x - 0.5) * 0.3 + 0.8 * math.sin(x * 0.9)
        return 22.5 + (x + 0.5 - part) * 0.62

    def inner(y, hw):
        if y < 46:
            return max(hw(y + 0.5) - (2.2 if y > 26 else 0.6), 0)
        return max(hw(y + 0.5) - 2.2, 9.0 + (y - 46) * 0.08)

    def outer(y):
        return min(25.5, 18.6 + 0.2 * (y - 24) + 1.0 * math.sin(y / 3.6))

    def tip(x):
        return 70 + 2.6 * math.sin(x * 1.37) + 1.6 * math.sin(x * 0.53)

    def mask(x, y, hw):
        dx = abs(x + 0.5 - CX)
        crown = ((x + 0.5 - CX) / 19.6) ** 2 + ((y + 0.5 - 27.5) / 14.2) ** 2 < 1 and y < 34
        face_vis = abs(x + 0.5 - CX) < hw(y + 0.5) and y + 0.5 >= bang_y(x)
        curtain = 24 <= y < tip(x) and inner(y, hw) <= dx < outer(y)
        if y >= 34 and not curtain:
            return False
        if face_vis and not curtain:
            return False
        if face_vis and dx < inner(y, hw):
            return False
        return crown or curtain

    def light(x, y):
        nx = (x + 0.5 - CX) / 22
        if y < 34:
            ny = (y + 0.5 - 27) / 14
            nz = math.sqrt(max(0.05, 1 - nx * nx * 0.9 - ny * ny * 0.6))
            return nx * L[0] * 1.2 + ny * L[1] + nz * L[2] - 0.05
        return 0.5 - 0.62 * nx - 0.008 * (y - 34)

    def tex(x, y):
        if y < 32:
            a = math.atan2(x + 0.5 - part, y + 0.5 - 12)
            return math.sin(a * 10)
        return math.sin((x + 0.5 + 1.6 * math.sin(y / 5.0 + (1.3 if x < CX else 0))) * 1.25)

    def ring(x, y):
        return 20 <= y <= 22 and 17 <= x <= part - 3 and (x + y) % 5 != 0

    return {'mask': mask, 'light': light, 'tex': tex, 'ring': ring}


def short_hair(top=13.5, quiff=3.0, sideburn=True, hairline=24.5):
    def mask(x, y, hw):
        dx = x + 0.5 - CX
        tuft = 1.4 * max(0, math.sin(x * 1.13)) + quiff * math.exp(-((x - 27) / 4.5) ** 2)
        e = (dx / 17.6) ** 2 + ((y + 0.5 - 26.5) / 12.6) ** 2
        top_ok = y + 0.5 >= top - tuft + 0.5 * (dx / 10) ** 2
        line = hairline + 0.024 * dx * dx
        crown = (e < 1 or (y < 24 and abs(dx) < 17.2)) and top_ok and y + 0.5 < line
        side = sideburn and 26 <= y <= 36 and hw(y + 0.5) - 2.6 <= abs(dx) < hw(y + 0.5) + 0.8 and y < 37
        return crown or side

    def light(x, y):
        nx = (x + 0.5 - CX) / 17
        ny = (y + 0.5 - 24) / 11
        nz = math.sqrt(max(0.05, 1 - nx * nx * 0.9 - ny * ny * 0.7))
        return nx * L[0] * 1.2 + ny * L[1] + nz * L[2] - 0.1

    def tex(x, y):
        return math.sin((x + 0.6 * y) * 1.35) + (0.4 if (x * 7 + y * 3) % 11 == 0 else 0)

    def ring(x, y):
        return 16 <= y <= 18 and 20 <= x <= 30 and (x + y) % 3 != 0

    return {'mask': mask, 'light': light, 'tex': tex, 'ring': ring}


def long_back(ramp):
    return {
        'ramp': ramp,
        'half': lambda y: min(24.5, 18 + 0.25 * (y - 22)),
        'tip': lambda x: 71 + 2.2 * math.sin(x * 1.1) + 1.4 * math.sin(x * 0.41),
    }


# ───────────────────────── şapkalar ─────────────────────────
def kasket(ramp='cap'):
    def f(cv, hw):
        n = len(RAMPS[ramp])
        for y in range(12, 28):
            for x in range(W):
                dx = x + 0.5 - CX
                body = (dx / 18.4) ** 2 + ((y + 0.5 - 25) / 11.5) ** 2 < 1 and y < 26
                brim = 25 <= y <= 27 and abs(dx + 1) < 17.5 - (y - 25) * 1.5
                if body or brim:
                    I = -0.5 * dx / 18 + 0.45 - 0.02 * (y - 18)
                    t = tone_from(I, n - 1)
                    if brim:
                        t = 2 if y == 25 else 1
                    if y == 20 and abs(dx) < 14 and x % 4 == 0:
                        t = max(1, t - 1)
                    cv.put(x, y, ramp, t, 5)
        for x in range(13, 51):
            if cv.layer[28][x] == 2:
                cv.shift(x, 28, -1)
                cv.shift(x, 29, -1) if x % 2 else None
    return f


def toque():
    def f(cv, hw):
        ramp = 'white'
        for y in range(4, 26):
            for x in range(W):
                dx = x + 0.5 - CX
                puff = (dx / 17) ** 2 + ((y + 0.5 - 12) / 8.5) ** 2 < 1
                band = 18 <= y <= 25 and abs(dx) < 15.6
                if puff or band:
                    I = -0.55 * dx / 17 + 0.5 + (0.15 * math.sin(x * 0.8) if puff and not band else 0)
                    t = tone_from(I, len(RAMPS[ramp]) - 1)
                    if band and y == 18:
                        t = max(1, t - 1)
                    cv.put(x, y, ramp, t, 5)
        for x in range(14, 50):
            if cv.layer[26][x] == 2:
                cv.shift(x, 26, -1)
    return f


def kalpak(ramp='fur'):
    def f(cv, hw):
        n = len(RAMPS[ramp])
        for y in range(5, 27):
            for x in range(W):
                dx = x + 0.5 - CX
                w = 15.5 + (y - 5) * 0.08
                if abs(dx) < w and y > 5 + 1.2 * math.sin(x * 1.7) + 0.6:
                    I = -0.5 * dx / w + 0.35
                    t = tone_from(I, n - 1)
                    if (x * 5 + y * 3) % 4 == 0:
                        t += 1
                    if (x * 3 + y * 7) % 5 == 0:
                        t -= 1
                    cv.put(x, y, ramp, clamp(t, 1, n - 1), 5)
        for x in range(14, 50):
            if cv.layer[27][x] == 2:
                cv.shift(x, 27, -1)
    return f


def yazma(ramp='white'):
    """Başörtüsü: saçı örter, yüzü çevreler, kenarında renkli oya."""
    def f(cv, hw):
        n = len(RAMPS[ramp])
        for y in range(12, 66):
            for x in range(W):
                dx = x + 0.5 - CX
                outer = ((dx / 20.5) ** 2 + ((y + 0.5 - 30) / 18) ** 2 < 1 and y < 46) or (y >= 40 and abs(dx) < 20.5 - (y - 40) * 0.25 and y < 64)
                face = abs(dx) < hw(y + 0.5) - 1.2 and y + 0.5 > 24.5 + 0.015 * dx * dx
                neck_open = False
                if outer and not face and not neck_open:
                    I = -0.55 * dx / 20 + 0.45 - 0.006 * (y - 30) + 0.12 * math.sin((dx * 0.35) + y * 0.12)
                    t = tone_from(I, n - 1)
                    cv.put(x, y, ramp, t, 5)
        # oya: yüz kenarı boyunca renkli boncuklar
        cols = ['oyaR', 'oyaG', 'oyaY']
        k = 0
        for y in range(24, 56):
            for x in range(W):
                dx = x + 0.5 - CX
                if cv.layer[y][x] == 5 and any(cv.layer[y + dy][x + dx2] == 2 for dx2, dy in ((-1, 0), (1, 0), (0, 1)) if 0 <= x + dx2 < W and y + dy < H):
                    if (y + (x > CX)) % 2 == 0:
                        cv.put(x, y, 'fix', cols[k % 3], 5)
                        k += 1
        for x in range(W):
            for y in range(24, 30):
                if cv.layer[y][x] == 2 and cv.layer[y - 1][x] == 5:
                    cv.shift(x, y, -1)
    return f


# ───────────────────────── ekler ─────────────────────────
def phone(cv):
    # Memo'nun elinde telefon, ekran ışığı ele vuruyor
    skin = 'skinM'
    for y in range(66, 76):
        for x in range(10, 22):
            d = math.hypot((x + 0.5 - 15.5) / 6, (y + 0.5 - 73) / 5)
            if d < 1:
                cv.put(x, y, skin, 3 if x < 15 else 2, 6)
    for y in range(60, 72):
        for x in range(12, 20):
            if 12 <= x <= 19:
                cv.put(x, y, 'fix', 'phone', 6)
    for y in range(61, 70):
        for x in range(13, 19):
            cv.put(x, y, 'fix', 'scr', 6)
    for (x, y) in [(14, 62), (15, 62), (14, 63)]:
        cv.put(x, y, 'fix', 'scrH', 6)
    # ekranda harita: kırmızı iğne + yol
    for (x, y) in [(15, 66), (16, 65), (17, 64), (14, 67), (13, 68)]:
        cv.put(x, y, 'fix', 'scrD', 6)
    cv.put(16, 63, 'fix', 'oyaR', 6)
    for (x, y) in [(12, 66), (12, 67), (11, 68), (19, 66), (20, 67), (20, 68)]:
        cv.put(x, y, skin, 4, 6)


def saz(cv):
    ramp = 'wood'
    for i in range(30):
        x = 40 + i * 0.75
        y = 75 - i * 0.95
        for w in range(2):
            xx = int(x) + w
            yy = int(y)
            if 0 <= xx < W and 0 <= yy < H:
                cv.put(xx, yy, ramp, 4 if w == 0 else 2, 6)
    for (x, y) in [(60, 48), (61, 47), (62, 46), (61, 49)]:
        cv.put(x, y, ramp, 1, 6)
    for i in range(0, 30, 4):
        x = int(40 + i * 0.75)
        y = int(75 - i * 0.95)
        cv.put(x, y, 'fix', 'gold', 6)


def pendant(cv):
    for (x, y) in [(31, 63), (32, 63)]:
        cv.put(x, y, 'fix', 'gold', 6)
    cv.put(31, 64, 'fix', 'goldD', 6)


# ───────────────────────── karakterler ─────────────────────────
def uktun():
    lh = long_hair()
    lh['ramp'] = 'hairAuburn'
    return {
        'bg': bg_istanbul, 'face': 'f', 'skin': 'skinF', 'blush': 'blushF', 'eye': 'f', 'iris': 'hazel',
        'mouth': 'f', 'nose': 'f', 'neck': 4.8,
        'brows': {'style': 'f', 'ramp': 'hairAuburn'},
        'hairBack': long_back('hairAuburn'), 'hairFront': lh,
        'top': {'coat': 'mustard', 'shirt': 'cream', 'collar': 'v'},
        'scarf': {'side': -1}, 'extras': [pendant],
    }


def memo():
    sh = short_hair()
    sh['ramp'] = 'hairBlack'
    return {
        'bg': bg_diyarbakir, 'face': 'm', 'skin': 'skinM', 'eye': 'm', 'iris': 'dark', 'mouth': 'smile',
        'nose': 'm', 'neck': 6.2, 'ears': True,
        'brows': {'style': 'm', 'ramp': 'hairBlack'},
        'hairFront': sh, 'beard': {'style': 'box', 'ramp': 'hairBlack'},
        'top': {'coat': 'teal', 'shirt': 'cream', 'collar': 'crew'},
        'scarf': {'side': 1}, 'extras': [phone],
    }


def npc(look):
    base = {'bg': bg_plain, 'face': 'old', 'skin': 'skinOld', 'eye': 'old', 'iris': 'brown', 'mouth': 'm', 'nose': 'm', 'neck': 6, 'ears': True}
    if look == 'amca':
        sh = short_hair(top=16, quiff=0, hairline=26)
        sh['ramp'] = 'hairWhite'
        base.update({'brows': {'style': 'bushy', 'ramp': 'hairWhite'}, 'hairFront': sh, 'hat': kasket(), 'wrinkles': True, 'glasses': True,
                     'beard': {'style': 'mustache', 'ramp': 'hairWhite'}, 'top': {'coat': 'cardigan', 'shirt': 'cream', 'collar': 'v'}})
    elif look == 'teyze':
        base.update({'face': 'f', 'eye': 'old', 'mouth': 'f', 'nose': 'f', 'ears': False, 'blush': 'blushF', 'wrinkles': True,
                     'brows': {'style': 'f', 'ramp': 'hairGrey'}, 'hat': yazma('white'), 'neck': 4.8,
                     'top': {'coat': 'purple', 'shirt': 'purple', 'collar': 'none'}})
    elif look == 'usta':
        sh = short_hair(top=18, quiff=0, hairline=25.5)
        sh['ramp'] = 'hairBlack'
        base.update({'skin': 'skinM', 'brows': {'style': 'bushy', 'ramp': 'hairBlack'}, 'hairFront': sh, 'hat': toque(),
                     'beard': {'style': 'mustache', 'ramp': 'hairBlack'}, 'mouth': 'smile',
                     'top': {'coat': 'white', 'shirt': 'cream', 'collar': 'apron'}})
    elif look == 'genc':
        sh = short_hair(top=12.5, quiff=3.5, hairline=24)
        sh['ramp'] = 'hairBrown'
        base.update({'face': 'm', 'skin': 'skinYoung', 'eye': 'm', 'mouth': 'smile', 'brows': {'style': 'm', 'ramp': 'hairBrown'}, 'hairFront': sh,
                     'top': {'coat': 'green', 'shirt': 'cream', 'collar': 'hood'}, 'bg': lambda cv: bg_plain(cv, '#1e2a30', '#2e3e44', '#3e5050')})
    elif look == 'coban':
        base.update({'skin': 'skinM', 'brows': {'style': 'bushy', 'ramp': 'hairBrown'}, 'hat': kalpak('fur'), 'wrinkles': True,
                     'beard': {'style': 'box', 'ramp': 'hairBrown'},
                     'top': {'coat': 'felt', 'shirt': 'felt', 'collar': 'none'}, 'bg': lambda cv: bg_plain(cv, '#1e2630', '#30404a', '#4a5a5a')})
    elif look == 'ozan':
        base.update({'brows': {'style': 'bushy', 'ramp': 'hairWhite'}, 'hat': kalpak('fur'), 'wrinkles': True,
                     'beard': {'style': 'full', 'ramp': 'hairWhite'},
                     'top': {'coat': 'maroon', 'shirt': 'cream', 'collar': 'crew'}, 'extras': [saz]})
    return base


# ───────────────────────── çıktı ─────────────────────────
CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,-/:;<=>?@[]^_{|}~'


def encode(grids):
    """Birden çok ızgarayı ortak paletle karakter satırına çevirir."""
    pal = {}
    for g in grids:
        for row in g:
            for c in row:
                if c not in pal:
                    pal[c] = CHARS[len(pal)]
    rows = [[''.join(pal[c] for c in row) for row in g] for g in grids]
    return {v: k for k, v in pal.items()}, rows


def build(name, spec_fn):
    open_ = paint(spec_fn())
    closed = paint(spec_fn(), blink=True)
    pal, (ro, rc) = encode([open_, closed])
    return {'pal': pal, 'rows': ro, 'closed': rc}


def save_png(grid, path, scale=8):
    from PIL import Image
    im = Image.new('RGB', (W, H))
    for y in range(H):
        for x in range(W):
            c = grid[y][x]
            im.putpixel((x, y), tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)))
    im.resize((W * scale, H * scale), Image.NEAREST).save(path)


if __name__ == '__main__':
    out = {}
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    specs = {'uktun': uktun, 'memo': memo}
    for look in ['amca', 'teyze', 'usta', 'genc', 'coban', 'ozan']:
        specs[look] = (lambda lk: (lambda: npc(lk)))(look)
    for k, fn in specs.items():
        g = paint(fn())
        save_png(g, os.path.join(here, f'{k}.png'))
        out[k] = build(k, fn)
        print(k, len(out[k]['pal']), 'renk')
    json.dump(out, open(os.path.join(here, 'portraits.json'), 'w'))
