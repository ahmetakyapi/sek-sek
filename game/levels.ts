import type { LevelDef } from './types'

/**
 * Harita lejantı
 *  #  taş/zemin          =  tek yönlü platform     I  buz        X  çatlak taş (dağılır)
 *  ^  diken (yukarı)     v  diken (aşağı)          ~  su (ölümcül)
 *  >  <  ok tuzağı (o yöne atar)                   S  yay (kasa, trambolin)
 *  P  başlangıç   F  bayrak (kontrol noktası)   E  çıkış kapısı   C  hatıra (bilgi kartı)
 *  e  yerde dolaşan düşman   f  uçan düşman   ?  tabela (ipucu)
 *  M  yatay hareketli platform, sınırları |   N  dikey hareketli platform, sınırları :
 *  süs: l fener · t ağaç · k şehrin hayvanı · w pencere · a kemer · o kasa/küp · b bayrak süsü
 */

const H = 24

/** Alttan hizalı parça: satırları H'ye tamamlar, genişliği eşitler. */
function chunk(rows: string[]): string[] {
  const w = Math.max(...rows.map((r) => r.length))
  const padded = rows.map((r) => r.padEnd(w, ' '))
  while (padded.length < H) padded.unshift(' '.repeat(w))
  if (padded.length > H) throw new Error(`parça ${padded.length} satır, en çok ${H}`)
  return padded
}

function join(...chunks: string[][]): string[] {
  const out: string[] = []
  for (let r = 0; r < H; r++) out.push(chunks.map((c) => c[r]).join(''))
  return out
}

/** Süs ve karakter yerleştirir; hedef boş, altı zemin olmalı (yanlış yere koymayı yakalar). */
function decorate(map: string[], items: [number, number, string][]): string[] {
  const m = map.map((r) => r.split(''))
  for (const [x, y, ch] of items) {
    if (m[y][x] !== ' ') throw new Error(`süs (${x},${y}) dolu: '${m[y][x]}'`)
    if (!'#I='.includes(m[y + 1][x])) throw new Error(`süs (${x},${y}) havada`)
    m[y][x] = ch
  }
  return m.map((r) => r.join(''))
}

const ground = (w: number, n = 4) => Array.from({ length: n }, () => '#'.repeat(w))

/* ───────────────────────── 34 · İSTANBUL ───────────────────────── */
const istanbul = decorate(
  join(
  chunk([
    '',
    '',
    '',
    '',
    '',
    '                   C        ',
    '                  ===       ',
    '                            ',
    '              =====         ',
    ' P l   ?               l  k ',
    ...ground(28),
  ]),
  chunk([
    '                              ',
    '                              ',
    '                              ',
    '                         f    ',
    '                              ',
    '            ===               ',
    '    ?                       l ',
    '######~~#####~~~#####~~~######',
    '######~~#####~~~#####~~~######',
    '######~~#####~~~#####~~~######',
    '######~~#####~~~#####~~~######',
  ]),
  chunk([
    '                              ',
    '                              ',
    '                     C        ',
    '                    ===       ',
    '                              ',
    '                         #####',
    '                   ===   #####',
    '                         #####',
    '              ===        #####',
    '  F  ?           ^^^^  l #####',
    ...ground(30),
  ]),
  chunk([
    '                                ',
    '            f                   ',
    '   l   k          b     l       ',
    '#########   ######   #####      ',
    '#########   ######   #####      ',
    '#########   ######   #####      ',
    '#########   ######   #####      ',
    '#########   ######   #####   F  ',
    '#########~~~######~~~###########',
    '#########~~~######~~~###########',
    '#########~~~######~~~###########',
    '#########~~~######~~~###########',
  ]),
  chunk([
    '             C                    ',
    '                                  ',
    '  ?    |MMM       |  ?     l   E k',
    '########~~~~~~~~~~####~~~~~~######',
    '########~~~~~~~~~~####~~~~~~######',
    '########~~~~~~~~~~####~~~~~~######',
    '########~~~~~~~~~~####~~~~~~######',
  ]),
  ),
  [[11, 19, 's'], [13, 19, 'n'], [38, 19, 'k'], [90, 14, 'k'], [148, 19, 'n']],
)

/* ───────────────────────── 47 · MARDİN ───────────────────────── */
const mardin = decorate(
  join(
  chunk([
    '',
    '                         C    ',
    '                      ########',
    '                  w   ########',
    '                ##############',
    '             e  ##############',
    '          ####################',
    '       a  ####################',
    '     #########################',
    ' P ? #########################',
    ...ground(30),
  ]),
  chunk([
    '                                ',
    '                    ##          ',
    '                    ##          ',
    '                    ##          ',
    '                    ##   #######',
    '                    ##   #######',
    '                    ##   #######',
    '                    ##   #######',
    '                    ##   #######',
    '          C         ##   #######',
    '                         #######',
    '  ?            F ?       #######',
    '######XXXXXXXX##################',
    '######        ##################',
    '######        ##################',
    '######        ##################',
    '######        ##################',
    '######        ##################',
    '######        ##################',
    '######        ##################',
    '######        ##################',
    '######        ##################',
    '######        ##################',
  ]),
  chunk([
    '                                  ',
    '#######                           ',
    '#######                           ',
    '#######  XXX                      ',
    '#######                           ',
    '#######        ###    C           ',
    '#######                           ',
    '#######              XXX          ',
    '#######                      F    ',
    '#######                    #######',
    '#######                    #######',
    '#######                    #######',
    '#######                    #######',
    '#######                    #######',
    '#######                    #######',
    '#######                    #######',
    '#######                    #######',
    '#######                    #######',
    '#######^^^^^^^^^^^^^^^^^^^^#######',
    '##################################',
  ]),
  chunk([
    '    e     a                    ',
    '##########                     ',
    '##########                     ',
    '##########    e        a       ',
    '##################             ',
    '##################             ',
    '##################  k   a  E   ',
    ...ground(32, 6),
  ]),
  ),
  [[20, 13, 's'], [23, 11, 'n'], [62, 4, 'k'], [108, 14, 'n']],
)

/* ───────────────────────── 44 · MALATYA ───────────────────────── */
const malatya = decorate(
  join(
  chunk([
    '                     C          ',
    '                        f       ',
    '                                ',
    '                            t   ',
    '                  ##############',
    '                  ##############',
    '                  ##############',
    '                  ##############',
    ' P  ?   t   t  S  ##############',
    ...ground(32),
  ]),
  chunk([
    '            C :                 ',
    '                                ',
    '                     F          ',
    '                    ############',
    '        :           ############',
    '                    ############',
    '              NNN   ############',
    '                    ############',
    '                    ############',
    '              :     ############',
    '                    ############',
    '######  NNN         ############',
    '######              ############',
    '######  :           ############',
    '######              ############',
    '######              ############',
    '######              ############',
    '######              ############',
    '######              ############',
    '######              ############',
  ]),
  chunk([
    '   ?    t                         ',
    '########                          ',
    '########                          ',
    '########     C                    ',
    '########                          ',
    '########            f             ',
    '########                          ',
    '########                          ',
    '########                          ',
    '########        S                 ',
    '########        #                 ',
    '########        #          t      ',
    '########  S ^^^^#^^^^^^^   o   E  ',
    ...ground(34),
  ]),
  ),
  [[9, 19, 'm'], [10, 19, 'm'], [11, 19, 'm'], [22, 14, 's'], [26, 14, 'n'], [30, 14, 'm'], [31, 14, 'm'], [88, 19, 'm'], [89, 19, 'm'], [92, 19, 'n']],
)

/* ───────────────────────── 19 · ÇORUM ───────────────────────── */
const corum = decorate(
  join(
  chunk([
    '                         C        ',
    '                                  ',
    '                              ####',
    '                              ####',
    '                           ===####',
    '                              ####',
    '                        ===   ####',
    ' P ?        ^^      ^^        <###',
    ...ground(34),
  ]),
  chunk([
    '            C                     ',
    '                F ?               ',
    '##########XXXXX#####  ############',
    '##########     #####  ############',
    '##########     #####  ############',
    '##########     #####         vv   ',
    '##########     #####              ',
    '##########     #####     ^^       ',
    '##########     ###################',
    '##########     ###################',
    '##########     ###################',
    '##########     ###################',
  ]),
  chunk([
    '                                  ##',
    '                                  ##',
    '############                      ##',
    '############                  E   <#',
    '############           XX     ######',
    '     C                      ########',
    '                  XX        ########',
    '             F  ^^^^^^^^^^^^########',
    ...ground(36),
  ]),
  ),
  [[5, 19, 's'], [8, 19, 'n'], [62, 13, 'n'], [66, 13, 'k'], [97, 16, 's']],
)

/* ───────────────────────── 58 · SİVAS ───────────────────────── */
const sivas = decorate(
  join(
  chunk([
    '                         C        ',
    '                        ===       ',
    ' P ?    k                    e    ',
    '##########IIIIIIII~~~IIIIIIIIIIIII',
    '##################~~~#############',
    '##################~~~#############',
    '##################~~~#############',
  ]),
  chunk([
    '           C                        ',
    '        ##                          ',
    '        ##        f                 ',
    '        ##                          ',
    '        ##   ##XXXXXX               ',
    '        ##   ##          F          ',
    '        ##   ##      ###############',
    '        ##   ##      ###############',
    '        ##   ##      ###############',
    '        ##   ##      ###############',
    '        ##   ##      ###############',
    '        ##   ##      ###############',
    '             ##      ###############',
    '   ?     k   ##      ###############',
    '###############      ###############',
    '###############      ###############',
    '###############      ###############',
    '###############      ###############',
  ]),
  chunk([
    '                      C  f          ',
    '                                    ',
    '######                              ',
    '######         III    |MMM      |E  ',
    '######   III                    ####',
    '######                         #####',
    '######                         #####',
    '######                         #####',
    '######                         #####',
    '######                         #####',
    '######~~~~~~~~~~~~~~~~~~~~~~~~~#####',
    '######~~~~~~~~~~~~~~~~~~~~~~~~~#####',
    '######~~~~~~~~~~~~~~~~~~~~~~~~~#####',
    '######~~~~~~~~~~~~~~~~~~~~~~~~~#####',
  ]),
  ),
  [[5, 19, 's'], [12, 19, 'n'], [61, 11, 'k'], [64, 11, 'n']],
)

/* ───────────────────────── 69 · BAYBURT ───────────────────────── */
const bayburt = decorate(
  join(
  chunk([
    '             C                    ',
    '                                  ',
    '                                  ',
    ' P ?                    e       S ',
    '############~~~~##################',
    '############~~~~##################',
    '############~~~~##################',
    '############~~~~##################',
  ]),
  chunk([
    '                  C                 ',
    '                                    ',
    '                          ##########',
    '                     ===  ##########',
    '                          <#########',
    '                 ===      ##########',
    '             F            ##########',
    '            ####          ##########',
    '            ####          ##########',
    '        XX  ####          ##########',
    '            ####          ##########',
    '######      ####          ##########',
    '######      ####          ##########',
    '######      ####          ##########',
    '######      ####          ##########',
    '######      ####          ##########',
    '######      ####          ##########',
    '######      ####          ##########',
    '######      ####          ##########',
    '######^^^^^^####^^^^^^^^^^##########',
    '####################################',
  ]),
  chunk([
    '                     C              ',
    '                f                   ',
    '   F                                ',
    '##########   XX                     ',
    '##########        XX                ',
    '##########             ==        E  ',
    '##########                    ######',
    '##########                    ######',
    '##########                    ######',
    '##########                    ######',
    '##########                    ######',
    '##########                    ######',
    '##########                    ######',
    '##########                    ######',
    '##########                    ######',
    '##########                    ######',
    '##########                    ######',
    '##########                    ######',
    '##########                    ######',
    '##########^^^^^^^^^^^^^^^^^^^^######',
    '####################################',
  ]),
  ),
  [[6, 19, 'n'], [9, 19, 's'], [20, 19, 'k'], [62, 4, 'n'], [66, 4, 'k']],
)

export const LEVELS: LevelDef[] = [
  {
    id: 'istanbul',
    city: 'istanbul',
    name: 'İstanbul',
    plate: 34,
    subtitle: 'Boğaz Kıyısı',
    difficulty: 'Kolay',
    note: 'Vapurdan inince bir simit al, yarısını martılarla paylaş. Galata’dan bakınca iki kıta tek nefeste görünür.',
    npcs: [
      { name: 'Simitçi Hasan Amca', look: 'amca', text: 'Taze simit, sıcak sıcak! Martılara kaptırma evladım, onlar da çok seviyor.' },
      { name: 'İskele Görevlisi Selin', look: 'genc', text: 'Vapur az önce kalktı ama iskele platformu hâlâ gidip geliyor. Zamanını kolla, atla!' },
    ],
    medals: [45, 75, 120],
    quips: ['Martılar bunu gördü.', 'Boğaz’ın suyu bu mevsim serin.', 'Simit bile bu kadar yuvarlanmaz.', 'Vapur beklemez, ama bayrak bekler.'],
    item: 'Simit',
    intro: 'Martıların, vapurların ve iki kıtanın şehri. Rıhtımdan Galata yokuşuna, oradan iskeleye uzanan ilk yolculuk.',
    facts: [
      { title: 'İki kıtada bir şehir', text: 'İstanbul, Boğaz’ın iki yakasına yayılır: bir yanı Avrupa, bir yanı Asya. Boğaz, Karadeniz’i Marmara Denizi’ne bağlayan yaklaşık 30 km’lik bir su yoludur.' },
      { title: 'Galata Kulesi', text: 'Galata Kulesi 1348’de Cenevizliler tarafından inşa edildi. Yüzyıllar boyunca yangın gözetleme kulesi olarak da kullanıldı.' },
      { title: 'Simit', text: 'Simit, 16. yüzyıl Osmanlı kayıtlarında geçen köklü bir sokak lezzetidir. Pekmeze batırılıp susama bulanarak fırınlanır.' },
    ],
    hints: [
      '← → ile yürü, ZIPLA ile atla. Tuşu uzun basılı tutarsan daha yükseğe çıkarsın.',
      'Boğaz’ın suyu soğuk, düşme! Martıların üstüne basarak onları uzaklaştırabilirsin.',
      'Bayrağa dokun: düşersen buradan devam edersin. İnce platformların altından geçip üstüne zıplayabilirsin.',
      'İskele: hareketli platforma bin, suyun üstünden geç.',
      'ATIL (X / Shift): havadayken bir kez hızla fırla. Yere değince yenilenir. Zıpla, sonra atıl!',
    ],
    map: istanbul,
  },
  {
    id: 'mardin',
    city: 'mardin',
    name: 'Mardin',
    plate: 47,
    subtitle: 'Taş Teraslar',
    difficulty: 'Orta',
    note: 'Taş evler akşam güneşinde bal rengine döner. Abbaraların gölgesinde bir fincan mırra iç, acısına alışırsın.',
    npcs: [
      { name: 'Mırracı Cemil Usta', look: 'usta', text: 'Mırra acıdır, yudum yudum içilir. Fincanı masaya koyma, elime ver; yoksa fincanı altınla doldurursun derler!' },
      { name: 'Telkari Ustası Meryem', look: 'teyze', text: 'Bu gümüş tel saç telinden ince. Sabırsız eller telkari öremez, sen de duvarlarda acele etme.' },
    ],
    medals: [50, 85, 130],
    quips: ['Taşlar sabırlıdır, sen de ol.', 'Eşek bile bu yokuşu daha iyi çıkıyor.', 'Akrep güldü, duydum.', 'Abbaranın gölgesinde bir soluklan.'],
    item: 'Telkari',
    intro: 'Mezopotamya ovasına bakan bal rengi taş evler. Teras teras tırman, abbaraların altından geç.',
    facts: [
      { title: 'Bal rengi taş', text: 'Mardin’in evleri yörenin yumuşak kalker taşından yapılır. Taş kolay oyulur, havayla temas ettikçe sertleşir ve şehre bal rengini verir.' },
      { title: 'Telkari', text: 'Telkari, ince gümüş tellerin bükülüp kaynatılmasıyla yapılan bir kuyumculuk sanatıdır. Midyat telkarisi bu sanatın en bilinen örneklerindendir.' },
      { title: 'Kasımiye Medresesi', text: 'Kasımiye Medresesi Akkoyunlular döneminde, 15. yüzyılın sonlarında tamamlandı. Avlusundaki su kanalı, insan ömrünü simgeleyen bir yolculuğa benzetilir.' },
    ],
    hints: [
      'Akrepler terasta dolaşır. Üstlerine zıpla ya da atılarak çarp.',
      'Çatlak taşlar basınca dağılır. Durmadan koş!',
      'Duvar tırmanışı: duvara doğru bas, değince zıpla. Karşı duvara seke seke yüksel.',
    ],
    map: mardin,
  },
  {
    id: 'malatya',
    city: 'malatya',
    name: 'Malatya',
    plate: 44,
    subtitle: 'Kayısı Bahçeleri',
    difficulty: 'Orta',
    nickname: 'Erik Diyarı',
    note: 'Haziranda gel, dallar turuncuya keser. Kayısıyı damlarda güneşe sererler; bir avuç al, cebine koy.',
    npcs: [
      { name: 'Kayısıcı Fadime Teyze', look: 'teyze', text: 'Damda kurutuyoruz kuzum, güneş tatlandırıyor. Al bir avuç, yolda acıkırsın!' },
      { name: 'Bahçıvan Ali', look: 'amca', text: 'Kasalara dikkat! Üstüne zıplarsan bahçenin öbür ucuna uçarsın. Arılara da bulaşma.' },
    ],
    medals: [45, 75, 120],
    quips: ['Bir kayısı daha, son olsun.', 'Arılar seni çok sevdi.', 'Kasa yay gibi, sen de öyle ol.', 'Kuru kayısı da düşünce kalkar.'],
    item: 'Kayısı',
    intro: 'Haziranda dallar turuncuya keser. Kayısı kasalarından sekerek bahçeleri aş, Aslantepe’ye ulaş.',
    facts: [
      { title: 'Kayısının başkenti', text: 'Türkiye dünyanın en büyük kuru kayısı üreticisidir ve bu üretimin büyük bölümü Malatya’dan gelir. Malatya kayısısı coğrafi işaretlidir.' },
      { title: 'Aslantepe Höyüğü', text: 'Aslantepe Höyüğü 2021’de UNESCO Dünya Mirası Listesi’ne girdi. Höyükte bilinen en eski devlet yapılanmalarından birine ait izler bulundu.' },
      { title: 'Battalgazi Ulu Camii', text: 'Battalgazi’deki Ulu Camii 13. yüzyıl Anadolu Selçuklu dönemine aittir. Tuğla ve çini işçiliğiyle dönemin önemli eserlerindendir.' },
    ],
    hints: [
      'Kayısı kasası yay gibidir: üstüne düşünce seni fırlatır.',
      'Arılar havada salınır. Üstlerine bas ya da atılarak geç. Kasalar arasında atılmak seni uzağa taşır.',
    ],
    map: malatya,
  },
  {
    id: 'corum',
    city: 'corum',
    name: 'Çorum',
    plate: 19,
    subtitle: 'Hattuşa Surları',
    difficulty: 'Zor',
    nickname: 'Çorumçe',
    note: 'Leblebi sıcakken yenir, Hattuşa’nın taşları sabırla okunur. Aslanlı Kapı’dan geçerken başını kaldır.',
    npcs: [
      { name: 'Leblebici Osman Usta', look: 'usta', text: 'Leblebi üç kere kavrulur, üç kere dinlenir. Acele işe şeytan karışır, okların ritmini de öyle bekle!' },
      { name: 'Arkeolog Defne', look: 'genc', text: 'Bu tabletler üç bin yıllık. Hititçe hâlâ öğreniyorum ama “barış” kelimesini ilk ben buldum!' },
    ],
    medals: [45, 75, 120],
    quips: ['Hitit okçuları hâlâ nöbette.', 'Leblebi kavrulur, sen de tecrübeyle.', 'Üç bin yıllık taş, bir saniyelik hata.', 'Tablete yazılacak bir düşüş daha.'],
    item: 'Leblebi',
    intro: 'Hititlerin başkenti Hattuşa. Ok tuzaklarını atlat, Yerkapı tünelinden geç, Aslanlı Kapı’ya var.',
    facts: [
      { title: 'Hattuşa', text: 'Hattuşa, Hitit İmparatorluğu’nun başkentiydi ve 1986’da UNESCO Dünya Mirası Listesi’ne alındı. Kentin girişlerinden biri Aslanlı Kapı’dır.' },
      { title: 'Kadeş Antlaşması', text: 'Hititler ile Mısır arasında MÖ 13. yüzyılda yapılan Kadeş Antlaşması, bilinen en eski yazılı barış antlaşmalarındandır. Hititçe kopyası Hattuşa’da bulunan kil tabletlerdedir.' },
      { title: 'Çorum leblebisi', text: 'Çorum, leblebisiyle ünlüdür. Nohut birkaç kez kavrulup dinlendirilerek leblebiye dönüşür; bu iş günler sürebilir.' },
    ],
    hints: [
      'Hitit ok tuzakları düzenli aralıkla atar. Ritmi izle, okun üstünden atla.',
      'Yerkapı: surun altından geçen taş tünel. Tavan alçak, kısa zıpla!',
    ],
    map: corum,
  },
  {
    id: 'sivas',
    city: 'sivas',
    name: 'Sivas',
    plate: 58,
    subtitle: 'Buzlu Kızılırmak',
    difficulty: 'Zor',
    note: 'Kangallar sürüyü korur, sen de onların yolundan şaşma. Buzda acele etme, Kızılırmak buradan doğar.',
    npcs: [
      { name: 'Çoban Mehmet ve Karabaş', look: 'coban', text: 'Bu Kangal’ın adı Karabaş. Kurdu görse durur, seni görse kuyruk sallar. Buzda koşma, kayarsın!' },
      { name: 'Medrese Bekçisi Zehra', look: 'teyze', text: 'Çifte Minareli 1271’den beri burada. Minarelerin arasından tırmanırsan şehri tepeden görürsün.' },
    ],
    medals: [50, 85, 140],
    quips: ['Karabaş başını iki yana salladı.', 'Buz affetmez.', 'Kızılırmak bile bu kadar kıvrılmaz.', 'Kangal izliyor, utandık.'],
    item: 'Kangal rozeti',
    intro: 'Kar, buz ve Selçuklu taş işçiliği. Kaygan zeminde dengeni koru, minareler arasında tırman.',
    facts: [
      { title: 'Divriği Ulu Camii', text: 'Divriği Ulu Camii ve Darüşşifası 1985’te UNESCO Dünya Mirası Listesi’ne giren ilk Türkiye eserlerindendir. Taş kapılarındaki işçilik dünyada eşsiz sayılır.' },
      { title: 'Sivas Kongresi', text: 'Sivas Kongresi 4–11 Eylül 1919’da toplandı. Milli Mücadele’nin dönüm noktalarından biridir.' },
      { title: 'Kangal köpeği', text: 'Kangal çoban köpeği adını Sivas’ın Kangal ilçesinden alır. Sürüyü kurda karşı koruyan sakin ve güçlü bir bekçidir.' },
    ],
    hints: [
      'Buz kaygandır! Durmak için ters yöne bas.',
      'Çifte Minareli Medrese: minarelerin arasında duvardan duvara sekerek tırman.',
    ],
    map: sivas,
  },
  {
    id: 'bayburt',
    city: 'bayburt',
    name: 'Bayburt',
    plate: 69,
    subtitle: 'Kale ve Fırtına',
    difficulty: 'Çok Zor',
    nickname: 'Uktun',
    note: 'Yolun sonu, başladığım yer. Kalenin burcundan Çoruh’a bak, beni hatırla.',
    npcs: [
      { name: 'Ozan Korkut Dede', look: 'ozan', text: 'Dede Korkut gibi anlat hikâyeni evlat: kopuzun teli gerilsin, söz yerini bulsun. Rüzgâra eğil, yürü.' },
      { name: 'Kale Bekçisi Rıza', look: 'amca', text: 'Rüzgâr hep batıdan eser burada. Deden de bu burçlarda oynardı, ben hatırlarım. Hadi, son sayfa seni bekliyor.' },
    ],
    medals: [55, 95, 150],
    quips: ['Rüzgâr şakacıdır.', 'Çoruh’a selam söyle.', 'Kale yüzyıllardır sabırlı.', 'Dede Korkut bunu da anlatır.'],
    item: 'Kopuz',
    intro: 'Çoruh kıyısından Bayburt Kalesi’ne. Rüzgâr batıdan eser, seni geri iter. Her şeyi öğrendin, şimdi kullan.',
    facts: [
      { title: 'En az nüfuslu il', text: 'Bayburt, Türkiye’nin nüfusu en az olan ilidir. Şehir, Çoruh Nehri’nin iki yakasında kurulmuştur.' },
      { title: 'Dede Korkut', text: 'Dede Korkut’un mezarının Bayburt’un Masat köyünde olduğuna inanılır. Şehirde her yıl Dede Korkut adına kültür şöleni düzenlenir.' },
      { title: 'Baksı Müzesi', text: 'Bayburt’un bir köyünde kurulan Baksı Müzesi, 2014’te Avrupa Konseyi Müze Ödülü’nü kazandı.' },
    ],
    hints: ['Rüzgâr seni geri itiyor. Uzun boşluklarda zıpla, en tepede atıl.'],
    wind: -210,
    map: bayburt,
  },
]

export const levelIndex = (id: string) => LEVELS.findIndex((l) => l.id === id)
