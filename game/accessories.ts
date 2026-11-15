/**
 * Kılık Dükkânı'nın takılabilir aksesuarları: oyuncunun karakterine (Uktun ya da Memo) tek bir aksesuar takılır.
 * Fiyat, yolda bulunan parça sayısıyla ödenir (hatıra + pul + nazar). Çizimi heroDraw.ts (oyun) ve portraitDraw.ts (portre).
 *
 * Yer: başa takılanlar kılığın kendi şapkasının (kasket, kalfa, kalpak) yerine geçer; yazma örtüdür, kalır ve
 * başlık onun üstüne oturur. Gözlük yüzde, heybe sırtta durur.
 */
export type AccessoryId = 'yok' | 'papatya' | 'gozluk' | 'bere' | 'hasir' | 'heybe' | 'fes' | 'defne'

/** `seals`: parayla alınmaz, bu kadar Usta Mührü kazanılınca kendiliğinden açılır */
export const ACCESSORIES: { id: AccessoryId; name: string; nameEn: string; price: number; seals?: number }[] = [
  { id: 'yok', name: 'Yok', nameEn: 'None', price: 0 },
  { id: 'papatya', name: 'Papatya Tacı', nameEn: 'Daisy Crown', price: 15 },
  { id: 'gozluk', name: 'Yuvarlak Gözlük', nameEn: 'Round Glasses', price: 20 },
  { id: 'bere', name: 'Ponponlu Bere', nameEn: 'Bobble Hat', price: 30 },
  { id: 'hasir', name: 'Hasır Şapka', nameEn: 'Straw Hat', price: 35 },
  { id: 'heybe', name: 'Kilim Heybe', nameEn: 'Kilim Saddlebag', price: 45 },
  { id: 'fes', name: 'Fes', nameEn: 'Fez', price: 60 },
  { id: 'defne', name: 'Altın Defne Tacı', nameEn: 'Golden Laurel', price: 0, seals: 10 },
]

/** başı örten başlıklar: altında saç kısa kesim gibi görünür (uzun ve kıvırcık saç kendi hâlinde kalır) */
export const COVERS_HEAD: ReadonlySet<AccessoryId> = new Set(['fes', 'bere', 'hasir'])

/** başa takılan her şey (taç dahil): kılığın şapkasının yerine geçer */
export const ON_HEAD: ReadonlySet<AccessoryId> = new Set(['fes', 'bere', 'hasir', 'papatya', 'defne'])

export const accessoryFor = (id: string | undefined): AccessoryId => (ACCESSORIES.some((a) => a.id === id) ? (id as AccessoryId) : 'yok')
/** cüzdan: bulunan parçalar eksi alınanların fiyatı (hiç eksiye düşmez) */
export const walletOf = (found: number, owned: Record<string, boolean> | undefined) => Math.max(0, found - ACCESSORIES.reduce((a, x) => a + (owned?.[x.id] ? x.price : 0), 0))
