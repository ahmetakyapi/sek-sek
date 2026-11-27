/**
 * Modlar ekranının saf mantığı (DOM'suz, testli): mod kataloğu, arama ve süzgeç, "Sana Önerilen", sayı tuşları,
 * oklarla gezinti. Metinler Türkçe anahtardır; arayüz `t()` ile çevirir.
 */

export type ModeId = 'daily' | 'trio' | 'tournament' | 'rules' | 'challenges' | 'mirror' | 'tour' | 'rush' | 'marathon' | 'chase' | 'rage' | 'cark' | 'duel' | 'coop' | 'gezgin' | 'calm' | 'story' | 'quiz' | 'editor' | 'community'

export interface ModeMeta {
  id: ModeId
  /** 1 Kolay, 2 Orta, 3 Zor */
  heat: 1 | 2 | 3
  /** kaç kişi oynar */
  players: 1 | 2
  /** sunucuda sıralaması var */
  ranked: boolean
  /** son sürümde eklendi (Yeni rozeti) */
  isNew: boolean
  /** aramada ek sözcükler (Türkçe ve İngilizce): kutucukta yazmayan ama oyuncunun aradığı sözler */
  tags: string
  /** ilk girişte gösterilen nasıl oynanır adımları; boşsa kart yok (sayfa açanlar) */
  howto: string[]
}

/** Kutucuk sırası (ızgaradaki sıra): ilk dokuzu sayı tuşlarıyla açılır */
export type TileId = Exclude<ModeId, 'daily' | 'trio' | 'tournament'>
export const TILE_ORDER: TileId[] = ['rules', 'challenges', 'mirror', 'tour', 'rush', 'marathon', 'chase', 'rage', 'duel', 'coop', 'gezgin', 'calm', 'story', 'cark', 'quiz', 'editor', 'community']

/** Modun görünen adı (Türkçe anahtar; arayüz t() ile çevirir) */
export const NAME: Record<ModeId, string> = {
  daily: 'Günlük Meydan Okuma',
  trio: 'Günün Üçlüsü',
  tournament: 'Haftalık Turnuva',
  rules: 'Kurallı Koşu',
  challenges: 'Mücadeleler',
  mirror: 'Ayna Yolu',
  tour: 'Speedrun',
  rush: 'Boss Rush',
  marathon: 'Maraton',
  chase: 'Kovalamaca',
  rage: 'Sinir Bozucu',
  cark: 'Çark-ı Felek',
  duel: 'Düello',
  coop: 'Co-op',
  gezgin: 'Gezgin Turu',
  calm: 'Sakin Gezi',
  story: 'Hikâye Gezisi',
  quiz: 'Defter Bilmecesi',
  editor: 'Bölüm Düzenleyici',
  community: 'Topluluk Haritaları',
}

export const MODES: Record<ModeId, ModeMeta> = {
  daily: { id: 'daily', heat: 2, players: 1, ranked: true, isNew: false, tags: 'günlük bugün meydan okuma daily', howto: [] },
  trio: { id: 'trio', heat: 2, players: 1, ranked: true, isNew: true, tags: 'üçlü günün trio günlük', howto: [] },
  tournament: { id: 'tournament', heat: 3, players: 1, ranked: true, isNew: false, tags: 'haftalık turnuva weekly', howto: [] },
  rules: {
    id: 'rules',
    heat: 2,
    players: 1,
    ranked: true,
    isNew: false,
    tags: 'kural tek can dash’siz zamana karşı rules',
    howto: ['Bitirdiğin bir şehri seç.', 'Bir kural seç: Tek Can, Zamana Karşı, Dash’siz…', 'Bitir; rekorun şehir ve kural başına yazılır.'],
  },
  challenges: {
    id: 'challenges',
    heat: 3,
    players: 1,
    ranked: false,
    isNew: false,
    tags: 'parkur kısa madalya challenge',
    howto: ['Zor şehirlerden kesilmiş kısa parkurlar.', 'Süreni madalya sürelerine göre geç.', 'Her parkurun en iyisi cihazında kalır.'],
  },
  mirror: {
    id: 'mirror',
    heat: 2,
    players: 1,
    ranked: false,
    isNew: false,
    tags: 'ayna ters sağdan sola mirror',
    howto: ['Şehir sağdan sola döner; rüzgâr da ters eser.', 'Hatıra yok; yalnız yol ve süre.', 'Ayna rekorun cihazında kalır.'],
  },
  tour: {
    id: 'tour',
    heat: 3,
    players: 1,
    ranked: true,
    isNew: false,
    tags: 'speedrun tam tur yüzde otuz şehir',
    howto: ['İlk defterin otuz şehri arka arkaya koşulur.', 'Tek süre tutulur; ara süreler gösterilir.', 'Yüzde ve aynalı tur da buradan açılır.'],
  },
  rush: {
    id: 'rush',
    heat: 3,
    players: 1,
    ranked: true,
    isNew: false,
    tags: 'boss rush kabus çifte dövüş',
    howto: ['Yendiğin boss’larla arka arkaya dövüşürsün.', 'Her boss’ta işareti bekle, yorulunca üstüne bas.', 'Kâbus ve Çifte daha sert çeşitlerdir.'],
  },
  marathon: {
    id: 'marathon',
    heat: 2,
    players: 1,
    ranked: false,
    isNew: false,
    tags: 'maraton rastgele üç şehir marathon',
    howto: ['Her koşuda rastgele üç şehir gelir.', 'Aralarda soluk yok: süre durmaz.', 'Rekor cihazında kalır.'],
  },
  chase: {
    id: 'chase',
    heat: 2,
    players: 1,
    ranked: true,
    isNew: false,
    tags: 'kovalamaca kangal köpek chase',
    howto: ['Bir Kangal izini sürer ve gittikçe hızlanır.', 'Durma; bulmaca ve beklemede köpek de oturur.', 'Yakalanmadan şehri bitir.'],
  },
  rage: {
    id: 'rage',
    heat: 3,
    players: 1,
    ranked: true,
    isNew: true,
    tags: 'sinir bozucu öfke parkur kaygan karanlık ters tuş rage cehennem',
    howto: ['Her kural dünyayı bir yerinden bozar: kaygan, karanlık, ters tuşlar…', 'Kolaydan zora sıralıdır; sevdiğini seç.', 'Parkurlar: elle çizilmiş uzun ve çok zor yollar.'],
  },
  cark: {
    id: 'cark',
    heat: 2,
    players: 1,
    ranked: false,
    isNew: true,
    tags: 'çark felek şans rastgele kural para parça ödül wheel fortune spin random',
    howto: ['Çarkı çevir: bitirdiğin bir şehir ve o şehre uyan bir kural çıkar.', 'Koşuyu bitir; günün ilk üç çevirmesi kuralın zorluğuna göre Mağaza parçası verir.', 'Bitirmeden yeniden çevirirsen serin sıfırlanır.'],
  },
  duel: {
    id: 'duel',
    heat: 1,
    players: 2,
    ranked: false,
    isNew: false,
    tags: 'düello yarış iki kişi duel versus',
    howto: ['İki oyuncu aynı yolda yarışır.', 'Yan yana ya da sırayla; 1, 3 ya da 5 tur.', 'Şartları sen koyarsın: düşüş cezası, avantaj.'],
  },
  coop: {
    id: 'coop',
    heat: 1,
    players: 2,
    ranked: false,
    isNew: false,
    tags: 'co-op birlikte iki kişi arkadaş ortak',
    howto: ['İki yolcu aynı ekranda birlikte ilerler.', 'Biri düşerse ikisi de son bayraktan doğar.', 'Birbirinin omzuna zıplayarak yüksek yere çıkın.'],
  },
  gezgin: {
    id: 'gezgin',
    heat: 2,
    players: 1,
    ranked: false,
    isNew: true,
    tags: 'gezgin turu tohum rastgele kesit seed random',
    howto: ['Bir tohum yaz ya da rastgele seç: herkes için aynı kesitler çıkar.', 'Kesitleri istediğin sırayla koş.', 'Hepsi bitince toplam süren tohumun rekoru olur; tohumu arkadaşına söyle.'],
  },
  calm: {
    id: 'calm',
    heat: 1,
    players: 1,
    ranked: false,
    isNew: true,
    tags: 'sakin gezi keşif rahat fotoğraf ölümsüz calm explore relax',
    howto: ['Bir şehir seç ve acele etmeden gez.', 'Düşüş sayılmaz, skor ve rekor yazılmaz.', 'Molada Fotoğraf Kipi ile kartpostal çek.'],
  },
  story: {
    id: 'story',
    heat: 1,
    players: 1,
    ranked: false,
    isNew: true,
    tags: 'hikaye hikâye gezi tanış konuş diyalog karakter sohbet şehir insanı story talk dialogue meet characters',
    howto: ['Bir şehir seç; süre yok, düşüşün sayılmaz.', 'Bir şehir insanına yaklaşınca E ya da Enter’a bas (dokunmatikte “Konuş”), cevabını seç.', 'Üç soruyla üç yıldız topla; yıldızlar Defter → Tanıştıklarım’da durur.'],
  },
  quiz: {
    id: 'quiz',
    heat: 1,
    players: 1,
    ranked: false,
    isNew: true,
    tags: 'bilmece bilgi yarışma soru test defter şehir quiz trivia',
    howto: ['Bitirdiğin şehirlerden on soru: hatıra, boss, takma ad, defter sayfası.', 'Dört şehirden doğrusunu seç; hızlı yanıt bonus puan getirir.', 'İlk tam puan Mağaza parçası kazandırır.'],
  },
  editor: { id: 'editor', heat: 1, players: 1, ranked: false, isNew: false, tags: 'düzenleyici harita yap çiz editor', howto: [] },
  community: { id: 'community', heat: 1, players: 1, ranked: false, isNew: false, tags: 'topluluk harita galeri community', howto: [] },
}

/** aramada büyük/küçük, Türkçe ünlü işareti ve ı/i farkı yok sayılır */
export const foldText = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')

/** her sözcük metinlerin birinde geçmeli ("iki kişi" iki sözcüktür, ikisi de bulunmalı) */
export function matchesQuery(query: string, texts: string[]): boolean {
  const words = foldText(query).split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const hay = foldText(texts.join(' '))
  return words.every((w) => hay.includes(w))
}

/** Süzgeç çipleri: tek satıra sığan beş seçenek (zorluk ve "Yeni" kutucuğun rozetinde okunur, aramayla da bulunur) */
export type ModeFilter = 'all' | 'solo' | 'together' | 'ranked' | 'open'
export const FILTERS: ModeFilter[] = ['all', 'solo', 'together', 'ranked', 'open']

export function passesFilter(f: ModeFilter, id: ModeId, open: boolean): boolean {
  const m = MODES[id]
  switch (f) {
    case 'all':
      return true
    case 'solo':
      return m.players === 1
    case 'together':
      return m.players === 2
    case 'ranked':
      return m.ranked
    case 'open':
      return open
  }
}

/** sayı tuşu (1-9) → mod; dokuzdan ötesi ve geçersiz tuş yok */
export function modeForDigit(key: string): ModeId | null {
  return /^[1-9]$/.test(key) ? (TILE_ORDER[Number(key) - 1] ?? null) : null
}

export interface RecState {
  /** rekoru olan şehir sayısı */
  cities: number
  /** Kurallı Koşu ve Sinir Bozucu dışındaki kural rekorları */
  ruleRecords: number
  bossesBeaten: number
  rushNeeds: number
  rushPlayed: boolean
  dailyUsed: boolean
  /** bugünkü Üçlü'den biten parça sayısı (günlük dahil) */
  trioDone: number
  mirrorOpen: boolean
  mirrorDone: number
  challengeDone: number
  /** "Devam Et" şeridindeki mod: tekrar önerilmez */
  last?: string | null
  /** ekranda zaten görünen modlar: önerilmez */
  skip?: ModeId[]
}

export interface Recommendation {
  id: ModeId
  /** Türkçe neden cümlesi (arayüz t() ile çevirir) */
  why: string
}

/** Oyuncunun durumuna göre en çok iki mod, öncelik sırasıyla */
export function recommend(s: RecState): Recommendation[] {
  const out: Recommendation[] = []
  const add = (id: ModeId, why: string) => {
    if (out.length < 2 && s.last !== id && !s.skip?.includes(id) && !out.some((r) => r.id === id)) out.push({ id, why })
  }
  if (s.cities === 0) {
    add('daily', 'Her gün herkese aynı şehir ve kural. Günde tek hak.')
    add('coop', 'İki kişi tek klavyede, Şehir Yolu’ndan başla.')
    return out
  }
  if (!s.dailyUsed) add('daily', 'Bugünün meydan okuması seni bekliyor.')
  if (s.trioDone > 0 && s.trioDone < 3) add('trio', 'Günün Üçlüsü’nden {n}/3 bitti. Kalanı serbest tekrar.')
  if (s.bossesBeaten >= s.rushNeeds && !s.rushPlayed) add('rush', 'Yendiğin boss’lar arka arkaya. İlk rekorunu yaz.')
  if (s.cities <= 5 && s.ruleRecords === 0) add('rules', 'İlk şehrini bitirdin: şimdi kuralı sen seç.')
  if (s.mirrorOpen && s.mirrorDone === 0) add('mirror', 'Otuz şehir bitti: bu sefer sağdan sola.')
  if (s.challengeDone === 0 && s.cities >= 3) add('challenges', 'Zor şehirlerin en sıkı yerleri, kısa parkurlarda.')
  if (s.trioDone === 0) add('trio', 'Günün Üçlüsü: meydan okuma, mücadele ve boss.')
  add('rules', 'Bitirdiğin şehri yeni bir kuralla yeniden koş.')
  return out
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Oklarla gezinti: kutucuk kutularından, `from` kutucuğundan verilen yöne en yakın komşunun sırası.
 * Sol/sağ DOM sırasında bir adım; yukarı/aşağı bir alt/üst satırda yatayda en yakın kutucuk.
 * Komşu yoksa `from` döner.
 */
export function neighbor(boxes: Box[], from: number, dir: 'left' | 'right' | 'up' | 'down'): number {
  if (dir === 'left') return Math.max(0, from - 1)
  if (dir === 'right') return Math.min(boxes.length - 1, from + 1)
  const cur = boxes[from]
  if (!cur) return from
  const cx = cur.x + cur.w / 2
  const cy = cur.y + cur.h / 2
  const sign = dir === 'down' ? 1 : -1
  let rowY: number | null = null
  let best = from
  let bestDx = Infinity
  const rows = boxes
    .map((b, i) => ({ i, dy: (b.y + b.h / 2 - cy) * sign, dx: Math.abs(b.x + b.w / 2 - cx) }))
    .filter((r) => r.dy > cur.h / 2)
    .sort((a, b) => a.dy - b.dy)
  for (const r of rows) {
    if (rowY === null) rowY = r.dy
    if (r.dy - rowY > cur.h / 2) break
    if (r.dx < bestDx) ((bestDx = r.dx), (best = r.i))
  }
  return best
}
