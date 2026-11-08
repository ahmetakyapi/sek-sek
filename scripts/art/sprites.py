"""Oyun içi karakter sprite'ları (16x20): baş + saç arkası + gövde/kollar + bacaklar, poz başına.
Önizleme PNG'si ve TS çıktısı üretir."""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

PAL_SHARED = {
    'e': '#1d1a22', 'W': '#ffffff', 'm': '#b04652',
    'r': '#d6403a', 'R': '#9e2a2a', 'o': '#f2c14e',
    'b': '#5a3424', 'B': '#3a2018',
}
PAL = {
    'uktun': {
        **PAL_SHARED,
        'H': '#5a2420', 'h': '#8e3e26', 'q': '#b25a30', 'Q': '#d27a44',
        's': '#f6c8a2', 'S': '#d9997a', 'n': '#ec8f7e',
        'j': '#e0a23a', 'J': '#a86c1c', 'y': '#ffd884',
        'p': '#3e4a7a', 'P': '#2a3256',
        'X': '#f4e4c0', 'x': '#c79a62',
    },
    'memo': {
        **PAL_SHARED,
        'H': '#120c0c', 'h': '#2a1e1a', 'q': '#40302a', 'Q': '#5e4a40',
        's': '#d9a67c', 'S': '#a8714e', 'n': '#c48262', 'm': '#7a3a30',
        'j': '#2f7a8a', 'J': '#1e5662', 'y': '#6cb8bc',
        'p': '#3a3a4a', 'P': '#24242e',
        'X': '#7ad8ff', 'x': '#1d1a22',
    },
}

HEAD = {
    'uktun': [
        '......HHHH......',
        '....HHhqQQhH....',
        '...HhqQqqqqhH...',
        '..HhqhhhhhqqhH..',
        '..HhhhhhhhhqhhH.',
        '..HhhhhhHssshhH.',
        '..HhhhhHsesssesH',
        '..HhhhHSsnsssss.',
        '..HhqhhHSsssms..',
        '...HhhhhHSSsS...',
    ],
    'memo': [
        '................',
        '.....HHHHH......',
        '....HhqQqqH.....',
        '...HhqQqqqhH....',
        '...HhhhhhhhhH...',
        '...HhSsssssSh...',
        '...HSsesssessS..',
        '...HSssssssssS..',
        '....SsHHHmHHs...',
        '.....HHhhhhH....',
    ],
}

HAIR_BACK = {
    'uktun': [
        '..Hhh...........',
        '..Hhq...........',
        '...Hh...........',
        '...Hh...........',
        '....H...........',
    ],
    'memo': [],
}

# gövde + kollar (satır 10..14), yüz sağa; arka kol 6. sütun, ön kol 12.
TORSO = {
    'idle': [
        '.......rrrrR....',
        '......JRjjjjJ...',
        '......JjjyjjJ...',
        '......JjjyjjJ...',
        '......sjjyjjXs..',
    ],
    'runA': [
        '.......rrrrR....',
        '.....JJRjjjjjJ..',
        '....sJ.jjyjjjjs.',
        '.......jjyjjj...',
        '.......jjyjjj...',
    ],
    'runB': [
        '.......rrrrR....',
        '......JRjjjjJ...',
        '......JjjyjJj...',
        '.......jjyJjj...',
        '.......jjysjj...',
    ],
    'runC': [
        '.......rrrrR....',
        '......JRjjjjjJ..',
        '.....JjjjyjjjJs.',
        '....s.jjjyjjj...',
        '.......jjyjjj...',
    ],
    'runD': [
        '.......rrrrR....',
        '......JRjjjjJ...',
        '......JjjyJjj...',
        '.......jjyJjj...',
        '.......jjyjsj...',
    ],
    'jump': [
        '....s..rrrrR.s..',
        '....JJ.Rjjjj.J..',
        '.....JJjjyjjJ...',
        '.......jjyjjj...',
        '.......jjyjjj...',
    ],
    'fall': [
        '.......rrrrR....',
        '....JJJRjjjjJJ..',
        '...s...jjyjjj.Js',
        '.......jjyjjj...',
        '.......jjyjjj...',
    ],
    'wall': [
        '.......rrrrR..s.',
        '......JRjjjjJJJ.',
        '......JjjyjjJ...',
        '.......jjyjjj...',
        '.......jjyjjj...',
    ],
}

LEGS = {
    'idle': ['.......JjjjjJ...', '.......pPp.pP...', '.......pP..pP...', '.......pP..pP...', '......bbB.bbB...'],
    'runA': ['.......JjjjjJ...', '.......ppPPpp...', '......pP....pP..', '.....pP......bB.', '....bB..........'],
    'runB': ['.......JjjjjJ...', '........pPpp....', '........pPpP....', '........pPbB....', '.......bbB......'],
    'runC': ['.......JjjjjJ...', '.......ppPPpp...', '......pp...pP...', '.....bB.....pP..', '............bbB.'],
    'runD': ['.......JjjjjJ...', '........ppPp....', '.......pPpP.....', '......bB.pP.....', '.........bbB....'],
    'jump': ['.......JjjjjJ...', '.......pppPPp...', '.......pP...pP..', '.......bB...pP..', '............bB..'],
    'fall': ['.......JjjjjJ...', '......pP...pP...', '.....pP.....pP..', '.....pP.....pP..', '....bbB....bbB..'],
    'wall': ['.......JjjjjJ...', '.......pPPpp....', '.......pP..pP...', '.......pP...bB..', '......bbB.......'],
}


def frame(cid, pose, bob=0, blink=False):
    g = [['.'] * 16 for _ in range(20)]

    def over(rows, y0):
        for j, r in enumerate(rows):
            y = y0 + j
            if 0 <= y < 20:
                for i, ch in enumerate(r):
                    if ch != '.':
                        g[y][i] = ch
    over(HAIR_BACK[cid], 8 + bob)
    over(TORSO[pose], 10 + bob)
    over(LEGS[pose], 15)
    head = HEAD[cid]
    if blink:
        head = [r.replace('e', 'S') for r in head]
    over(head, bob)
    return [''.join(r) for r in g]


def preview():
    from PIL import Image
    poses = list(LEGS)
    sc = 8
    im = Image.new('RGB', ((16 + 2) * len(poses) * sc, (20 + 2) * 2 * sc), '#6a8ab0')
    for ci, cid in enumerate(['uktun', 'memo']):
        pal = PAL[cid]
        for pi, pose in enumerate(poses):
            rows = frame(cid, pose)
            for y, r in enumerate(rows):
                for x, ch in enumerate(r):
                    if ch == '.':
                        continue
                    c = pal[ch]
                    col = tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))
                    for yy in range(sc):
                        for xx in range(sc):
                            im.putpixel(((pi * 18 + 1 + x) * sc + xx, (ci * 22 + 1 + y) * sc + yy), col)
    im.save(os.path.join(HERE, 'sprites.png'))


if __name__ == '__main__':
    preview()
    json.dump({'PAL': PAL, 'HEAD': HEAD, 'HAIR_BACK': HAIR_BACK, 'TORSO': TORSO, 'LEGS': LEGS}, open(os.path.join(HERE, 'sprites.json'), 'w'))
