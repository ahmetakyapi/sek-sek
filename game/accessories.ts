/**
 * Kılık Dükkânı: her karaktere (Uktun ya da Memo) ayrı ayrı üç yuvada birer parça takılır: baş, yüz ve sırt (kombin).
 * Parçalar ya karaktere özgüdür (`for`) ya ortaktır; alınan parça yalnız o karaktere açılır. Para birimi "parça"dır
 * (`walletOf`): yolda bulunan her hatıra, gizli pul ve nazar boncuğu 1, yenilen her boss 2, her Usta Mührü 3 parça;
 * kazanç iki karakter için de tamdır, harcama karakterin kendi dolabından düşer. Fiyatlar, bütün oyunun parçasıyla
 * her karakterin dolabının tamamı alınacak biçimde ayarlıdır.
 * Çizimi heroDraw.ts (oyun) ve portraitDraw.ts (portre); föyü `node scripts/art/accessories.cjs`.
 *
 * Yer: başa takılanlar kılığın kendi şapkasının (kasket, kalfa, kalpak) yerine geçer; yazma örtüdür, kalır ve
 * başlık onun üstüne oturur. Gözlükler yüzde, sırttakiler gövdenin arkasında durur.
 */
export type AccessoryId =
  | 'yok'
  // ortak
  | 'bere'
  | 'hasir'
  | 'kulaklik'
  | 'fes'
  | 'defne'
  | 'gozluk'
  | 'gunes'
  | 'kayak'
  | 'heybe'
  | 'saz'
  | 'pelerin'
  // Uktun'a özgü
  | 'papatya'
  | 'lale'
  | 'kelebek'
  | 'fiyonk'
  | 'tac'
  | 'kedi'
  | 'kalpli'
  | 'pul'
  | 'ayi'
  | 'sal'
  | 'sepet'
  // Memo'ya özgü
  | 'bandana'
  | 'kovboy'
  | 'asci'
  | 'pilot'
  | 'tek'
  | 'bant'
  | 'sirtcanta'
  | 'okluk'
  | 'kalkan'

/** kombini ayrı ayrı kurulan iki yolcu */
export type Hero = 'uktun' | 'memo'
export const HEROES: readonly Hero[] = ['uktun', 'memo']

export type Slot = 'head' | 'face' | 'back'

export const SLOTS: { id: Slot; name: string; nameEn: string }[] = [
  { id: 'head', name: 'Baş', nameEn: 'Head' },
  { id: 'face', name: 'Yüz', nameEn: 'Face' },
  { id: 'back', name: 'Sırt', nameEn: 'Back' },
]

export interface Accessory {
  id: AccessoryId
  slot: Slot
  name: string
  nameEn: string
  price: number
  /** yalnız bu yolcunun dükkânında görünür ve yalnız ona alınır; yoksa ortak: iki yolcuya ayrı ayrı alınır */
  for?: Hero
  /** parayla alınmaz, bu kadar Usta Mührü kazanılınca kendiliğinden açılır */
  seals?: number
}

/**
 * Yuvaya göre ve her yuvada ucuzdan pahalıya; "Yok" her yuvanın ilk seçeneğidir (dükkânda yuva başına gösterilir).
 * Fiyatlar yolcu başınadır: her yolcunun dolabı (ortak + kendine özgü parçalar) bütün oyunun parçasıyla alınabilir.
 */
export const ACCESSORIES: Accessory[] = [
  // baş
  { id: 'papatya', slot: 'head', name: 'Papatya Tacı', nameEn: 'Daisy Crown', price: 10, for: 'uktun' },
  { id: 'lale', slot: 'head', name: 'Lale Tokası', nameEn: 'Tulip Clip', price: 10, for: 'uktun' },
  { id: 'kelebek', slot: 'head', name: 'Kelebek Tokası', nameEn: 'Butterfly Clip', price: 14, for: 'uktun' },
  { id: 'fiyonk', slot: 'head', name: 'Puantiyeli Fiyonk', nameEn: 'Polka-Dot Bow', price: 14, for: 'uktun' },
  { id: 'tac', slot: 'head', name: 'Altın Taç', nameEn: 'Golden Tiara', price: 22, for: 'uktun' },
  { id: 'bandana', slot: 'head', name: 'Kırmızı Bandana', nameEn: 'Red Bandana', price: 14, for: 'memo' },
  { id: 'asci', slot: 'head', name: 'Aşçı Başlığı', nameEn: 'Chef Hat', price: 18, for: 'memo' },
  { id: 'kovboy', slot: 'head', name: 'Kovboy Şapkası', nameEn: 'Cowboy Hat', price: 24, for: 'memo' },
  { id: 'bere', slot: 'head', name: 'Ponponlu Bere', nameEn: 'Bobble Hat', price: 16 },
  { id: 'kulaklik', slot: 'head', name: 'Kulaklık', nameEn: 'Headphones', price: 16 },
  { id: 'hasir', slot: 'head', name: 'Hasır Şapka', nameEn: 'Straw Hat', price: 18 },
  { id: 'fes', slot: 'head', name: 'Fes', nameEn: 'Fez', price: 28 },
  { id: 'defne', slot: 'head', name: 'Altın Defne Tacı', nameEn: 'Golden Laurel', price: 0, seals: 10 },
  // yüz
  { id: 'pul', slot: 'face', name: 'Yıldız Yüz Pulu', nameEn: 'Star Face Sticker', price: 8, for: 'uktun' },
  { id: 'kedi', slot: 'face', name: 'Kedi Gözlüğü', nameEn: 'Cat-Eye Glasses', price: 14, for: 'uktun' },
  { id: 'kalpli', slot: 'face', name: 'Kalpli Gözlük', nameEn: 'Heart Sunglasses', price: 16, for: 'uktun' },
  { id: 'bant', slot: 'face', name: 'Korsan Göz Bandı', nameEn: 'Eye Patch', price: 14, for: 'memo' },
  { id: 'tek', slot: 'face', name: 'Tek Gözlük', nameEn: 'Monocle', price: 16, for: 'memo' },
  { id: 'pilot', slot: 'face', name: 'Pilot Gözlüğü', nameEn: 'Aviator Shades', price: 18, for: 'memo' },
  { id: 'gozluk', slot: 'face', name: 'Yuvarlak Gözlük', nameEn: 'Round Glasses', price: 12 },
  { id: 'gunes', slot: 'face', name: 'Güneş Gözlüğü', nameEn: 'Sunglasses', price: 14 },
  { id: 'kayak', slot: 'face', name: 'Kayak Gözlüğü', nameEn: 'Ski Goggles', price: 16 },
  // sırt
  { id: 'sepet', slot: 'back', name: 'Çiçek Sepeti', nameEn: 'Flower Basket', price: 20, for: 'uktun' },
  { id: 'sal', slot: 'back', name: 'Kilim Şal', nameEn: 'Kilim Shawl', price: 20, for: 'uktun' },
  { id: 'ayi', slot: 'back', name: 'Ayıcık Çanta', nameEn: 'Teddy Backpack', price: 22, for: 'uktun' },
  { id: 'okluk', slot: 'back', name: 'Okluk', nameEn: 'Quiver', price: 18, for: 'memo' },
  { id: 'kalkan', slot: 'back', name: 'Yuvarlak Kalkan', nameEn: 'Round Shield', price: 22, for: 'memo' },
  { id: 'sirtcanta', slot: 'back', name: 'Sırt Çantası', nameEn: 'Backpack', price: 24, for: 'memo' },
  { id: 'heybe', slot: 'back', name: 'Kilim Heybe', nameEn: 'Kilim Saddlebag', price: 22 },
  { id: 'saz', slot: 'back', name: 'Sırtta Bağlama', nameEn: 'Bağlama on the Back', price: 22 },
  { id: 'pelerin', slot: 'back', name: 'Pelerin', nameEn: 'Cape', price: 26 },
]

/** yolcunun dükkânında görünen parçalar: ortaklar ve kendine özgüler */
export const forHero = (hero: Hero) => ACCESSORIES.filter((a) => !a.for || a.for === hero)

/** bir yolcunun oyundaki görünümü: atkı (null: kendi atkısı) ve kombin */
export interface HeroLook {
  scarf: { color: string; shade: string } | null
  kit: Kit
}

/** üç yuvanın her birinde takılı parça ('yok': boş) */
export interface Kit {
  head: AccessoryId
  face: AccessoryId
  back: AccessoryId
}

export const NO_KIT: Kit = { head: 'yok', face: 'yok', back: 'yok' }

/** başı örten başlıklar: altında saç kısa kesim gibi görünür (uzun ve kıvırcık saç kendi hâlinde kalır) */
export const COVERS_HEAD: ReadonlySet<AccessoryId> = new Set(['fes', 'bere', 'hasir', 'bandana', 'kovboy', 'asci'])

/** başa takılan her şey (taç, toka, kulaklık dahil): kılığın şapkasının yerine geçer */
export const ON_HEAD: ReadonlySet<AccessoryId> = new Set(ACCESSORIES.filter((a) => a.slot === 'head').map((a) => a.id))

const inSlot = (hero: Hero, slot: Slot, id: unknown): AccessoryId => (forHero(hero).some((a) => a.slot === slot && a.id === id) ? (id as AccessoryId) : 'yok')

/**
 * Yolcunun kayıttaki kombini: yeni kayıtta `kits[hero]`, eskisinde ortak `kit` ya da tek `accessory` (o, kendi yuvasına
 * yerleşir). Bilinmeyen, yanlış yuvadaki ya da başka yolcuya özgü kimlik boş sayılır.
 */
export function kitFor(hero: Hero, kit: Partial<Record<Slot, string>> | undefined, legacy?: string): Kit {
  if (kit) return { head: inSlot(hero, 'head', kit.head), face: inSlot(hero, 'face', kit.face), back: inSlot(hero, 'back', kit.back) }
  const old = forHero(hero).find((a) => a.id === legacy)
  return old ? { ...NO_KIT, [old.slot]: old.id } : NO_KIT
}

/** kombinin portre ve önbellek anahtarı */
export const kitKey = (k: Kit) => `${k.head}.${k.face}.${k.back}`

/** Kazanılan parça: hatıra + pul + nazar (1), yenilen boss (2), Usta Mührü (3) */
export const earned = (found: number, bosses: number, seals: number) => found + bosses * 2 + seals * 3

/** `owned` anahtarı: parça yolcuya özgü alınır ("uktun:fiyonk"); öncesinde alınanlar düz kimlikle durur ve iki yolcuya da açıktır */
export const ownedKey = (hero: Hero, id: AccessoryId) => `${hero}:${id}`
export const hasAccessory = (owned: Record<string, boolean> | undefined, hero: Hero, id: AccessoryId) => !!owned?.[ownedKey(hero, id)] || !!owned?.[id]

/** yolcunun cüzdanı: kazanılan parça eksi o yolcunun dolabında alınanların fiyatı (hiç eksiye düşmez); kazanç iki yolcuya da tamdır */
export const walletOf = (earnedTotal: number, owned: Record<string, boolean> | undefined, hero: Hero) =>
  Math.max(0, earnedTotal - forHero(hero).reduce((a, x) => a + (hasAccessory(owned, hero, x.id) ? x.price : 0), 0))
