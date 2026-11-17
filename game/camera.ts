/**
 * Kamera: DOM'suz, saf hesap (render.ts kullanır, tests/camera.test.ts kanıtlar).
 *
 * Kural: kameranın ekrandaki her hareketi saate bağlıdır, kareye değil. 60, 120, 144 ya da 240 Hz'de aynı
 * saniyede aynı yere varır; sarsıntı her karede rastgele sayı çekmez (yüksek Hz'de titreme olur), zamanla
 * dalgalanır. Yeni kamera davranışı eklerken bu dosyaya ekle ve testi genişlet.
 */
import { NITRO, ONEWAY, PHYS, SPIKE_UP, SWIM, WATER, type World } from './sim'
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
  /** bakış payı ekranın en çok bu oranı: dar (telefon) ekranda dönüşte kadraj savrulmasın */
  leadMax: 0.07,
  /** bakış payı dönüşte yavaşça kayar (sn başına kalan oran): joystick titrese de kamera savrulmaz */
  leadKeep: 0.06,
  /** aşağı bakış da yumuşakça açılır ve kapanır */
  lookKeep: 0.08,
  /** ölü bölge: karakter kadrajın ortasındaki bu genişlikte (ekran oranı) kaldıkça kamera kımıldamaz */
  window: 0.035,
  /**
   * Dash sırasında yatay takip üç kat hızlı. Kameranın gecikmesi hızla orantılıdır (hız / takip oranı): dash hızı
   * yürüyüşün ~3 katı olduğundan gecikme aynı kalır, karakter ekranda yerinde durur. Eskiden dash'te ~15 px öne
   * kayıyor, kamera yetişince geri çekiliyordu (ekran gidip geliyor gibiydi). Oran geçişte kamera hızı da sürekli kalır.
   */
  dashFollow: 0.0015 ** 3,
  /** dash itmesi: kadraj dash yönünün tersine bu kadar (dünya pikseli) yaslanıp yumuşakça döner; rastgele titreme yok */
  kick: 1.6,
  kickTime: 0.22,
  /** önünde engel (çukur, diken, su) varken bakış payı bu oranla büyür: atlanacak yer kadrajda */
  hazardLead: 0.6,
  /** engel aranan uzaklık (karo, baktığı yönde) */
  hazardScan: 7,
  /** tırmanırken (halat, duvar, yükseliş) kadraj ekranın bu oranı kadar yukarı açılır */
  climbUp: 0.17,
} as const

/** Kameranın kare arası durumu: konum ve yumuşatılmış takip payları */
export interface CamState {
  x: number
  y: number
  /** havadayken sabit kalan basılan yükseklik */
  feet?: number
  /** yumuşatılmış bakış payı (dünya pikseli) */
  lead?: number
  /** yumuşatılmış aşağı bakış (dünya pikseli) */
  look?: number
  /** ölü bölgenin çapası: karakter ortası bu noktadan pencere kadar uzaklaşınca çapa onu izler */
  anchor?: number
}

/** Üstel yaklaşım: kaç karede çağrılırsa çağrılsın aynı sürede aynı yere varır. */
export function approach(cur: number, target: number, dt: number, keep: number) {
  return cur + (target - cur) * (1 - Math.pow(keep, dt))
}

/**
 * Sarsıntı ötelemesi: zamana bağlı yumuşak dalga (dünya pikseli). Kare hızı değişse de aynı görünür.
 * Dalga 7-13 Hz'de (eskiden 13-24 Hz: göz yoran vızıltı). Küçük sarsıntılar karesiyle küçülür (2'nin altı belli belirsiz),
 * büyükler (ölüm, boss) aynı güçte kalır: her düğmede, her inişte ekran titremez.
 */
export function shakeOffset(t: number, amp: number): [number, number] {
  if (amp <= 0) return [0, 0]
  const a = amp * Math.min(1, amp / 3) * 0.5
  const x = Math.sin(t * 47) * 0.6 + Math.sin(t * 73 + 1.7) * 0.4
  const y = Math.sin(t * 53 + 0.6) * 0.6 + Math.sin(t * 79 + 2.9) * 0.4
  return [x * a, y * a]
}

/**
 * Dash itmesi: kalkıştan bu yana geçen süreye (sn) göre kadrajın dash yönünün tersine yaslanma oranı (0..1).
 * Hızlı yükselir, yavaşça (ease-out) sıfıra döner; tek bir yumuşak tümsek, salınım yok.
 */
export function kickOffset(age: number): number {
  if (age < 0 || age >= CAM.kickTime) return 0
  const u = age / CAM.kickTime
  return Math.min(1, u * 6) * (1 - u) * (1 - u)
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
    while (ty < w.rows && !w.isSolid(tx, ty) && w.tile(tx, ty) !== ONEWAY && w.tile(tx, ty) !== WATER && w.tile(tx, ty) !== SWIM) ty++
    drop = Math.max(drop, (ty - feet) * T)
  }
  const ahead = drop > 3 * T ? drop * 0.6 : 0
  const falling = p.vy > 0 && !p.grounded ? p.vy * 0.12 : 0
  return Math.min(vh * 0.25, Math.max(ahead, falling))
}

/**
 * Önündeki engel (0..1): baktığı yönde birkaç karo içinde ayak hizasında çukur, diken ya da öldüren su varsa 1'e yaklaşır
 * (yakın olan daha ağır basar). Kadraj atlanacak yeri önceden gösterir; saf hesap, yalnız haritaya ve konuma bağlı.
 */
export function hazardAhead(w: World): number {
  const p = w.player
  const feet = Math.floor((p.y + p.h + 1) / T)
  const cx = Math.floor((p.x + p.w / 2) / T)
  for (let d = 2; d <= CAM.hazardScan; d++) {
    const tx = cx + p.facing * d
    const t = w.tile(tx, feet)
    const hole = !w.isSolid(tx, feet) && t !== ONEWAY && !w.isSolid(tx, feet + 1) && !w.isSolid(tx, feet + 2)
    if (t === SPIKE_UP || t === WATER || w.tile(tx, feet - 1) === SPIKE_UP || hole) return 1 - (d - 2) / (CAM.hazardScan - 1)
  }
  return 0
}

/**
 * İniş tahmini (dünya pikseli, ayakların ineceği y) : havadayken karakterin yolu (yatay hız sabit, yerçekimi, düşüş
 * sınırı) adım adım izlenir; ilk değeceği zemin, tahta ya da su bulunur. Altında hiçbir şey yoksa (çukur) bölümün dibi.
 * Kamera bununla karakterle ineceği yeri birlikte kadraja alır: boşluğa kör atlanmaz.
 */
export function landingY(w: World): number | null {
  const p = w.player
  if (p.grounded || p.dead || p.hang || p.swim || p.wallDir !== 0) return null
  let x = p.x + p.w / 2
  let y = p.y + p.h
  let vy = p.vy
  const vx = Math.max(-PHYS.run * 1.6, Math.min(PHYS.run * 1.6, p.vx))
  const dt = 1 / 30
  for (let i = 0; i < 75; i++) {
    vy = Math.min(PHYS.fallMax, vy + PHYS.gravity * dt)
    const ny = y + vy * dt
    x += vx * dt
    if (vy > 0) {
      // bu adımda geçilen satırlar: ilk dolu yüzey
      for (let ty = Math.floor(y / T); ty <= Math.floor(ny / T); ty++) {
        const tx = Math.floor(x / T)
        if (ty >= w.rows) return w.rows * T
        const t = w.tile(tx, ty)
        if (w.isSolid(tx, ty) || t === ONEWAY || t === WATER || t === SWIM) return ty * T
      }
    }
    y = ny
    if (y >= w.rows * T) return w.rows * T
  }
  return null
}

/** Tırmanıyor mu: halatta asılı, duvara tutunmuş ya da hızla yükseliyor (yukarıdaki yol görünsün) */
export function climbing(w: World): boolean {
  const p = w.player
  // duvarda aşağı kayarken yukarı bakmaz: yalnız tutunup dururken ya da yükselirken
  return !p.dead && (p.hang === 1 || (p.wallDir !== 0 && p.vy < 40) || (!p.grounded && p.vy < -PHYS.jumpV * 0.6 && p.hang === 0 && !p.swim))
}

/**
 * Normal takip: karakter ekranın ortasında, koşu yönünde biraz önde; önünde düşüş varsa biraz aşağıda.
 * Dikeyde kamera her zıplamada sallanmaz: yerde ya da duvarda iken basılan yüksekliğe (feet) bakar, havadayken
 * o yükseklikte kalır. Karakter ekranın üst ya da alt bandına yaklaşırsa yine izler (yüksek tırmanış, uzun düşüş).
 */
export function followTarget(w: World, vw: number, vh: number, cam?: CamState, dt = 0): [number, number] {
  const p = w.player
  const cap = PHYS.run * 1.15
  const vx = Math.max(-cap, Math.min(cap, p.vx))
  // bakış payı ekrana orantılı (telefonda küçük) ve dönüşte yumuşakça kayar
  const lead = Math.min(CAM.lead, vw * CAM.leadMax)
  // önünde engel varsa bakış payı büyür (yumuşakça, leadKeep ile): atlanacak yer kadraja girer
  const wantLead = (p.facing * lead + vx * CAM.leadVel * (lead / CAM.lead)) * (1 + CAM.hazardLead * hazardAhead(w))
  if (cam) cam.lead = cam.lead === undefined ? wantLead : approach(cam.lead, wantLead, dt, CAM.leadKeep)
  // aşağı bakış (düşüş, uçurum kenarı) ile yukarı bakış (tırmanış) tek bir yumuşak payda
  const look = lookDown(w, vh) - (climbing(w) ? vh * CAM.climbUp : 0)
  if (cam) cam.look = cam.look === undefined ? look : approach(cam.look, look, dt, CAM.lookKeep)
  const feet = p.y + p.h
  const onGround = p.grounded || p.wallDir !== 0 || p.dead
  if (cam && (onGround || cam.feet === undefined)) cam.feet = feet
  const anchor = cam?.feet ?? feet
  let ty = anchor - p.h / 2 - vh * 0.55 + (cam?.look ?? look)
  // karakter ekranın %22'si ile %72'si arasında kalsın
  const pc = p.y + p.h / 2
  ty = Math.max(pc - vh * 0.72, Math.min(pc - vh * 0.22, ty))
  // düşüşte ineceği yer kadrajda: iniş ekranın alt %18'inin üstünde kalır (karakter en çok %20'ye dek yukarı itilir).
  // Basılan yükseklikten aşağıdaysa (aşağı iniş) hedef inişe göre kurulur; yukarıdaki platforma atlayış etkilenmez
  const land = p.vy > 0 ? landingY(w) : null
  if (land !== null && land > anchor + T) {
    const want = land + T * 0.5 - vh * 0.82
    ty = Math.max(ty, Math.min(pc - vh * 0.2, want))
  }
  // ölü bölge hedefe uygulanır, kameraya değil: çapa karakter ortası pencereden çıkınca onu izler (ufak ileri geri
  // adımlar kadrajı oynatmaz). Çapa yalnız karakterin yoluna bağlıdır: her Hz'de aynı sonuç
  const pcx = p.x + p.w / 2
  let ax = pcx
  if (cam) {
    const win = vw * CAM.window
    cam.anchor = cam.anchor === undefined ? pcx : Math.max(pcx - win, Math.min(pcx + win, cam.anchor))
    ax = cam.anchor
  }
  return [ax - vw / 2 + (cam?.lead ?? wantLead), ty]
}

/**
 * Boss dövüşünde kamera karakterle boss'un arasına bakar ve ikisiyle birlikte kayar: karakter yürüdükçe kadraj
 * akar, ikisi de ekranda kalır. Ekrana sığmayacak kadar uzaklaşırlarsa boss kenarda tutulur, kadraj karaktere
 * doğru yaslanır. Yerin altındaki boss'un yerine çıkacağı yer, havadaki boss'la zemin birlikte kadrajda durur.
 */
export function bossFrame(w: World, vw: number, vh: number): [number, number] | null {
  // iki boss varsa (Co-op Boss Kapışması) oyuncuya en yakın ayaktaki
  const live = [w.boss, w.boss2].filter((x): x is NonNullable<typeof x> => !!x && x.state !== 'sleep' && x.state !== 'down')
  const b = live.sort((a, c) => Math.abs(a.x - w.player.x) - Math.abs(c.x - w.player.x))[0]
  if (!b || w.player.dead) return null
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
export function stepCamera(w: World, cam: CamState, dt: number, vw: number, vh: number) {
  const boss = bossFrame(w, vw, vh)
  const [tx, ty] = boss ?? followTarget(w, vw, vh, cam, dt)
  // nitroda takip hızla orantılı hızlanır: gecikme aynı kalır, karakter ekranda kaymaz (dash'teki gibi)
  const keep = w.player.dashTime > 0 ? CAM.dashFollow : w.player.nitro > 0 ? CAM.follow ** NITRO.speed : CAM.follow
  const x = approach(cam.x, tx, dt, boss ? CAM.boss : keep)
  // düşerken dikey takip yatay kadar çevik: kadraj inişin gerisinde kalmaz
  const falling = !w.player.grounded && w.player.vy > PHYS.fallMax * 0.5
  const y = approach(cam.y, ty, dt, boss ? CAM.bossY : falling ? CAM.follow : CAM.followY)
  ;[cam.x, cam.y] = clampCam(w, x, y, vw, vh)
}
