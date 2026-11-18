/**
 * Kılık Dükkânı: karaktere (Uktun ya da Memo) üç yuvada birer parça takılır: baş, yüz ve sırt (kombin).
 * Para birimi "parça"dır (`walletOf`): yolda bulunan her hatıra, gizli pul ve nazar boncuğu 1, yenilen her boss 2,
 * her Usta Mührü 3 parça. Fiyatlar oyunun bütün parçası toplanınca dükkânın tamamı alınacak biçimde ayarlıdır.
 * Çizimi heroDraw.ts (oyun) ve portraitDraw.ts (portre); föyü `node scripts/art/accessories.cjs`.
 *
 * Yer: başa takılanlar kılığın kendi şapkasının (kasket, kalfa, kalpak) yerine geçer; yazma örtüdür, kalır ve
 * başlık onun üstüne oturur. Gözlükler yüzde, sırttakiler gövdenin arkasında durur.
 */
export type AccessoryId =
  | 'yok'
  | 'papatya'
  | 'lale'
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
  /** parayla alınmaz, bu kadar Usta Mührü kazanılınca kendiliğinden açılır */
  seals?: number
}

/** Yuvaya göre ve her yuvada ucuzdan pahalıya; "Yok" her yuvanın ilk seçeneğidir (dükkânda yuva başına gösterilir) */
export const ACCESSORIES: Accessory[] = [
  { id: 'papatya', slot: 'head', name: 'Papatya Tacı', nameEn: 'Daisy Crown', price: 15 },
  { id: 'lale', slot: 'head', name: 'Lale Tokası', nameEn: 'Tulip Clip', price: 15 },
  { id: 'bere', slot: 'head', name: 'Ponponlu Bere', nameEn: 'Bobble Hat', price: 30 },
  { id: 'kulaklik', slot: 'head', name: 'Kulaklık', nameEn: 'Headphones', price: 30 },
  { id: 'hasir', slot: 'head', name: 'Hasır Şapka', nameEn: 'Straw Hat', price: 35 },
  { id: 'fes', slot: 'head', name: 'Fes', nameEn: 'Fez', price: 60 },
  { id: 'defne', slot: 'head', name: 'Altın Defne Tacı', nameEn: 'Golden Laurel', price: 0, seals: 10 },
  { id: 'gozluk', slot: 'face', name: 'Yuvarlak Gözlük', nameEn: 'Round Glasses', price: 20 },
  { id: 'gunes', slot: 'face', name: 'Güneş Gözlüğü', nameEn: 'Sunglasses', price: 25 },
  { id: 'kayak', slot: 'face', name: 'Kayak Gözlüğü', nameEn: 'Ski Goggles', price: 30 },
  { id: 'heybe', slot: 'back', name: 'Kilim Heybe', nameEn: 'Kilim Saddlebag', price: 45 },
  { id: 'saz', slot: 'back', name: 'Sırtta Bağlama', nameEn: 'Bağlama on the Back', price: 45 },
  { id: 'pelerin', slot: 'back', name: 'Pelerin', nameEn: 'Cape', price: 50 },
]

/** üç yuvanın her birinde takılı parça ('yok': boş) */
export interface Kit {
  head: AccessoryId
  face: AccessoryId
  back: AccessoryId
}

export const NO_KIT: Kit = { head: 'yok', face: 'yok', back: 'yok' }

/** başı örten başlıklar: altında saç kısa kesim gibi görünür (uzun ve kıvırcık saç kendi hâlinde kalır) */
export const COVERS_HEAD: ReadonlySet<AccessoryId> = new Set(['fes', 'bere', 'hasir'])

/** başa takılan her şey (taç, toka, kulaklık dahil): kılığın şapkasının yerine geçer */
export const ON_HEAD: ReadonlySet<AccessoryId> = new Set(ACCESSORIES.filter((a) => a.slot === 'head').map((a) => a.id))

const inSlot = (slot: Slot, id: unknown): AccessoryId => (ACCESSORIES.some((a) => a.slot === slot && a.id === id) ? (id as AccessoryId) : 'yok')

/**
 * Kayıttaki kombin: yeni kayıtta `kit`, eskisinde tek `accessory` (o, kendi yuvasına yerleşir). Bilinmeyen ya da
 * yanlış yuvadaki kimlik boş sayılır.
 */
export function kitFor(kit: Partial<Record<Slot, string>> | undefined, legacy?: string): Kit {
  if (kit) return { head: inSlot('head', kit.head), face: inSlot('face', kit.face), back: inSlot('back', kit.back) }
  const old = ACCESSORIES.find((a) => a.id === legacy)
  return old ? { ...NO_KIT, [old.slot]: old.id } : NO_KIT
}

/** kombinin portre ve önbellek anahtarı */
export const kitKey = (k: Kit) => `${k.head}.${k.face}.${k.back}`

/** Kazanılan parça: hatıra + pul + nazar (1), yenilen boss (2), Usta Mührü (3) */
export const earned = (found: number, bosses: number, seals: number) => found + bosses * 2 + seals * 3

/** cüzdan: kazanılan parça eksi alınanların fiyatı (hiç eksiye düşmez) */
export const walletOf = (earnedTotal: number, owned: Record<string, boolean> | undefined) =>
  Math.max(0, earnedTotal - ACCESSORIES.reduce((a, x) => a + (owned?.[x.id] ? x.price : 0), 0))
