"""Eski 12 şehre imza bölümü: zemin 20'ye göre çizilir, ekleme noktasının zeminine kaydırılır."""
import json
import os

H = 24


class M:
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

    def water(self, x0, x1):
        self.fill(x0, 20, x1, 23, '~')

    def pit(self, x0, x1):
        self.fill(x0, 20, x1, 20, '^')

    def rows(self, floor=20):
        rows = [''.join(r) for r in self.g]
        d = 20 - floor
        return rows[d:] + [rows[-1]] * d if d > 0 else rows


S = {}


def add(id, at, floor, m, hints, npcs, medal=15):
    S[id] = {'at': at, 'rows': m.rows(floor), 'hints': hints, 'npcs': npcs, 'medal': medal}


# 1 İstanbul — Vapur Seferi
m = M(38)
m.put(1, 19, '?')
m.water(4, 33)
m.put(4, 18, '|')
m.put(6, 18, 'MMMM')
m.put(19, 18, '|')
m.put(17, 16, '|')
m.put(20, 16, 'MMMM')
m.put(33, 16, '|')
m.put(12, 12, 'f')
m.put(26, 10, 'f')
m.put(36, 19, 'n')
add('istanbul', 174, 20, m, ['Vapur seferi: iki vapur, iki ritim. Birinden ötekine geç, martılara dikkat.'],
    [{'name': 'Vapur Kaptanı Nuri', 'look': 'amca', 'text': 'Kırk yıldır Karaköy ile Kadıköy arasında gidip gelirim. Dalga sert, martı arsız; ama her sefer bir başka güzel.'}])

# 2 Kocaeli — SEKA rıhtımı
m = M(36)
m.put(1, 19, '?')
m.water(4, 30)
for x, y in [(5, 18), (11, 17), (17, 18), (23, 17)]:
    m.put(x, y, 'XXX')
m.put(14, 12, 'f')
m.put(33, 19, 'n')
add('kocaeli', 144, 20, m, ['Eski SEKA rıhtımı: kâğıt bobinleri çürük, üstünde durma, sek sek geç!'],
    [{'name': 'Fabrika Bekçisi Ayten', 'look': 'teyze', 'text': 'SEKA kapandı ama bacaları hâlâ şehri selamlar. Eskiden burada kâğıt yapılırdı, şimdi park ve müze var.'}])

# 3 İzmir — Kemeraltı tenteleri
m = M(36)
m.put(1, 19, '?')
m.fill(6, 19, 29, 19, '^')
for x, y in [(5, 17), (10, 15), (15, 17), (20, 14), (25, 17)]:
    m.put(x, y, '===')
m.put(18, 9, 'f')
m.put(33, 19, 'n')
add('izmir', 182, 20, m, ['Kemeraltı: tentelerden sek, aşağıdaki çivili kasalara basma.'],
    [{'name': 'Kumrucu Erdem', 'look': 'genc', 'text': 'Kumru dediğin sucuklu, kaşarlı, domatesli olur. Kemeraltı’nda bir tane ye, sonra Kordon’a in!'}])

# 4 Ankara — Kale burcu
m = M(36)
m.put(2, 19, '?')
m.fill(8, 12, 9, 19, '#')
m.fill(15, 12, 16, 19, '#')
m.fill(10, 19, 14, 19, '^')
m.put(12, 6, 'f')
m.put(25, 19, 'c')
m.put(33, 19, 'n')
add('ankara', 168, 20, m, ['Kale burcu: duvara yaslanıp zıpla, tırman. İnince koça dikkat, görünce hücum eder!'],
    [{'name': 'Hamamönü Esnafı Kadir', 'look': 'usta', 'text': 'Ankara simidi bir başka olur, gevrek gevrek. Kaleden inince Hamamönü’nde bir çay iç, yorgunluğun geçer.'}])

# 5 Adana — Seyhan bentleri
m = M(34)
m.put(1, 19, '?')
m.water(4, 28)
m.fill(4, 20, 12, 20, '[')
m.fill(13, 20, 16, 23, '#')
m.put(14, 19, '_')
m.fill(17, 20, 28, 20, ']')
m.put(8, 15, 'f')
m.put(22, 14, 'f')
m.put(31, 19, 'n')
add('adana', 163, 20, m, ['Seyhan bentleri: plakaya basınca turuncu köprü kaybolur, mavi köprü belirir.'],
    [{'name': 'Şalgamcı Hüseyin', 'look': 'amca', 'text': 'Kebabın yanında şalgam olmazsa olmaz! Acılı mı acısız mı diye sorma, Adana’da acılı içilir.'}])

# 6 Mardin — Kasımiye taşları (zemin 18)
m = M(36)
m.put(1, 19, '?')
m.pit(4, 31)
for x, y in [(5, 18), (9, 16), (13, 14), (17, 14), (21, 16), (25, 18)]:
    m.put(x, y, 'XX')
m.put(34, 19, 'e')
add('mardin', 168, 18, m, ['Kasımiye’nin taşları eski: bastığın taş dağılır, durmadan sek!'], [])

# 7 Malatya — kayısı kasaları
m = M(36)
m.put(1, 19, '?')
m.pit(4, 29)
for x in (7, 14, 21, 28):
    m.fill(x, 17, x, 20, '#')
    m.put(x, 16, 'S')
m.put(12, 9, 'f')
m.put(20, 7, 'f')
m.put(33, 19, 'n')
add('malatya', 160, 20, m, ['Kayısı kasaları yay gibidir: kasadan kasaya sek, arılara çarpma.'],
    [{'name': 'Kayısıcı Fatma', 'look': 'teyze', 'text': 'Gün kurusu kayısıyı damlarda sereriz. Güneş ne kadar vurursa o kadar tatlı olur, bir avuç al da yolda ye.'}])

# 8 Çorum — Yerkapı tüneli (zemin 16)
m = M(36)
m.put(1, 19, '?')
m.fill(4, 12, 31, 15, '#')
m.put(4, 18, '>')
m.fill(4, 19, 4, 19, '#')
m.fill(4, 16, 4, 17, '#')
m.put(31, 17, '<')
m.fill(31, 18, 31, 18, ' ')
m.pit(11, 13)
m.pit(21, 23)
add('corum', 168, 16, m, ['Yerkapı: Hititlerin taş tüneli. Ok tuzaklarının ritmini bekle, okun üstünden sek.'], [])

# 9 Ordu — Boztepe teleferiği
m = M(40)
m.put(1, 19, '?')
m.pit(4, 35)
m.put(4, 15, '|')
m.put(6, 15, 'MMM')
m.put(18, 15, '|')
m.put(17, 13, '|')
m.put(19, 13, 'MMM')
m.put(34, 13, '|')
m.put(14, 8, 'f')
m.put(28, 7, 'f')
m.put(37, 19, 'n')
add('ordu', 171, 20, m, ['Boztepe teleferiği: kabinden kabine geç, fındık bahçeleri ayağının altında.'],
    [{'name': 'Fındıkçı Hatice', 'look': 'teyze', 'text': 'Ağustosta bütün aile bahçeye çıkar, fındık elde toplanır. Teleferikten bakınca yamaçlar yeşil bir deniz gibi.'}])

# 10 Sivas — Kızılırmak buzu
m = M(36)
m.put(1, 19, '?')
m.fill(2, 20, 33, 20, 'I')
m.pit(9, 11)
m.pit(19, 22)
m.put(15, 19, 'e')
m.put(27, 19, 'e')
m.put(33, 19, 'n')
add('sivas', 168, 20, m, ['Buz kaygandır: erken bırak, geç dur. Kurtlar buzda da hızlıdır.'],
    [{'name': 'Kangal Sahibi Veli', 'look': 'coban', 'text': 'Kangal sürünün bekçisidir, kurda bile kafa tutar. Ama sana kuyruk sallar, korkma.'}])

# 11 Ardahan — Çıldır buz delikleri
m = M(36)
m.put(1, 19, '?')
m.fill(0, 20, 35, 20, 'I')
for x0 in (7, 16, 25):
    m.fill(x0, 20, x0 + 2, 23, '~')
m.put(12, 12, 'f')
m.put(31, 19, 'n')
add('ardahan', 103, 20, m, ['Çıldır’da buz deliklerinden balık tutulur. Deliğe düşme, rüzgâr seni iter!'],
    [{'name': 'Buz Balıkçısı Sabri', 'look': 'coban', 'text': 'Göl donunca buzu delip ağ salarız, atlı kızakla eve döneriz. Rüzgârı arkana al, gerisi kolay.'}])

# 12 Bayburt — Çoruh salları
m = M(36)
m.put(1, 19, '?')
m.water(4, 29)
m.put(4, 17, '|')
m.put(6, 17, 'MMM')
m.put(16, 17, '|')
m.put(15, 15, '|')
m.put(18, 15, 'MMM')
m.put(29, 15, '|')
m.put(20, 9, 'f')
m.put(33, 19, 'n')
add('bayburt', 30, 20, m, ['Çoruh’un salları: rüzgâr batıdan eser, salın üstünde öne eğil.'],
    [{'name': 'Salcı Rüstem', 'look': 'amca', 'text': 'Çoruh hırçın akar, sal ancak bilene yol verir. Rüzgâra karşı eğil, düşmezsin.'}])

if __name__ == '__main__':
    json.dump(S, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sig.json'), 'w'), ensure_ascii=False)
    print(len(S), 'imza bölümü')
