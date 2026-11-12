/**
 * Kamera: DOM'suz, saf hesap (render.ts kullanır, tests/camera.test.ts kanıtlar).
 *
 * Kural: kameranın ekrandaki her hareketi saate bağlıdır, kareye değil. 60, 120, 144 ya da 240 Hz'de aynı
 * saniyede aynı yere varır; sarsıntı her karede rastgele sayı çekmez (yüksek Hz'de titreme olur), zamanla
 * dalgalanır. Yeni kamera davranışı eklerken bu dosyaya ekle ve testi genişlet.
 */
import { ONEWAY, PHYS, WATER, type World } from './sim'
import { T } from './types'

export const CAM = {
  /** her saniye hedefe kalan mesafenin bu kadarı kalır (üstel yaklaşım: kare hızından bağımsız) */
  follow: 0.0015,
  /** dikeyde biraz daha yavaş */
  followY: 0.0015 ** 0.8,
  /** boss dövüşünde bir tık yumuşak */
  boss: 0.006,
  bossY: 0.006 ** 0.8,
  /** koşu yönüne bakış payı */
  lead: 28,
  /** hıza göre bakış payı; dash hızı sayılmaz, yoksa kamera dash'te ileri fırlayıp geri teper */
  leadVel: 0.15,
} as const

/** Üstel yaklaşım: kaç karede çağrılırsa çağrılsın aynı sürede aynı yere varır. */
export function approach(cur: number, target: number, dt: number, keep: number) {
  return cur + (target - cur) * (1 - Math.pow(keep, dt))
}

/** Sarsıntı ötelemesi: zamana bağlı yumuşak dalga (dünya pikseli). Kare hızı değişse de aynı görünür. */
export function shakeOffset(t: number, amp: number): [number, number] {
  if (amp <= 0) return [0, 0]
  const x = Math.sin(t * 83) * 0.6 + Math.sin(t * 131 + 1.7) * 0.4
  const y = Math.sin(t * 97 + 0.6) * 0.6 + Math.sin(t * 149 + 2.9) * 0.4
  return [x * amp * 0.5, y * amp * 0.5]
}

/**
 * Aşağı bakış (dünya pikseli): karakterin baktığı yönde birkaç karo içinde bir düşüş varsa, ineceği yer görünsün diye
 * kadraj aşağı kayar; düşerken de aşağıya bakılır. Yüksek bir duvarın üstünde oyuncu boşluğa kör atlamaz.
 */
export function lookDown(w: World, vh: number): number {
  const p = w.player
  const feet = Math.floor((p.y + p.h + 1) / T)
  const cx = Math.floor((p.x + p.w / 2) / T)
  let drop = 0
  // yalnız kenara yaklaşınca: uzaktaki her çukur kadrajı oynatmasın
  for (let d = 1; d <= 3; d++) {
    const tx = cx + p.facing * d
    let ty = feet
    // ilk basılacak yer (zemin, tahta ya da su: tehlike de görünmeli)
    while (ty < w.rows && !w.isSolid(tx, ty) && w.tile(tx, ty) !== ONEWAY && w.tile(tx, ty) !== WATER) ty++
    drop = Math.max(drop, (ty - feet) * T)
  }
  const ahead = drop > 3 * T ? drop * 0.6 : 0
  const falling = p.vy > 0 && !p.grounded ? p.vy * 0.12 : 0
  return Math.min(vh * 0.25, Math.max(ahead, falling))
}

/**
 * Normal takip: karakter ekranın ortasında, koşu yönünde biraz önde; önünde düşüş varsa biraz aşağıda.
 * Dikeyde kamera her zıplamada sallanmaz: yerde ya da duvarda iken basılan yüksekliğe (feet) bakar, havadayken
 * o yükseklikte kalır. Karakter ekranın üst ya da alt bandına yaklaşırsa yine izler (yüksek tırmanış, uzun düşüş).
 */
export function followTarget(w: World, vw: number, vh: number, cam?: { feet?: number }): [number, number] {
  const p = w.player
  const cap = PHYS.run * 1.15
  const vx = Math.max(-cap, Math.min(cap, p.vx))
  const feet = p.y + p.h
  const onGround = p.grounded || p.wallDir !== 0 || p.dead
  if (cam && (onGround || cam.feet === undefined)) cam.feet = feet
  const anchor = cam?.feet ?? feet
  let ty = anchor - p.h / 2 - vh * 0.55 + lookDown(w, vh)
  // karakter ekranın %22'si ile %72'si arasında kalsın
  const pc = p.y + p.h / 2
  ty = Math.max(pc - vh * 0.72, Math.min(pc - vh * 0.22, ty))
  return [p.x + p.w / 2 - vw / 2 + p.facing * CAM.lead + vx * CAM.leadVel, ty]
}

/**
 * Boss dövüşünde kamera karakterle boss'un arasına bakar ve ikisiyle birlikte kayar: karakter yürüdükçe kadraj
 * akar, ikisi de ekranda kalır. Ekrana sığmayacak kadar uzaklaşırlarsa boss kenarda tutulur, kadraj karaktere
 * doğru yaslanır. Yerin altındaki boss'un yerine çıkacağı yer, havadaki boss'la zemin birlikte kadrajda durur.
 */
export function bossFrame(w: World, vw: number, vh: number): [number, number] | null {
  const b = w.boss
  if (!b || b.state === 'sleep' || b.state === 'down' || w.player.dead) return null
  const p = w.player
  const pcx = p.x + p.w / 2
  const bcx = b.hidden ? b.tx : b.x + b.w / 2
  const m = Math.min(40, vw * 0.14)
  const cap = PHYS.run * 1.15
  // ortanın biraz karakter tarafı: koşunun gittiği yer de görünsün
  let tx = (pcx + bcx) / 2 + Math.max(-cap, Math.min(cap, p.vx)) * 0.06 - vw / 2
  if (Math.abs(pcx - bcx) + m * 2 <= vw) tx = Math.max(Math.max(pcx, bcx) + m - vw, Math.min(Math.min(pcx, bcx) - m, tx))
  else tx = bcx < pcx ? bcx - m : bcx + m - vw
  // arenanın dışına fazla taşmasın (duvarlar görünür kalır); arena ekrandan darsa ortalanır
  const pad = 40
  const lo = b.min - pad
  const hi = b.max + b.w + pad - vw
  tx = lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, tx))
  // dikeyde zemin sabit durur; karakter ya da boss yükselince kadraj da yükselir
  const top = Math.min(p.y, b.hidden ? b.floor : b.y)
  return [tx, Math.min(b.floor - vh * 0.66, top - 30)]
}

/** Dikey ekranda bölümün altı ekranın ~%66'sında kalır: alt kısım dokunmatik kontrollere ayrılır. */
export function camYRange(lh: number, vw: number, vh: number): [number, number] {
  const portrait = vh > vw * 1.25
  const hi = portrait ? lh - vh * 0.66 : lh - vh
  const lo = Math.min(0, lh - vh, hi)
  return [lo, Math.max(lo, hi)]
}

/** Kamerayı bölüm sınırına çeker. */
export function clampCam(w: World, x: number, y: number, vw: number, vh: number): [number, number] {
  const [lo, hi] = camYRange(w.rows * T, vw, vh)
  return [Math.max(0, Math.min(w.cols * T - vw, x)), Math.max(lo, Math.min(hi, y))]
}

/** Bir karelik kamera adımı: hedefi seçer, saate bağlı yaklaşır, sınıra çeker. */
export function stepCamera(w: World, cam: { x: number; y: number; feet?: number }, dt: number, vw: number, vh: number) {
  const boss = bossFrame(w, vw, vh)
  const [tx, ty] = boss ?? followTarget(w, vw, vh, cam)
  const x = approach(cam.x, tx, dt, boss ? CAM.boss : CAM.follow)
  const y = approach(cam.y, ty, dt, boss ? CAM.bossY : CAM.followY)
  ;[cam.x, cam.y] = clampCam(w, x, y, vw, vh)
}
