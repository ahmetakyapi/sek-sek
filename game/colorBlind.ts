/**
 * Renk körü paleti (Kolaylıklar, cihaz ayarı): yalnız çizim, fizik değişmez. Süzgeç ya da tam ekran katman yok:
 * kritik renkler (tehlike, bloklar, plaka, nefes ve süre uyarıları) çizim anında güvenli bir paletle değişir.
 * Mod kapalıyken `cbc` tek karşılaştırmadır. Palet Okabe-Ito tabanlıdır; renk ikinci işaretle desteklenir
 * (blokta daire/üçgen, öldüren suda çizgili yüzey, dikende beyaz uç, düşmanda kalın hale).
 */

export type CbMode = 'yok' | 'kirmizi-yesil' | 'mavi-sari'
export const CB_MODES: CbMode[] = ['yok', 'kirmizi-yesil', 'mavi-sari']

/** çizim yollarının okuduğu tek durum (cihaz ayarı: Game.tsx yazar) */
export const cb: { mode: CbMode } = { mode: 'yok' }

/** kırmızı-yeşil körlüğünde tehlike turuncu, "güvenli" mavi; bloklar beyaz ↔ koyu mavi (yeterli ışık farkı) */
const KR: Record<string, string> = {
  '#e5484d': '#ff9f1c',
  '#ff3b3b': '#ff9f1c',
  '#ff4a3a': '#ff9f1c',
  '#e5534b': '#ff9f1c',
  '#ff5a4a': '#c25a00',
  '#ff5f52': '#ff9f1c',
  '#ff9a4a': '#ffd23f',
  '#e8a33d': '#ffd23f',
  '#ff8a7c': '#ffc15a',
  '#ffb0a4': '#ffd9a0',
  '#ffd4cc': '#ffecc8',
  // "güvenli" yeşil (HUD tamam, doğru) mavi olur
  '#3fb950': '#56b4e9',
  // renkli bloklar ve plaka
  '#e8794a': '#f2efe4',
  '#c8582a': '#a9a48f',
  '#4aa8e0': '#0072b2',
  '#2a7ab0': '#003f6b',
  // dikenin açık ve koyu yüzü
  '#spikeLight': '#ffc15a',
  '#spikeDark': '#a85a00',
}

/** mavi-sarı körlüğünde mavi ile yeşil, sarı ile pembe karışır: bloklar vermilyon ↔ camgöbeği-yeşil, tehlike parlak kırmızı */
const MS: Record<string, string> = {
  '#e5484d': '#ff2b3a',
  '#e8794a': '#d55e00',
  '#c8582a': '#7a3300',
  '#4aa8e0': '#00d6a0',
  '#2a7ab0': '#006a52',
  '#spikeLight': '#ff6a70',
  '#spikeDark': '#8f0f18',
}

const TABLE: Record<CbMode, Record<string, string>> = { yok: {}, 'kirmizi-yesil': KR, 'mavi-sari': MS }

/** belirli bir kipte eşleme (arayüz önizlemesi ve test); tanımsız renk aynen döner */
export function cbFor(hex: string, mode: CbMode): string {
  return TABLE[mode][hex] ?? hex
}

/** çizim yolunda: mod kapalıyken sıfır maliyet */
export function cbc(hex: string): string {
  return cb.mode === 'yok' ? hex : (TABLE[cb.mode][hex] ?? hex)
}

/** dikenin [açık, koyu] yüzü: kapalıyken şehrin kendi rengi */
export function cbSpike(col: [string, string]): [string, string] {
  return cb.mode === 'yok' ? col : [TABLE[cb.mode]['#spikeLight'], TABLE[cb.mode]['#spikeDark']]
}

/** düşman halesi (rgba) ve kalınlık çarpanı: mod açıkken daha parlak ve kalın */
export function cbHalo(base: string): string {
  if (cb.mode === 'yok') return base
  return cb.mode === 'kirmizi-yesil' ? 'rgba(255,159,28,0.95)' : 'rgba(255,43,58,0.95)'
}
export const cbHaloScale = () => (cb.mode === 'yok' ? 1 : 1.7)

// ── Simülasyon (Machado 2009, şiddet 1.0, doğrusal RGB): test ve önizleme için ──

export type CvdKind = 'protan' | 'deutan' | 'tritan'
const MATRIX: Record<CvdKind, number[][]> = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
}

const toLin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const parse = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1, 7), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/** doğrusal RGB (0-1) → CIE Lab (D65) */
function lab(r: number, g: number, b: number): [number, number, number] {
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/** rengin bu körlükte nasıl göründüğü: Lab (kind verilmezse normal görüş) */
export function labSeen(hex: string, kind?: CvdKind): [number, number, number] {
  let [r, g, b] = parse(hex).map(toLin) as [number, number, number]
  if (kind) {
    const m = MATRIX[kind]
    ;[r, g, b] = [clamp01(m[0][0] * r + m[0][1] * g + m[0][2] * b), clamp01(m[1][0] * r + m[1][1] * g + m[1][2] * b), clamp01(m[2][0] * r + m[2][1] * g + m[2][2] * b)]
  }
  return lab(r, g, b)
}

/** iki rengin bu körlükte ayırt edilebilirliği: CIE76 ΔE (≈ 2,3 fark edilir eşik; 20+ rahat ayrılır) */
export function deltaE(a: string, b: string, kind?: CvdKind): number {
  const p = labSeen(a, kind)
  const q = labSeen(b, kind)
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
}

/** kipin körlük türleri */
export const MODE_KINDS: Record<CbMode, CvdKind[]> = { yok: [], 'kirmizi-yesil': ['protan', 'deutan'], 'mavi-sari': ['tritan'] }
