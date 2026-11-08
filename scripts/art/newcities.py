"""Konya, Nevşehir, Gaziantep haritaları (24 satır). Çıktı: newcities.json {id: rows}"""
import json
import os

H = 24


class Map:
    def __init__(self, w):
        self.w = w
        self.g = [[' '] * w for _ in range(H)]
        self.fill(0, 20, w - 1, 23, '#')

    def fill(self, x0, y0, x1, y1, ch):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.g[y][x] = ch

    def put(self, x, y, s):
        for i, ch in enumerate(s):
            self.g[y][x + i] = ch

    def pit(self, x0, x1, ch='^'):
        """zeminde çukur: üst satır diken/su, alt satırlar taş"""
        self.fill(x0, 20, x1, 23, '#')
        self.fill(x0, 20, x1, 20, ch)

    def water(self, x0, x1):
        self.fill(x0, 20, x1, 23, '~')

    def rows(self):
        return [''.join(r) for r in self.g]


def konya():
    m = Map(214)
    # A — sema halkasını öğren: hendek, halka, yüksek set
    m.put(2, 19, 'P')
    m.put(6, 19, '?')
    m.put(15, 17, 'OO')
    m.fill(20, 16, 27, 19, '#')
    m.put(24, 13, 'C')
    m.put(31, 19, 'k')
    # B — dikenli hendek, iki ters dönen halka
    m.pit(40, 63)
    m.put(45, 17, 'OO')
    m.put(55, 17, 'OO')
    m.put(52, 11, 'f')
    m.put(67, 19, 'F')
    # C — Alaeddin Tepesi: üç halkayla tırman, tepeden devam
    m.put(76, 16, 'OO')
    m.put(81, 11, 'OO')
    m.put(84, 6, 'OO')
    m.fill(88, 5, 97, 19, '#')
    m.put(86, 3, 'C')
    m.put(94, 2, 'f')
    m.put(74, 19, '?')
    # köprü: tepeden medresenin damına
    m.put(98, 6, '=' * 6)
    # D — Karatay Medresesi: anahtar, kapı; damda gizli oda
    m.fill(108, 8, 141, 8, '#')
    m.fill(108, 9, 108, 15, '#')
    m.put(104, 19, '?')
    m.put(110, 17, '====')
    m.put(115, 15, '====')
    m.put(117, 13, 'K')
    m.put(127, 19, 'n')
    m.fill(139, 0, 141, 19, '#')
    m.fill(139, 16, 141, 19, 'D')
    m.fill(128, 4, 136, 4, '#')
    m.fill(136, 4, 136, 7, '#')
    m.fill(128, 6, 128, 7, '%')
    m.fill(128, 5, 128, 5, '#')
    m.put(133, 7, '$')
    m.put(132, 19, 'e')
    # E — uzun dikenli tarla, dört halka, ortada taş sütun
    m.pit(147, 176)
    m.fill(161, 17, 162, 20, '#')
    m.put(151, 16, 'OO')
    m.put(156, 15, 'OO')
    m.put(166, 16, 'OO')
    m.put(171, 15, 'OO')
    m.put(158, 9, 'f')
    m.put(169, 8, 'f')
    m.put(179, 19, 'F')
    # F — Mevlâna avlusu: yılan, yüksek hatıra, semazen, çıkış
    m.put(184, 19, '?')
    m.put(188, 19, 'e')
    m.put(193, 15, 'OO')
    m.put(196, 10, 'C')
    m.put(201, 19, 'n')
    m.put(209, 19, 'E')
    return m.rows()


def nevsehir():
    m = Map(214)
    # A — Göreme: balona bin, peri bacasının tepesine çık
    m.put(2, 19, 'P')
    m.put(6, 19, '?')
    m.put(12, 18, 'BBB')
    m.put(13, 8, ':')
    m.fill(19, 10, 23, 19, '#')
    m.put(21, 9, 'C')
    m.put(27, 19, 'n')
    m.put(32, 19, 'k')
    # B — balon vadisi: dibi dikenli; balondan balona, sütundan uçuruma
    m.pit(38, 73)
    m.put(41, 18, 'BBB')
    m.put(42, 6, ':')
    m.put(51, 18, 'BBB')
    m.put(52, 5, ':')
    m.fill(59, 9, 62, 20, '#')
    m.put(56, 4, 'C')
    m.put(66, 18, 'BBB')
    m.put(67, 4, ':')
    m.fill(72, 7, 80, 19, '#')
    m.put(47, 10, 'f')
    m.put(64, 7, 'f')
    m.put(76, 6, 'F')
    # C — Derinkuyu: yer altı şehri (tavan kapalı, tüneller)
    m.fill(81, 0, 125, 19, '#')
    m.fill(81, 5, 96, 6, ' ')          # 1. kat koridoru
    m.fill(97, 5, 97, 6, '%')          # sahte duvar
    m.fill(98, 5, 103, 6, ' ')
    m.put(102, 6, '$')
    m.fill(95, 7, 96, 11, ' ')         # inen kuyu
    m.fill(84, 12, 116, 13, ' ')       # 2. kat koridoru
    m.put(85, 13, 'K')
    m.put(90, 13, 'n')
    m.put(101, 12, 'u')
    m.fill(110, 12, 110, 13, 'D')      # değirmen taşı kapı
    m.fill(115, 14, 116, 15, ' ')      # ikinci kuyu
    m.fill(98, 15, 125, 18, ' ')       # 3. kat koridoru
    m.fill(105, 19, 106, 19, '^')
    m.put(105, 16, 'C')
    m.put(118, 18, 'e')
    # D — Kızılırmak: çatlak taş köprü, çömlekçi
    m.put(128, 19, 'F')
    m.water(136, 155)
    m.put(138, 18, 'XXX')
    m.put(143, 17, 'XXX')
    m.put(148, 18, 'XXX')
    m.put(152, 17, 'XX')
    m.put(145, 11, 'f')
    m.put(158, 19, '?')
    m.put(161, 19, 'n')
    m.put(166, 19, 'e')
    # E — Uçhisar: balonlarla kaleye
    m.put(176, 18, 'BBB')
    m.put(177, 9, ':')
    m.pit(179, 181)
    m.fill(182, 10, 186, 19, '#')
    m.put(188, 18, 'BBB')
    m.put(189, 3, ':')
    m.pit(191, 195)
    m.fill(196, 6, 213, 19, '#')
    m.put(193, 6, 'f')
    m.put(208, 5, 'E')
    return m.rows()


def gaziantep():
    m = Map(214)
    # A — kale kapısı: tonozun altında ilk tokmaklar
    m.put(2, 19, 'P')
    m.put(8, 19, '?')
    m.put(6, 18, '===')
    m.put(10, 16, '===')
    m.fill(14, 14, 27, 15, '#')
    m.put(18, 16, 'Y')
    m.put(23, 16, 'Y')
    m.put(24, 13, 'C')
    # B — Bakırcılar Çarşısı: uzun çatı, sıra sıra tokmak
    m.put(34, 19, 'n')
    m.put(30, 19, 'k')
    m.fill(37, 14, 80, 15, '#')
    for x in (40, 44, 47, 52, 55, 58, 66, 70, 73, 77):
        m.put(x, 16, 'Y')
    m.put(49, 19, 'e')
    m.put(62, 19, 'e')
    m.fill(60, 14, 62, 15, '%')
    m.put(59, 18, '====')
    m.put(64, 16, '==')
    m.put(66, 13, '$')
    m.put(83, 19, 'F')
    m.put(85, 19, '?')
    # C — fıstık bahçesi: yay, ağaç taçları, arılar, anahtar
    m.put(89, 19, 'S')
    m.put(91, 14, '======')
    m.put(99, 12, '======')
    m.put(101, 11, 'C')
    m.put(107, 10, '======')
    m.put(110, 9, 'K')
    m.put(97, 6, 'f')
    m.put(105, 3, 'f')
    m.put(95, 19, 'e')
    m.put(116, 19, 'e')
    m.put(121, 19, 'S')
    # D — Zeugma Müzesi: iki düğme, iki duvar, anahtarlı kapı
    m.fill(128, 10, 168, 10, '#')
    m.fill(128, 11, 128, 15, '#')
    m.put(124, 19, '?')
    m.put(131, 19, 'n')
    m.put(135, 19, '_')
    m.fill(140, 11, 140, 19, '[')
    m.fill(145, 19, 152, 19, ' ')
    m.fill(145, 20, 152, 20, '^')
    m.put(145, 19, ']' * 8)
    m.put(156, 19, '_')
    m.fill(159, 11, 159, 19, ']')
    m.fill(166, 11, 166, 19, '#')
    m.fill(166, 16, 166, 19, 'D')
    # E — kale burcu: dar sütunlar, tokmaklar, diken
    m.put(172, 19, 'F')
    m.fill(176, 13, 202, 14, '#')
    m.fill(176, 20, 202, 20, '^')
    for x in range(176, 202, 4):
        m.fill(x, 18, x + 1, 20, '#')
    for x in (180, 184, 192, 200):
        m.put(x, 15, 'Y')
    m.put(190, 17, 'C')
    m.put(205, 19, 'n')
    m.put(210, 19, 'E')
    return m.rows()


if __name__ == '__main__':
    out = {'konya': konya(), 'nevsehir': nevsehir(), 'gaziantep': gaziantep()}
    for k, v in out.items():
        print(k, len(v[0]), sum(r.count('C') for r in v), 'C', sum(r.count('F') for r in v), 'F', sum(r.count('n') for r in v), 'n', sum(r.count('?') for r in v), '?')
    json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'newcities.json'), 'w'))
