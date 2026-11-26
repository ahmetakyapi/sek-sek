import { CITY, LAYER_H, LAYER_W, buildLayers, disc, enemySpecies, rect, type Ctx, type Layers } from './art'
import { BOSS_LINES } from './bossLines'
import { drawChaseDog, drawEnemy, drawFriend, drawKeepsake, drawThing } from './enemyDraw'
import { CHARACTERS, type CharacterDef } from './characters'
import type { Boss } from './boss'
import { drawBoss } from './bossDraw'
import { INK, LOOKS, POSES, setPainted, airPoseInto, climbPose, copyPose, drawHero, gaitInto, handPos, lerpPoseInto, newPose, strideLength, swimStroke, type Look, type Pose } from './heroDraw'
import { idlePose, landInto } from './stance'
import { NO_KIT, type Kit } from './accessories'
import { TerrainHD } from './terrainDraw'
import { drawPortrait } from './portraitDraw'
import { Atmosphere, Clouds, paintLayer } from './atmosphere'
import { cb, cbc, type CbMode } from './colorBlind'
import { CAM, camYRange, clampCam, kickOffset, shakeOffset, stepCamera, type CamState } from './camera'
import { GHOST_HZ, type GhostRun } from './ghost'
import type { Player } from './sim'
import { AIR, AUNT, BLOCK_A, BLOCK_B, BOSS_GATE, CABLE, CRUMBLE, CRYSTAL_RECHARGE, ONEWAY, DOOR, EMPTY, FROST_CYCLE, ICE, NITRO, PHYS, THERMAL, RHYTHM, RHYTHM_A, RHYTHM_B, ROPE, SPIKE_UP, SWIM, TIDE_CYCLE, WATER, hammerState, tideFill, tidePhase, type World } from './sim'
import { T, type CityKey, type GameEvent } from './types'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
  grav: number
}

/** dash izi: kopyalar arası dünya pikseli, ömür (sn), en çok kopya */
/** yüzülen su: açık turkuaz (yüzey, derin, dalga) — öldüren suyla karışmasın */
const SWIM_COLORS = ['#5cc4cf', '#3fa9b8', '#a8eef2']
/** zehirli su (kükürtlü çukur): asit yeşili, koyu dip, açık köpük; öldüren mavi su ve yüzülen turkuazla karışmasın */
const POISON_COLORS = ['#a6e04a', '#4c8a2e', '#eaff9e']

const GHOST_GAP = 9
const GHOST_LIFE = 0.22
const GHOST_MAX = 4
/** dash'in hız çizgileri: çizgiler arası dünya pikseli (mesafeye göre bırakılır: her Hz'de aynı yoğunluk) */
const STREAK_GAP = 5

interface Ghost {
  x: number
  y: number
  life: number
  flip: boolean
  pose: Pose
  rot: number
  /** bir kez çizilmiş görüntüsü ve ayak çizgisi (render.ts drawScratch) */
  img: HTMLCanvasElement | null
  oy: number
}

interface Ambient {
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  size: number
}

const GROUND_Y = 20 * T

/** bayraktaki beş köşeli yıldız (5x5) */
const STAR = ['..#..', '..#..', '#####', '.###.', '.#.#.']

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: Ctx
  private buf: HTMLCanvasElement
  private b: Ctx
  /** ön katman: su, hareketli nesneler, canlılar, parçacıklar (zeminin üstünde) */
  private fbuf: HTMLCanvasElement
  private f: Ctx
  private terrain: TerrainHD | null = null
  private world: World | null = null
  /** son fizik adımından önceki konumlar: çizim adımlar arasında ara değerlenir */
  private prev = new WeakMap<object, { x: number; y: number }>()
  private layers: Layers | null = null
  private city: CityKey = 'istanbul'
  private particles: Particle[] = []
  private ghosts: Ghost[] = []
  /** son hız çizgisinin bırakıldığı yer (dash sürerken) ve sıra sayacı */
  private streakAt: [number, number] | null = null
  /** son nitro alev kıvılcımının çıktığı yer */
  private nitroAt: [number, number] | null = null
  private streakN = 0
  private ambient: Ambient[] = []
  /** el boyaması ışık, renk tonu ve süzülenler (game/atmosphere.ts) */
  private atmo: Atmosphere | null = null
  private clouds: Clouds | null = null
  /** bu karede görünen fenerlerin ışık merkezleri (dünya tamponu pikseli; x, y çiftleri): atmosferde sıcak hale */
  private lamps: number[] = []
  private shake = 0
  private flash = 0
  /** son dash itmesi: başladığı an ve yönü (kickOffset) */
  private kick = { t: -1, dx: 0, dy: 0 }
  scale = 4
  viewW = 320
  viewH = 180
  camX = 0
  camY = 0
  /** kameranın kare arası durumu (basılan yükseklik, yumuşatılmış bakış payları) */
  private cam: CamState = { x: 0, y: 0 }
  private t = 0
  character: CharacterDef = CHARACTERS.uktun
  /** oyuncunun seçtiği atkı rengi (yoksa karakterin kendi atkısı) */
  scarf: { color: string; shade: string } | null = null
  /** Mağaza'dan takılan aksesuar (game/accessories.ts) */
  accessory: Kit = NO_KIT
  /** en iyi koşunun hayaleti (yoksa null) */
  ghostRun: GhostRun | null = null
  /** hayaletin poz tamponu: oyuncuyla aynı poz kodu (heroDraw gaitInto / airPoseInto, stance idlePose), kare başına ayırma yok */
  private ghostPose: Pose = newPose()
  /** ekran sarsıntısı çarpanı: 0 = kapalı (ayarlar ya da "hareketi azalt") */
  /** boss'u çizilen şehir (özel haritada başka şehrin boss'u olabilir) */
  bossCity: CityKey = 'istanbul'
  bossCity2: CityKey = 'istanbul'
  /** Van gölünün canavarının dolaştığı su yüzeyleri (dünya pikseli) */
  private lakeRuns: { x0: number; x1: number; y: number }[] = []
  shakeScale = 1
  /** Kolaylık: hayalet koşunun görünürlüğü (0.25 soluk, 0.46 normal, 0.8 belirgin) */
  ghostAlpha = 0.46
  /** Kolaylık: karakterin üstünde dash hakkı halkası */
  dashMeter = false
  /** Kolaylık: renk körü paleti (yalnız çizim; `game/colorBlind.ts`) */
  get colorBlind(): CbMode {
    return cb.mode
  }
  set colorBlind(m: CbMode) {
    if (cb.mode === m) return
    cb.mode = m
    // zemin önbelleği (diken rengi) yeniden kurulur
    this.terrain = null
  }
  /** Kolaylık: kamera yakınlığı çarpanı (Dar Kadraj'ın `zoom`uyla çarpılır) */
  userZoom = 1
  /** Deprem (zor mod): kadraj hiç durmadan sarsılır (sarsıntı ayarı kapalıysa etkisiz) */
  quake = false
  /** Karanlık Yol (zor mod): karakterin çevresindeki küçük ışığın ötesi karanlık */
  dark = false
  /** Görünmez Dikenler (zor mod): dikenler zemin önbelleğine çizilmez */
  hiddenSpikes = false
  /** Görünmez Dikenler: düşülen yerler (dünya pikseli) */
  private deathMarks: { x: number; y: number }[] = []
  private marksFor = ''
  /** Hayalet Zemin (zor mod): oyuncunun çevresi dışı sisle örtülür */
  ghostGround = false
  /** Dar Kadraj (zor mod): çizim ölçeği bu katla büyür (kamera yaklaşır) */
  zoom = 1
  /** fotoğraf kipi: kamera oyuncuyu bırakır, oyuncunun kaydırdığı yere bakar (dünya pikseli) */
  photo: { x: number; y: number } | null = null
  /** sahnedeki yazıların dili */
  lang: 'tr' | 'en' = 'tr'
  /** yüzen kısa yazılar: kombo, duvar zinciri, +1 */
  private pops: Pop[] = []
  private stompChain = 0
  private wallChain = 0
  /** havadaki en yüksek düşüş hızı: sert inişte toz ve sarsıntı */
  private airVy = 0
  /** boss’un uyandığı an: adı kısa süre yazılır */
  private bossWoke = -99
  /** boss'un konuşma balonu: ne dedi, ne zaman */
  private bossSay: { text: string; at: number; hold: number } | null = null
  private bossWas = ''
  /** gece-gündüz geçişinin yumuşak değeri (0 gündüz, 1 gece) */
  private nightK = 0
  /** bu karede çizilecek karakterler (hayalet, dash izi, oyuncu): dünya tamponundan sonra ana tuvalde */
  private heroes: HeroDraw[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.buf = document.createElement('canvas')
    this.b = this.buf.getContext('2d')!
    this.fbuf = document.createElement('canvas')
    this.f = this.fbuf.getContext('2d')!
  }

  resize(cssW: number, cssH: number, deviceDpr: number) {
    // Piksel bütçesi: kare başına en çok ~2,6 milyon piksel çizilir (aşağı yukarı 1080p). Retina, 4K ve DPR 3 telefonlarda
    // tuval ekranın tam yoğunluğunda çizilince boyama yükü 2-3 katına çıkıyor, kare kaçıyordu; tarayıcı ölçekler
    const dpr = backingDpr(cssW, cssH, deviceDpr)
    this.dpr = dpr
    const devW = Math.round(cssW * dpr)
    const devH = Math.round(cssH * dpr)
    this.canvas.width = devW
    this.canvas.height = devH
    const portrait = cssH > cssW
    // 25 Kasım 2026: kamera bir tık yakın (karakter kolay seçilsin): yatayda ~18x12, dikeyde ~12 karo
    const target = portrait ? Math.min(devW / (12 * T), devH / (19 * T)) : Math.min(devW / (18 * T), devH / (12 * T))
    // yatayda en yakın tam sayı: karakter masaüstünde de okunur kalsın
    this.scale = Math.max(1, portrait ? Math.floor(target * this.zoom * this.userZoom) : Math.round(target * this.zoom * this.userZoom))
    // bir piksel fazla: kamera kesirli kayarken kenarda boşluk kalmasın
    this.viewW = Math.ceil(devW / this.scale) + 1
    this.viewH = Math.ceil(devH / this.scale) + 1
    this.buf.width = this.fbuf.width = this.viewW
    this.buf.height = this.fbuf.height = this.viewH
    this.terrain = null
  }

  /** Her fizik adımından ÖNCE çağrılır: hareketli her şeyin konumunu saklar. */
  capture(w: World) {
    const keep = (o: { x: number; y: number }) => {
      const q = this.prev.get(o)
      if (q) {
        q.x = o.x
        q.y = o.y
      } else this.prev.set(o, { x: o.x, y: o.y })
    }
    keep(w.player)
    if (w.partner) keep(w.partner)
    for (const o of w.platforms) keep(o)
    for (const o of w.enemies) keep(o)
    for (const o of w.projectiles) keep(o)
    for (const o of w.crates) keep(o)
    if (w.boss) keep(w.boss)
    if (w.boss2) keep(w.boss2)
  }

  /** Konumları iki adım arasına çeker; dönen işlev gerçek konumları geri koyar. Işınlanmada (doğuş, kapı) ara değerleme yok. */
  private blend(w: World, alpha: number): () => void {
    const moved: Array<[{ x: number; y: number }, number, number]> = []
    const mix = (o: { x: number; y: number }) => {
      const q = this.prev.get(o)
      if (!q || (q.x === o.x && q.y === o.y) || Math.abs(o.x - q.x) > 24 || Math.abs(o.y - q.y) > 24) return
      moved.push([o, o.x, o.y])
      o.x = q.x + (o.x - q.x) * alpha
      o.y = q.y + (o.y - q.y) * alpha
    }
    mix(w.player)
    if (w.partner) mix(w.partner)
    for (const o of w.platforms) mix(o)
    for (const o of w.enemies) mix(o)
    for (const o of w.projectiles) mix(o)
    for (const o of w.crates) mix(o)
    if (w.boss) mix(w.boss)
    if (w.boss2) mix(w.boss2)
    return () => {
      for (const [o, x, y] of moved) {
        o.x = x
        o.y = y
      }
    }
  }

  setLevel(world: World) {
    this.city = world.level.city
    // düşüş işaretleri aynı bölümde kalır (Tek Can'da baştan başlansa da öğrenilen yer unutulmaz)
    if (this.marksFor !== world.level.id) this.deathMarks = []
    this.marksFor = world.level.id
    this.bossCity = world.level.bossOf ?? world.level.city
    this.bossCity2 = world.level.bossOf2 ?? this.bossCity
    // Van: gölün canavarı geniş su yüzeylerinde (en az 6 karo) dolaşır; yüzeyler bir kez bulunur
    this.lakeRuns = []
    if (this.city === 'van')
      for (let ty = 1; ty < world.rows; ty++) {
        let s0 = -1
        for (let tx = 0; tx <= world.cols; tx++) {
          const top = world.tile(tx, ty) === WATER && world.tile(tx, ty - 1) !== WATER && world.tile(tx, ty - 1) !== SWIM
          if (top && s0 < 0) s0 = tx
          if (!top && s0 >= 0) {
            if (tx - s0 >= 6) this.lakeRuns.push({ x0: s0 * T, x1: tx * T, y: ty * T + 6 })
            s0 = -1
          }
        }
      }
    this.layers = buildLayers(this.city)
    this.atmo = new Atmosphere(this.city, CITY[this.city])
    this.levelAt = this.t
    this.npcCache.clear()
    this.clouds = w0Indoor(world) ? null : new Clouds(this.city, CITY[this.city], this.atmo.mood)
    // boya hacmi: kenar ışığı, tepede ılık, dipte gölge, fırça dokusu (katman başına bir kez)
    paintLayer(this.layers.far, this.atmo.mood, 0, 11)
    paintLayer(this.layers.mid, this.atmo.mood, 0.5, 23)
    paintLayer(this.layers.near, this.atmo.mood, 1, 37)
    this.world = world
    this.terrain = null
    this.particles = []
    this.pops = []
    this.stompChain = 0
    this.wallChain = 0
    this.raised.clear()
    this.ghosts = []
    this.initAmbient()
    const p = world.player
    this.camX = p.x - this.viewW / 2
    this.camY = p.y - this.viewH / 2
    this.cam = { x: this.camX, y: this.camY }
    this.clampCam(world)
  }

  /** bayrak göndere çekildiği an (index → t) */
  private raised = new Map<number, number>()

  private skyCache: { key: string; cv: HTMLCanvasElement } | null = null

  private skyCanvas(sky: [string, string, string]) {
    const key = `${this.viewW}x${this.viewH}:${sky.join()}:${this.atmo?.mood.key.join() ?? ''}`
    if (this.skyCache?.key === key) return this.skyCache.cv
    const cv = document.createElement('canvas')
    cv.width = this.viewW
    cv.height = this.viewH
    const c = cv.getContext('2d')!
    const N = 12
    const at = (t: number) => (t < 0.6 ? mixHex(sky[0], sky[1], t / 0.6) : mixHex(sky[1], sky[2], (t - 0.6) / 0.4))
    // boyalı gök: bantlar biraz daha doygun, ufuk şehrin ışık rengine ısınır (game/atmosphere.ts)
    const glow: number[] = this.atmo?.mood.key ?? [255, 210, 160]
    const bands = Array.from({ length: N }, (_, i) => {
      const [r, g, bl] = at(i / (N - 1)).match(/\d+/g)!.map(Number)
      const L = r * 0.3 + g * 0.59 + bl * 0.11
      const warm = Math.max(0, i / (N - 1) - 0.55) * 0.35
      return [r, g, bl].map((v, j) => Math.max(0, Math.min(255, Math.round((L + (v - L) * 1.45) * 0.95 * (1 - warm) + glow[j] * warm))))
    })
    const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
    const img = c.createImageData(cv.width, cv.height)
    const d = img.data
    for (let y = 0; y < cv.height; y++) {
      const f = (y / Math.max(1, cv.height - 1)) * (N - 1)
      const i = Math.min(N - 2, Math.floor(f))
      const fr = f - i
      for (let x = 0; x < cv.width; x++) {
        const col = fr > (B4[y % 4][x % 4] + 0.5) / 16 ? bands[i + 1] : bands[i]
        const k = (y * cv.width + x) * 4
        d[k] = col[0]
        d[k + 1] = col[1]
        d[k + 2] = col[2]
        d[k + 3] = 255
      }
    }
    c.putImageData(img, 0, 0)
    this.skyCache = { key, cv }
    return cv
  }

  /* ── Statik tile katmanı ──────────────────────────────────── */
  handle(e: GameEvent, w: World) {
    const p = w.player
    const s = CITY[this.city]
    switch (e.type) {
      case 'jump':
        this.burst(p.x + p.w / 2, p.y + p.h, 5, 'rgba(240,230,210,0.8)', 30, 1)
        break
      case 'walljump':
        this.burst(p.x + p.w / 2, p.y + p.h, 5, 'rgba(240,230,210,0.8)', 30, 1)
        this.wallChain++
        if (this.wallChain >= 3) this.pop(p.x + p.w / 2, p.y - 6, this.wallChain === 3 ? (this.lang === 'en' ? 'Wall Master!' : 'Duvar Ustası!') : `×${this.wallChain}`, '#7ad8ff')
        break
      case 'land': {
        const hard = this.airVy > 260
        this.burst(p.x + p.w / 2, p.y + p.h, hard ? 10 : 4, 'rgba(240,230,210,0.7)', hard ? 45 : 25, 1)
        if (hard) this.shake = Math.max(this.shake, 1.2)
        this.airVy = 0
        this.stompChain = 0
        this.wallChain = 0
        break
      }
      case 'dash': {
        // kalkış: kadraj dash yönünün tersine yumuşakça yaslanır (titreme yok), soluk bir parıltı
        this.flash = Math.max(this.flash, 0.04)
        this.kick = { t: this.t, dx: p.dashDir[0], dy: p.dashDir[1] }
        // kalkış: atkının renginde kıvılcım halkası geriye doğru açılır; yerdeyse ayak altından toz kalkar
        const cx = p.x + p.w / 2
        const cy = p.y + p.h / 2
        const [dx, dy] = p.dashDir
        const tint = this.scarf?.color ?? LOOKS[this.character.id].scarf
        for (let i = 0; i < 10; i++) {
          const a = Math.atan2(-dy, -dx) + (i / 9 - 0.5) * 2.2
          const v = 70 + (i % 3) * 35
          this.particles.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.22 + (i % 2) * 0.08, max: 0.3, color: i % 3 ? tint : '#fff6e0', size: i % 4 === 0 ? 2 : 1, grav: 0 })
        }
        if (p.grounded || dy === 0)
          for (let i = 0; i < 5; i++) this.particles.push({ x: cx - dx * 4, y: p.y + p.h - 1, vx: -dx * (30 + i * 14), vy: -12 - i * 7, life: 0.32, max: 0.32, color: 'rgba(230,220,200,0.75)', size: i % 2 ? 1 : 2, grav: 90 })
        this.streakAt = null
        break
      }
      case 'death':
        // Görünmez Dikenler: düşülen yer kırmızı çarpıyla işaretlenir (bölüm boyunca)
        if (this.hiddenSpikes && this.deathMarks.length < 60) this.deathMarks.push({ x: e.x, y: e.y })
        this.shake = 6
        this.burst(e.x, e.y, 22, '#d6403a', 120, 2)
        this.burst(e.x, e.y, 12, s.accent, 90, 2)
        break
      case 'collect':
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 18, '#ffd36a', 90, 1)
        this.pop(p.x + p.w / 2, p.y - 6, '+1', '#ffd36a')
        break
      case 'checkpoint': {
        this.raised.set(e.index, this.t)
        const cp = w.checkpoints.find((c) => c.index === e.index)
        // bayrak göndere çekilirken direğin tepesinden kırmızı-beyaz konfeti
        if (cp) {
          this.burst(cp.x + 4, cp.y + cp.h - 28, 16, '#e30a17', 80, 1)
          this.burst(cp.x + 4, cp.y + cp.h - 28, 10, '#ffffff', 70, 1)
        }
        this.burst(p.x + p.w / 2, p.y, 8, s.accent, 60, 1)
        break
      }
      case 'spring': {
        // olay kimin bastığını söylemez: co-op'ta yeni ezilmiş bir yaya en yakın olan (oyuncu ya da eş) sekmiştir
        let who = p
        let best = Infinity
        for (const q of w.partner && !w.partner.dead ? [p, w.partner] : [p])
          for (const sp of w.springs) {
            const d = Math.hypot(q.x + q.w / 2 - (sp.x + sp.w / 2), q.y + q.h - sp.y) - (sp.squash > 0 ? 1000 : 0)
            if (d < best) {
              best = d
              who = q
            }
          }
        this.burst(who.x + who.w / 2, who.y + who.h, 8, '#ffd36a', 50, 1)
        break
      }
      case 'bite':
        this.shake = Math.max(this.shake, 3)
        this.burst(e.x, e.y, 12, '#f4f0e6', 70, 1)
        this.pop(e.x, e.y - 12, this.lang === 'en' ? 'Woof!' : 'Hav!', '#ffd36a', true)
        break
      case 'shoulder':
        this.burst(e.x, e.y, 10, '#7ee0d2', 60, 1)
        this.pop(e.x, e.y - 14, this.lang === 'en' ? 'Boost!' : 'Omuz!', '#7ee0d2')
        break
      case 'stomp': {
        this.shake = Math.max(this.shake, 2)
        this.burst(e.x, e.y, 12, '#f4f0e6', 70, 1)
        // yere değmeden art arda ezdikçe yazı büyür
        this.stompChain++
        const words = this.lang === 'en' ? ['Hop!', 'Double!', 'Triple!'] : ['Hop!', 'Çifte!', 'Üçleme!']
        const n = this.stompChain
        this.pop(e.x, e.y - 8, n <= 3 ? words[n - 1] : `${this.lang === 'en' ? 'Legend' : 'Efsane'} ×${n}`, n >= 3 ? '#ffd36a' : '#f4f0e6', n >= 2)
        break
      }
      case 'bossWake':
        this.bossWoke = this.t
        this.say('wake', 2.4)
        this.shake = Math.max(this.shake, 3)
        break
      case 'bossSlam':
        this.shake = Math.max(this.shake, 3.5)
        this.burst(e.x, e.y, 12, 'rgba(240,230,210,0.8)', 70, 1)
        break
      case 'bossHit':
        this.say('ouch', 1.5)
        this.shake = Math.max(this.shake, 4)
        this.flash = 0.08
        this.burst(e.x, e.y, 20, '#ffd36a', 110, 2)
        this.pop(e.x, e.y - 10, e.hp === 1 ? (this.lang === 'en' ? 'One more!' : 'Bir tane daha!') : this.lang === 'en' ? 'Got it!' : 'Tam isabet!', '#ffd36a', true)
        break
      case 'bossDown':
        this.shake = 6
        this.flash = 0.14
        this.burst(e.x, e.y, 34, '#ffd36a', 150, 2)
        this.burst(e.x, e.y, 24, s.accent, 120, 2)
        this.burst(e.x, e.y, 16, '#f4ead8', 90, 1)
        this.pop(e.x, e.y - 14, this.lang === 'en' ? 'The square is yours!' : 'Meydan senin!', '#ffd36a', true)
        break
      case 'warp':
        // kapıdan geçiş: kamera yeni yere sıçrar, kısa bir ışık
        this.camX = p.x - this.viewW / 2
        this.camY = p.y - this.viewH * 0.55
        this.cam = { x: this.camX, y: this.camY }
        this.flash = 0.16
        break
      case 'charm':
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 26, '#4ab0e8', 110, 2)
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 14, '#f4f8ff', 80, 1)
        this.pop(p.x + p.w / 2, p.y - 8, this.lang === 'en' ? 'Evil eye, begone!' : 'Nazar değmesin!', '#7ad8ff', true)
        this.flash = 0.08
        break
      case 'swim': {
        // kulaç: yüzeye yakınsa su sıçrar, derindeyse kabarcık bulutu
        const head = this.world?.tile(Math.floor((p.x + p.w / 2) / T), Math.floor((p.y - 4) / T))
        if (head !== SWIM) this.burst(p.x + p.w / 2, p.y + 2, 8, '#e8fbff', 70, 1)
        else this.burst(p.x + p.w / 2, p.y + 4, 5, 'rgba(235,252,255,0.8)', 30, 1)
        break
      }
      case 'breath':
        // nefes azalıyor: ağızdan kabarcık kaçar, gösterge bir kez nabız atar
        this.breathPulse = 1
        this.burst(p.x + p.w / 2 + p.facing * 4, p.y + 3, 3 + (3 - e.left) * 2, 'rgba(235,252,255,0.9)', 34, 1)
        break
      case 'drown':
        // nefes bitti: büyük kabarcık bulutu ve açık bir söz (düşüşten ayrı anlaşılsın)
        this.burst(p.x + p.w / 2, p.y + 2, 22, '#d8f6ff', 80, 1.4)
        this.flash = 0.12
        this.pop(p.x + p.w / 2, p.y - 12, this.lang === 'en' ? 'Out of Breath!' : 'Nefesin Bitti!', '#bfefff', true)
        break
      case 'respawn': {
        // uzaktan doğuşta kamera bölümü boydan boya taramaz: yeni yere sıçrar (yakınsa yumuşakça kayar)
        const tx = p.x - this.viewW / 2
        const ty = p.y - this.viewH * 0.55
        if (Math.abs(tx - this.camX) > this.viewW * 0.6 || Math.abs(ty - this.camY) > this.viewH * 0.6) {
          ;[this.camX, this.camY] = clampCam(w, tx, ty, this.viewW, this.viewH)
          this.cam = { x: this.camX, y: this.camY }
        }
        this.stompChain = 0
        this.wallChain = 0
        break
      }
      case 'crumble':
        break
      case 'perfect':
        // tam zamanında yay: altın kıvılcım ve yazı
        this.burst(p.x + p.w / 2, p.y + p.h, 14, '#ffd36a', 110, 1)
        this.pop(p.x + p.w / 2, p.y - 6, this.lang === 'en' ? 'Perfect!' : 'Tam Zamanında!', '#ffd36a')
        break
      case 'nitro':
        // nitro tüpü alındı: turuncu kıvılcım, yazı; alev izi koşu boyunca drawParticles öncesinde eklenir
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 16, '#ff9a3c', 100, 1)
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 8, '#ffe27a', 70, 1)
        this.pop(p.x + p.w / 2, p.y - 6, this.lang === 'en' ? 'Nitro! Run fast' : 'Nitro! Hızlı koş', '#ff9a3c')
        this.kick = { t: this.t, dx: p.facing, dy: 0 }
        break
      case 'crystal':
        // dash halkasından geçildi: halkanın renginde kıvılcım, dash'in yenilendiği yazıyla da okunur
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 14, '#ff8a70', 90, 1)
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 8, '#ffffff', 70, 1)
        this.pop(p.x + p.w / 2, p.y - 6, 'Dash!', '#ff8a70')
        this.flash = 0.05
        break
      case 'key':
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 20, '#f2c14e', 100, 2)
        this.shake = Math.max(this.shake, 2)
        break
      case 'stamp':
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 30, '#f4ead8', 120, 2)
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 16, s.accent, 90, 2)
        this.flash = 0.1
        break
      case 'switch':
        this.shake = Math.max(this.shake, 1.5)
        break
      case 'pet':
        for (let i = 0; i < 6; i++) this.particles.push({ x: e.x - 4 + Math.random() * 8, y: e.y - 2, vx: (Math.random() - 0.5) * 30, vy: -30 - Math.random() * 25, life: 1.1, max: 1.1, color: i % 2 ? '#ff6a8a' : '#ffb0c0', size: 2, grav: -8 })
        this.petTimer = 0.5
        break
      default:
        break
    }
  }

  private pop(x: number, y: number, text: string, color: string, big = false) {
    this.pops.push({ x, y, text, color, life: 0.9, big })
    if (this.pops.length > 6) this.pops.shift()
  }

  private burst(x: number, y: number, n: number, color: string, speed: number, size: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const v = speed * (0.3 + Math.random() * 0.7)
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.3, life: 0.5 + Math.random() * 0.4, max: 0.9, color, size, grav: 260 })
    }
  }

  private initAmbient() {
    this.ambient = []
    const n = 70
    for (let i = 0; i < n; i++) this.ambient.push({ x: Math.random() * 600, y: Math.random() * 400, vx: 0, vy: 0, phase: Math.random() * 10, size: Math.random() < 0.3 ? 2 : 1 })
  }

  /** doğrulama sayaçları (?debug): kare içinde tek seferde çizilmek zorunda kalan zemin bandı */
  get stats() {
    return { syncBands: this.terrain?.syncBands ?? 0 }
  }

  /** ekran pikselinin CSS pikseline oranı: baloncuk yazısı her ekranda aynı okunur boyda */
  private dpr = 1

  /**
   * Konuşma: yakındaki şehir insanının ya da tabelanın sözü (metni arayüz verir, dili seçilmiş). Başının üstünde
   * kuyruklu baloncuk olarak çizilir: ekranın ortasını kaplamaz, karakterin üstüne binmez, kimin konuştuğu belli olur.
   */
  dialog: { kind: 'npc' | 'sign'; name?: string; text: string } | null = null
  private dlgKey = ''
  private dlgAt = 0

  /** son karenin süresi: kare başına olasılıklar buna göre ölçeklenir */
  private frameDt = 1 / 60
  /** gelgitin çizim saati (fizik saatinin ara değerlenmiş hâli) */
  private tideT = 0
  /** gelgit havuzlarının dibi: havuz başına bir kez çizilen ıslak kum (dünya değişince yeniden) */
  private tideBeds: { w: World; beds: { cv: HTMLCanvasElement; x: number; y: number; x1: number }[] } | null = null

  /** 60 Hz'de kare başına p olasılığı, her kare hızında saniyede aynı sıklık verir (yüksek Hz'de parçacık yığılmaz) */
  private chance(p60: number) {
    return Math.random() < 1 - Math.pow(1 - Math.min(0.999, p60), this.frameDt * 60)
  }

  /* ── Kamera (hesabı game/camera.ts) ─────────────────────── */
  /** fotoğraf kipine girerken kameranın şu anki yeri; görünür alanın boyu (dünya pikseli) */
  photoStart() {
    this.photo = { x: this.camX, y: this.camY }
    return { w: this.viewW, h: this.viewH }
  }

  private clampCam(w: World) {
    ;[this.camX, this.camY] = clampCam(w, this.camX, this.camY, this.viewW, this.viewH)
  }

  /* ── Çizim ────────────────────────────────────────────────── */
  /** alpha: son fizik adımından bu yana geçen sürenin adıma oranı (0..1); her tazeleme hızında akıcı çizim için */
  render(w: World, dt: number, alpha = 1) {
    this.t += dt
    // boyalı karakter, boss ve canlılar yalnız zengin kademede (kare sonunda önizlemeler için yeniden açılır)
    setPainted(this.tier === 2)
    this.frameDt = dt
    // gelgit saati de iki fizik adımı (1/120 sn) arasına çekilir: su yüzü her tazeleme hızında akıcı iner çıkar
    this.tideT = w.clock - (1 - alpha) / 120
    const unblend = this.blend(w, alpha)
    const b = this.b
    const f = this.f
    const s = CITY[this.city]

    // kamera: saate bağlı (game/camera.ts), kare hızından bağımsız
    if (this.photo) {
      // fotoğraf kipi: kamera sınırlar içinde serbest; yumuşak yaklaşım (üstel, kare hızından bağımsız)
      const [px, py] = clampCam(w, this.photo.x, this.photo.y, this.viewW, this.viewH)
      this.photo.x = px
      this.photo.y = py
      const k = 1 - Math.pow(0.0005, dt)
      this.camX += (px - this.camX) * k
      this.camY += (py - this.camY) * k
    } else {
      this.cam.x = this.camX
      this.cam.y = this.camY
      // co-op: kamera iki oyuncunun ortasına bakar (oyuncu kaydı bu hesap için geçici olarak orta noktaya çekilir)
      const q = w.partner
      const p = w.player
      const mid = q && !q.dead && !p.dead
      const keepX = p.x
      const keepY = p.y
      if (mid) {
        p.x = (p.x + q.x) / 2
        p.y = Math.min(p.y, q.y) + Math.abs(p.y - q.y) * 0.35
      }
      stepCamera(w, this.cam, dt, this.viewW, this.viewH)
      if (mid) {
        p.x = keepX
        p.y = keepY
      }
      this.camX = this.cam.x
      this.camY = this.cam.y
    }
    // sarsıntı üstel söner (doğrusal sönme kuyrukta birden kesiliyordu); düşük kortizol (25 Kasım 2026): olayların
    // sarsıntısı CAM.shakeGain kadar kısık
    this.shake = this.shake < 0.05 ? 0 : this.shake * Math.pow(CAM.shakeKeep, dt)
    if (this.quake) this.shake = Math.max(this.shake, 2.2)
    // küçük ekranda büyütme oranı yüksek: aynı sarsıntı ekranda daha büyük görünür, orana göre küçülür
    const small = Math.min(1, this.viewW / 420)
    let [sx, sy] = shakeOffset(this.t, this.shake * (this.quake ? 1 : CAM.shakeGain) * this.shakeScale * small)
    const kk = kickOffset(this.t - this.kick.t) * CAM.kick * this.shakeScale * small
    sx -= this.kick.dx * kk
    sy -= this.kick.dy * kk
    // kamera kesirli kayar: düşük çözünürlüklü katmanlar tam piksele çizilir, ekrana basılırken kesir kadar ötelenir
    const cx = Math.floor(this.camX + sx)
    const cy = Math.floor(this.camY + sy)
    const offX = Math.round((this.camX + sx - cx) * this.scale)
    const offY = Math.round((this.camY + sy - cy) * this.scale)
    const hdX = cx + offX / this.scale
    const hdY = cy + offY / this.scale

    // gökyüzü: 12 bant, sınırlarda 4x4 Bayer geçişi (el işi gradyan)
    b.drawImage(this.skyCanvas(s.sky), 0, 0)
    // güneşli şehirlerde süzülen ışık huzmeleri
    if (s.sun) {
      const sunX = this.viewW * s.sun.x
      b.save()
      for (let i = 0; i < 5; i++) {
        const a = -0.9 + i * 0.42 + Math.sin(this.t * 0.15 + i) * 0.05
        const len = this.viewH * 1.4
        b.fillStyle = `rgba(255,232,190,${0.035 + (i % 2) * 0.015})`
        b.beginPath()
        b.moveTo(sunX, 20)
        b.lineTo(sunX + Math.sin(a - 0.05) * len, 20 + Math.cos(a - 0.05) * len)
        b.lineTo(sunX + Math.sin(a + 0.05) * len, 20 + Math.cos(a + 0.05) * len)
        b.closePath()
        b.fill()
      }
      b.restore()
    }

    this.clouds?.draw(b, this.viewW, this.viewH, this.t, cx)

    const lh = w.rows * T
    // katmanların tabanı bölümün zemin çizgisine (satır 20) oturur, dikeyde parallax
    const camRef = camYRange(lh, this.viewW, this.viewH)[1]
    const layerY = (f: number) => Math.round(GROUND_Y - camRef - (cy - camRef) * f) - LAYER_H + 22
    if (s.sun) {
      const sunX = this.viewW * s.sun.x
      const sunY = layerY(0.05) + LAYER_H * 0.2 + s.sun.y * 60
      const r = Math.round(s.sun.r * 0.6)
      disc(b, sunX, sunY, r + 7, s.sun.glow)
      disc(b, sunX, sunY, r + 3, s.sun.glow)
      disc(b, sunX, sunY, r, s.sun.color)
      if (this.city === 'bayburt') disc(b, sunX + 3, sunY - 2, r - 1, s.sky[0])
    }

    // parallax katmanlar
    if (this.layers) {
      // katmanlar kesirli konuma, yumuşak örneklenerek çizilir: tam piksele yuvarlanınca kamera kesirli kayarken her
      // katman 4-5 ekran pikseli adımlarla ve farklı hızlarda zıplıyordu, zemin pürüzsüz aktığı için ekran sallanıyor
      // gibi görünüyordu (25 Kasım 2026). Tampon ekrana (hdX - cx) kadar ötelenerek basıldığından o pay eklenir
      const fx = hdX - cx
      const fyOff = hdY - cy
      b.imageSmoothingEnabled = true
      const drawLayer = (cv: HTMLCanvasElement, f: number, fy: number) => {
        const y = GROUND_Y - camRef - (hdY - camRef) * fy - LAYER_H + 22 + fyOff
        let x = -((hdX * f) % LAYER_W) + fx
        if (x > 0) x -= LAYER_W
        for (; x < this.viewW; x += LAYER_W) b.drawImage(cv, x, y)
        if (y + LAYER_H < this.viewH) {
          b.fillStyle = cv === this.layers!.near ? s.near : cv === this.layers!.mid ? s.mid : s.far
          b.fillRect(0, y + LAYER_H, this.viewW, this.viewH - y - LAYER_H)
        }
      }
      drawLayer(this.layers.far, 0.12, 0.08)
      // hava perspektifi: uzak katman gökyüzünün rengine yaslanır
      b.fillStyle = hexA(s.sky[2], 0.07)
      b.fillRect(0, 0, this.viewW, this.viewH)
      if (this.city === 'istanbul') this.drawBosphorus(b, layerY(0.13) + LAYER_H - 70, cx)
      drawLayer(this.layers.mid, 0.25, 0.18)
      b.fillStyle = hexA(s.sky[2], 0.04)
      b.fillRect(0, 0, this.viewW, this.viewH)
      drawLayer(this.layers.near, 0.45, 0.32)
      b.imageSmoothingEnabled = false
    }

    this.drawAmbient(b, dt, cx, cy, w)

    // dünya, arka: süsler zeminin arkasında kalır
    this.lamps.length = 0
    b.save()
    b.translate(-cx, -cy)
    if (w.hasTide) this.drawTideBeds(b, w, cx)
    if (w.level.indoor) this.drawInterior(b, w, cx)
    this.drawDecor(b, w, cx, cy)
    b.restore()

    // gece-gündüz şehirlerinde düğme geceyi getirir: gök kararır, yıldızlar çıkar
    const night = SWITCH_SKIN[this.city] === 'daynight' && w.switchOn
    this.nightK += ((night ? 1 : 0) - this.nightK) * Math.min(1, dt * 5)
    if (this.nightK > 0.01) {
      b.fillStyle = `rgba(16,20,56,${(0.55 * this.nightK).toFixed(3)})`
      b.fillRect(0, 0, this.viewW, this.viewH)
      b.fillStyle = `rgba(255,255,240,${(0.9 * this.nightK).toFixed(3)})`
      for (let i = 0; i < 40; i++) b.fillRect((i * 97 + 13) % this.viewW, (i * 53 + 7) % Math.round(this.viewH * 0.55), 1, 1)
    }

    const c = this.ctx
    // arka tampon yumuşak büyütülür: piksel katmanlar boya gibi yumuşar, uzak plan hafifçe odak dışında kalır
    c.imageSmoothingEnabled = this.tier === 2
    c.imageSmoothingQuality = 'medium'
    c.drawImage(this.buf, 0, 0, this.viewW, this.viewH, -offX, -offY, this.viewW * this.scale, this.viewH * this.scale)

    // zemin ve duvarlar: ekran çözünürlüğünde, elle çizilmiş
    if (!this.terrain || this.world !== w) {
      this.world = w
      this.terrain = new TerrainHD(w, this.city, this.scale, this.hiddenSpikes)
      this.terrain.prime(hdX, hdY, this.canvas.width, this.canvas.height)
    }
    this.terrain.draw(c, hdX, hdY, this.canvas.width, this.canvas.height)
    if (this.ghostGround) this.drawFog(w, hdX, hdY)

    // dünya, ön: su, hareketli nesneler, canlılar, parçacıklar
    f.clearRect(0, 0, this.viewW, this.viewH)
    f.save()
    f.translate(-cx, -cy)
    this.drawUnderground(f, w, cx, cy)
    this.drawDynamicTiles(f, w, cx, cy)
    this.drawCrumbles(f, w, cx, cy)
    if (w.hasLift) this.drawLift(f, w, cx, cy)
    this.drawWater(f, w, cx, cy)
    if (w.hasFrost) this.drawFrost(f, w, cx, cy)
    if (w.hasTide) this.drawTide(f, w, cx)
    this.drawEntities(f, w)
    this.drawGhostRun(w)
    this.drawPlayer(w, dt)
    this.drawPartner(w)
    this.drawParticles(f, dt)
    for (const m of this.deathMarks) {
      const x = Math.round(m.x)
      const y = Math.round(m.y)
      for (let k = -3; k <= 3; k++) {
        rect(f, x + k, y + k, 1, 1, cbc('#e5484d'))
        rect(f, x + k, y - k, 1, 1, cbc('#e5484d'))
      }
    }
    f.restore()

    // fırtına / rüzgâr çizgileri önde
    if (this.city === 'bayburt' || w.level.wind) this.drawWind(f, w)

    if (this.flash > 0) {
      // parıltı birden sönmez, kısa sürede solar (art arda dash'te göz kırpması gibi yanıp sönmesin)
      // 26 Kasım 2026: çok kısık (en çok %4): yanıp sönen tam ekran ışık göz yoruyordu
      f.fillStyle = `rgba(255,255,255,${Math.min(0.04, this.flash * 0.4).toFixed(3)})`
      this.flash -= dt
      f.fillRect(0, 0, this.viewW, this.viewH)
    }

    // Van gölünün canavarı ön tampondan (su) önce: su gövdesinin altını örter, hörgüçler sudan çıkar
    if (this.lakeRuns.length) this.drawLakeMonster(hdX, hdY)
    // atmosferin ışık örtüsü (ışık, ılık ton, vinyet, fener halesi) düşük çözünürlükte kurulur; temel kademede ön
    // tampona biner (ek tam ekran karışım yok), zengin kademede karakterlerin de üstüne tam çözünürlükte basılır
    if (this.atmo) {
      this.atmo.light(this.viewW, this.viewH, this.t, this.nightK, this.lamps)
      if (this.tier < 2) {
        this.atmo.overlay(f, this.viewW, this.viewH)
      }
    }
    c.imageSmoothingEnabled = false
    c.drawImage(this.fbuf, 0, 0, this.viewW, this.viewH, -offX, -offY, this.viewW * this.scale, this.viewH * this.scale)

    this.drawRopesHD(w, hdX, hdY)
    this.drawThingsHD(w, hdX, hdY)
    this.drawCratesHD(w, hdX, hdY)
    this.drawBossHD(w, hdX, hdY)
    if (w.chaser) this.drawChaserHD(w, hdX, hdY, alpha)
    this.drawHeroes(hdX, hdY)
    if (this.dashMeter) this.drawDashMeter(w, hdX, hdY)
    this.drawBreath(w, hdX, hdY)
    this.drawSwimHD(w, hdX, hdY)
    // ışık, renk tonu, süzülenler ve vinyet: dünyanın üstünde, yazıların altında
    if (this.atmo) {
      if (this.tier === 2) this.atmo.overlay(this.ctx, this.canvas.width, this.canvas.height)
      this.atmo.front(this.ctx, this.canvas.width, this.canvas.height, this.t, hdX, hdY, this.scale, this.dpr, this.nightK, this.tier === 2)
    }
    if (this.dark) this.drawDarkness(w, hdX, hdY)
    this.drawLabels(w, hdX, hdY)
    unblend()
    setPainted(true)
    // kademe sayfa başına bir kez, ilk yarım saniyeden sonra (arka tampon dolu) ölçülür
    if (Renderer.probed === null) this.probeTier()
    else this.tier = Renderer.probed
    this.judgeTier()
  }

  /**
   * Kalite kademesi (25 Kasım 2026): boyalı görünümün pahalı iki parçası (arka planı yumuşak büyütmek, tam
   * çözünürlükte ışık örtüsü ve ılık yumuşak ışık) yalnız boyamayı rahat yapan cihazda açılır: 1 temel (her cihaz),
   * 2 zengin. Karar bir kez verilir (`probeTier`: yazılımla boyayan tarayıcı temel, GPU'lu cihaz zengin). Zengin kademede
   * kare aralığı 2 sn boyunca ortalama 25 ms'yi aşarsa kademe iner ve o sayfada bir daha çıkmaz.
   */
  private tier: 1 | 2 = 1
  private tierSum = 0
  /** şehrin yüklendiği an (kademe yargısı ilk saniyeleri saymaz) */
  private levelAt = 0
  private tierN = 0

  private probeTier() {
    // tanıtım görselleri (şehir kartı, README) yazılımla boyayan tarayıcıda çekilir: `?zengin` zengin kademeyi zorlar
    if (typeof location !== 'undefined' && /[?&]zengin\b/.test(location.search)) {
      this.tier = Renderer.probed = 2
      Renderer.forced = true
      return
    }
    // GPU'su olan her cihaz zengin kademeyle başlar; yalnız yazılımla boyayan tarayıcı (SwiftShader, llvmpipe) temel
    // kademede kalır. Eskiden tam ekran çizim + piksel okumasıyla ölçülüyordu: piksel okuma GPU'lu cihazda da birkaç ms
    // tutuyor, güçlü Mac'ler bile temel kademeye düşüp arka planı keskin piksel ve titreşimli görüyordu (25 Kasım 2026).
    // Gerçekten zorlanan cihaz `judgeTier` ile iner
    let soft = true
    try {
      const gl = document.createElement('canvas').getContext('webgl')
      const info = gl?.getExtension('WEBGL_debug_renderer_info')
      const name = gl ? String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER)) : ''
      soft = !gl || /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name)
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      soft = true
    }
    Renderer.probed = soft ? 1 : 2
    this.tier = Renderer.probed
  }

  /** sayfa başına bir kez ölçülen kademe (null: henüz ölçülmedi) */
  private static probed: 1 | 2 | null = null
  /** `?zengin` ile zorlandı: kare aralığına bakılıp inilmez */
  private static forced = false

  private judgeTier() {
    // şehir yüklendikten sonraki ilk 3 sn sayılmaz (zemin önbelleği ısınırken kareler doğal olarak ağır)
    if (this.tier < 2 || Renderer.forced || this.t - this.levelAt < 3) return
    this.tierSum += this.frameDt
    this.tierN++
    if (this.tierSum < 2) return
    const slow = this.tierSum / this.tierN > 0.025
    this.tierSum = this.tierN = 0
    if (slow) {
      this.tier = 1
      Renderer.probed = 1
    }
  }


  private drawBosphorus(b: Ctx, y: number, cx: number) {
    const s = CITY.istanbul
    rect(b, 0, y, this.viewW, this.viewH, s.water[1])
    for (let i = 0; i < 40; i++) {
      const wx = ((i * 53 - cx * 0.2 + Math.sin(this.t * 0.8 + i) * 6) % this.viewW + this.viewW) % this.viewW
      rect(b, wx, y + 4 + ((i * 7) % 40), 6 + (i % 4) * 3, 1, 'rgba(255,200,150,0.35)')
    }
    // vapur
    const fx = ((this.t * 9 - cx * 0.2) % (this.viewW + 200) + this.viewW + 200) % (this.viewW + 200) - 100
    const fy = y + 14
    rect(b, fx, fy, 34, 5, '#f4efe6')
    rect(b, fx + 2, fy + 5, 30, 2, '#2a2236')
    rect(b, fx + 6, fy - 5, 20, 5, '#f4efe6')
    for (let i = 0; i < 4; i++) rect(b, fx + 8 + i * 4, fy - 4, 2, 2, '#4a6a8a')
    rect(b, fx + 14, fy - 11, 3, 6, '#2a2236')
    rect(b, fx + 14, fy - 11, 3, 2, '#e8794a')
  }

  private drawAmbient(b: Ctx, dt: number, cx: number, cy: number, w: World) {
    const s = CITY[this.city]
    const W = this.viewW
    const Hh = this.viewH
    const wind = w.windNow
    if (this.city === 'mardin') {
      // damların üstünde dönen güvercin sürüsü
      const ox = W * 0.62 - cx * 0.05
      for (let i = 0; i < 9; i++) {
        const a = this.t * 0.6 + i * 0.7
        const gx = ox + Math.cos(a) * (40 + (i % 3) * 8)
        const gy = 46 + Math.sin(a) * 14 + (i % 2) * 4
        const up = Math.sin(this.t * 10 + i) > 0
        rect(b, gx - 2, gy - (up ? 1 : 0), 2, 1, '#4a3a4a')
        rect(b, gx, gy, 1, 1, '#4a3a4a')
        rect(b, gx + 1, gy - (up ? 1 : 0), 2, 1, '#4a3a4a')
      }
    }
    if (this.city === 'corum') {
      // ovanın üstünde süzülen kartal
      const a = this.t * 0.25
      const ex = W * 0.4 + Math.cos(a) * 90 - (cx * 0.05) % 40
      const ey = 40 + Math.sin(a * 2) * 10
      rect(b, ex - 7, ey, 6, 1, '#3a2a24')
      rect(b, ex + 2, ey, 6, 1, '#3a2a24')
      rect(b, ex - 1, ey - 1, 3, 2, '#3a2a24')
      rect(b, ex - 8, ey + 1, 2, 1, '#3a2a24')
      rect(b, ex + 7, ey + 1, 2, 1, '#3a2a24')
    }
    if (s.weather === 'gulls') {
      for (let i = 0; i < 5; i++) {
        const gx = ((i * 137 + this.t * (12 + i * 3) - cx * 0.3) % (W + 40) + W + 40) % (W + 40) - 20
        const gy = 30 + ((i * 41) % 60) + Math.sin(this.t * 1.5 + i) * 4
        const flap = Math.sin(this.t * 8 + i) > 0
        rect(b, gx, gy, 2, 1, '#f4f0e6')
        rect(b, gx + 3, gy, 2, 1, '#f4f0e6')
        rect(b, gx + 2, gy + 1, 1, 1, '#f4f0e6')
        if (flap) {
          rect(b, gx - 1, gy - 1, 1, 1, '#f4f0e6')
          rect(b, gx + 5, gy - 1, 1, 1, '#f4f0e6')
        }
      }
      return
    }
    // kar, yaprak, taç yaprağı ve toz artık atmosferde (ekran çözünürlüğünde, üç derinlikte) süzülür
    if (s.weather !== 'rain' && s.weather !== 'storm') return
    for (const a of this.ambient) {
      a.phase += dt
      const rain = s.weather === 'rain'
      a.vx = rain ? -30 : -90 - a.size * 40 + wind * 0.2
      a.vy = rain ? 180 + a.size * 40 : 30 + a.size * 10
      a.x += a.vx * dt
      a.y += a.vy * dt
      const px = (((a.x - cx * 0.6) % W) + W) % W
      const py = (((a.y - cy * 0.6) % Hh) + Hh) % Hh
      if (rain) rect(b, px, py, 1, 4 + a.size * 2, 'rgba(190,215,235,0.55)')
      else rect(b, px, py, a.size, a.size, 'rgba(255,255,255,0.8)')
    }
    if (s.weather === 'storm') {
      // ikinci, daha yoğun kar katmanı
      for (let i = 0; i < 90; i++) {
        const px = ((((i * 97 - this.t * (160 + (i % 5) * 30)) % W) + W) % W)
        const py = (((i * 61 + this.t * (40 + (i % 3) * 12)) % Hh) + Hh) % Hh
        rect(b, px, py, i % 7 === 0 ? 2 : 1, 1, 'rgba(235,240,255,0.7)')
      }
    }
  }

  private drawWind(b: Ctx, w: World) {
    const strength = Math.abs(w.windNow) / 210
    b.fillStyle = `rgba(230,236,255,${0.12 + strength * 0.2})`
    for (let i = 0; i < 14; i++) {
      const len = 10 + (i % 4) * 8
      const x = ((((i * 131 - this.t * (220 + i * 10)) % (this.viewW + 60)) + this.viewW + 60) % (this.viewW + 60)) - 30
      const y = (i * 53) % this.viewH
      b.fillRect(Math.round(x), y, Math.round(len * (0.4 + strength)), 1)
    }
  }

  private drawDecor(b: Ctx, w: World, cx: number, cy: number) {
    const s = CITY[this.city]
    for (const d of w.decor) {
      const x = d.tx * T
      const y = d.ty * T
      if (x < cx - 48 || x > cx + this.viewW + 48 || y < cy - 48 || y > cy + this.viewH + 48) continue
      // otelin içinde sokak feneri ve ağaç olmaz (duvarda lamba var)
      if (w.level.indoor && (d.ch === 'l' || d.ch === 't') && this.roomOf(w).top[d.tx] >= 0) continue
      const bot = y + T
      switch (d.ch) {
        case 'l': {
          // sokak feneri: ayak, direk, camlı fener, şapka; bayrak direğiyle (kırmızı bez, altın topuz) karışmasın
          const K = '#2a2236'
          this.lamps.push(x + 8 - cx, bot - 35 - cy)
          disc(b, x + 8, bot - 35, 13, 'rgba(255,210,120,0.09)')
          disc(b, x + 8, bot - 35, 8, 'rgba(255,210,120,0.12)')
          rect(b, x + 5, bot - 2, 6, 2, K)
          rect(b, x + 7, bot - 31, 2, 29, K)
          rect(b, x + 6, bot - 14, 4, 1, K)
          rect(b, x + 5, bot - 32, 6, 1, K)
          // cam: koyu çerçeve, sıcak ışık, ortada ince kayıt
          rect(b, x + 4, bot - 39, 8, 7, K)
          rect(b, x + 5, bot - 38, 6, 5, '#ffd27a')
          rect(b, x + 5, bot - 38, 2, 5, '#fff0b8')
          rect(b, x + 8, bot - 38, 1, 5, '#c9902e')
          // şapka ve tepe topuzu
          rect(b, x + 3, bot - 40, 10, 1, K)
          rect(b, x + 4, bot - 41, 8, 1, K)
          rect(b, x + 6, bot - 42, 4, 1, K)
          rect(b, x + 7, bot - 44, 2, 2, K)
          break
        }
        case 't': {
          if (this.city === 'izmir' || this.city === 'adana') {
            for (let i = 0; i < 26; i++) rect(b, x + 7 + Math.round(Math.sin(i / 9) * 2), bot - i, 2, 1, '#6a4a30')
            for (const [dx, dy] of [[-1, 0], [1, 0], [-1, 0.6], [1, 0.6], [-0.3, -0.7], [0.3, -0.7]] as const)
              for (let k = 0; k < 10; k++) rect(b, x + 8 + dx * k, bot - 26 + dy * k + (k * k) / 22, 2, 1, '#3f7a3a')
          } else if (this.city === 'sivas' || this.city === 'bayburt' || this.city === 'ardahan') {
            for (let i = 0; i < 26; i++) {
              const hw = Math.floor((i / 26) * 9)
              rect(b, x + 8 - hw, bot - 30 + i, hw * 2 + 1, 1, '#2f4a3e')
              if (i % 6 === 2) rect(b, x + 8 - hw, bot - 30 + i, hw * 2 + 1, 1, '#e8f0fa')
            }
            rect(b, x + 7, bot - 4, 3, 4, '#3b2a1e')
          } else {
            rect(b, x + 6, bot - 14, 4, 14, '#5a3c26')
            disc(b, x + 8, bot - 22, 10, this.city === 'malatya' ? '#4f8a45' : '#4a6a3a')
            disc(b, x + 5, bot - 24, 5, this.city === 'malatya' ? '#5fa050' : '#567a44')
            if (this.city === 'malatya') for (let i = 0; i < 9; i++) rect(b, x + 1 + ((i * 5) % 14), bot - 30 + ((i * 7) % 14), 2, 2, i % 3 ? '#f39a2e' : '#ffc65a')
          }
          break
        }
        case 'k': {
          this.friends.push({ x: x + 8, bot })
          const pl = w.player
          const near = Math.abs(pl.x + pl.w / 2 - (x + 8)) < 22 && Math.abs(pl.y + pl.h - bot) < 6
          if (near && pl.grounded && Math.abs(pl.vx) < 5 && !pl.dead && this.chance(0.05))
            this.particles.push({ x: x + 6 + Math.random() * 6, y: bot - 12, vx: (Math.random() - 0.5) * 10, vy: -28, life: 1, max: 1, color: '#ff6a8a', size: 2, grav: -10 })
          break
        }
        case 'z':
          this.drawLandmarkProp(b, x, bot)
          break
        case 'q':
          this.drawCityProp(b, x, bot)
          break
        case 'w': {
          rect(b, x + 4, bot - 12, 8, 10, s.tileDark)
          disc(b, x + 8, bot - 12, 4, s.tileDark, true)
          rect(b, x + 5, bot - 11, 6, 8, '#3a2a3a')
          rect(b, x + 7, bot - 14, 2, 11, s.tileDark)
          break
        }
        case 'a': {
          rect(b, x - 6, bot - 22, 28, 22, s.tileDark)
          rect(b, x - 4, bot - 20, 24, 20, s.tile)
          rect(b, x + 1, bot - 12, 14, 12, '#3a2a28')
          disc(b, x + 8, bot - 12, 7, '#3a2a28', true)
          rect(b, x - 4, bot - 21, 24, 2, s.tileLight)
          break
        }
        case 'o': {
          rect(b, x + 1, bot - 10, 14, 10, '#8a5a35')
          rect(b, x + 1, bot - 10, 14, 1, '#b07a48')
          rect(b, x + 1, bot - 5, 14, 1, '#6b4428')
          for (let i = 0; i < 6; i++) disc(b, x + 3 + i * 2, bot - 11, 1, i % 2 ? '#f39a2e' : '#ffb84a')
          break
        }
        case 's':
          this.drawStall(b, x, bot)
          break
        case 'm': {
          // kayısı serme: damda/yerde kurutulan kayısılar
          rect(b, x, bot - 2, T, 2, '#c9a46a')
          for (let i = 0; i < 7; i++) {
            rect(b, x + 1 + i * 2, bot - 3 - (i % 2), 2, 2, i % 3 ? '#e8832a' : '#f4a640')
          }
          break
        }
        case 'b': {
          // direkte Türk bayrağı
          rect(b, x + 3, bot - 34, 1, 34, '#d8d8d8')
          const wave = Math.round(Math.sin(this.t * 4) * 1)
          rect(b, x + 4, bot - 34 + wave * 0, 16, 10, '#e30a17')
          rect(b, x + 20, bot - 33 + wave, 1, 9, '#e30a17')
          disc(b, x + 9, bot - 29, 3, '#ffffff')
          disc(b, x + 10, bot - 29, 2, '#e30a17')
          rect(b, x + 13, bot - 30, 1, 3, '#ffffff')
          rect(b, x + 12, bot - 29, 3, 1, '#ffffff')
          break
        }
        default:
          break
      }
    }
    // tabelalar
    for (const sg of w.signs) {
      const x = sg.x
      const bot = sg.y + T
      rect(b, x + 7, bot - 10, 2, 10, '#5a3c26')
      rect(b, x + 1, bot - 16, 14, 9, '#8a5a35')
      rect(b, x + 2, bot - 15, 12, 7, '#c79a62')
      rect(b, x + 7, bot - 14, 2, 3, '#3a2a1e')
      rect(b, x + 7, bot - 10, 2, 1, '#3a2a1e')
      if (w.nearSign === sg.index) rect(b, x + 1, bot - 17, 14, 1, '#ffd36a')
    }
    // şehir insanları
    w.npcs.forEach((n, i) => {
      const look = w.level.npcs[i]?.look ?? 'amca'
      // oyuncuya döner; hafifçe nefes alır
      const br = 2 + 4 * (0.5 + 0.5 * Math.sin(this.t * 2.2 + i * 1.7))
      const pose: Pose = { ...POSES.idle, legs: [[POSES.idle.legs[0][0], POSES.idle.legs[0][1] + br - 2], [POSES.idle.legs[1][0], POSES.idle.legs[1][1] + br - 2]], blink: (this.t + i * 1.3) % 3.8 < 0.12 }
      this.heroes.push({ look, pose, x: n.x + T / 2, y: n.y + T, flip: w.player.x < n.x, alpha: 1, ghost: false, moving: false, sx: 1, sy: 1, size: NPC_SIZE, cache: i })
      // "konuşacak" işareti; konuşma açıkken baloncuk kendisi görünür, işaret çekilir
      const near = w.nearNpc === i
      if (near && this.dialog?.kind === 'npc') return
      const by = n.y + T - NPC_SIZE - 10 - (near ? 0 : Math.round(Math.sin(this.t * 3 + i)))
      rect(b, n.x + 3, by, 10, 7, near ? '#ffd36a' : '#f4ead8')
      rect(b, n.x + 6, by + 7, 2, 2, near ? '#ffd36a' : '#f4ead8')
      for (let d = 0; d < 3; d++) rect(b, n.x + 5 + d * 2, by + 3, 1, 1, '#2a2236')
    })
  }

  /** Horon ve koçari halkası: kol kola oyuncular, eller yukarıda kenetli; oyuncu ellerin üstüne basar */
  private drawHoron(b: Ctx, pl: { x: number; y: number; w: number; max: number; dance?: 'horon' | 'kocari' }) {
    const kocari = pl.dance === 'kocari'
    const lift = pl.max - pl.y
    const n = Math.max(2, Math.round(pl.w / 11))
    const step = pl.w / n
    const shimmy = kocari ? 0 : Math.round(Math.sin(this.t * 40) * 0.6)
    const skin = '#e0a880'
    for (let i = 0; i < n; i++) {
      const dx = Math.round(pl.x + i * step + step / 2 - 4 + (i % 2 ? shimmy : -shimmy))
      const top = pl.y + 5
      // kollar: omuzdan kenetli ellere
      rect(b, dx, top + 1, 1, 6, kocari ? '#f4ead8' : '#1d1a22')
      rect(b, dx + 8, top + 1, 1, 6, kocari ? '#f4ead8' : '#1d1a22')
      rect(b, dx, pl.y + 2, 1, 2, skin)
      rect(b, dx + 8, pl.y + 2, 1, 2, skin)
      // baş: horoncuda siyah kolay, koçaride renkli puşi
      rect(b, dx + 2, top + 1, 5, 5, skin)
      if (kocari) {
        rect(b, dx + 1, top, 7, 2, i % 2 ? '#d6403a' : '#3f8f5a')
        rect(b, dx + 2, top + 2, 5, 1, '#f2c14e')
      } else rect(b, dx + 2, top, 5, 2, '#1a1418')
      rect(b, dx + 3, top + 3, 1, 1, '#1d1a22')
      rect(b, dx + 5, top + 3, 1, 1, '#1d1a22')
      // gövde
      if (kocari) {
        rect(b, dx + 1, top + 6, 7, 11, '#f4ead8')
        rect(b, dx + 2, top + 6, 5, 9, '#a8302a')
        rect(b, dx + 4, top + 7, 1, 7, '#f2c14e')
        rect(b, dx + 1, top + 14, 7, 2, '#3a2a24')
      } else {
        rect(b, dx + 1, top + 6, 7, 11, '#1d1a22')
        rect(b, dx + 3, top + 8, 3, 1, '#c8d0dc')
        rect(b, dx + 3, top + 10, 3, 1, '#c8d0dc')
        rect(b, dx + 1, top + 14, 7, 1, '#c8a050')
      }
      // bacaklar: horonda kesik kesik titrer, koçaride yere ağır vurur
      const up = lift > 6
      const l1 = kocari ? (up ? 3 : 0) : up ? 2 : 0
      const l2 = kocari ? 0 : up ? 0 : 2
      rect(b, dx + 2, top + 17, 2, 8 - l1, '#2a2a36')
      rect(b, dx + 5, top + 17, 2, 8 - l2, '#2a2a36')
      rect(b, dx + 1, top + 25 - l1, 3, 1, '#0d0b10')
      rect(b, dx + 5, top + 25 - l2, 3, 1, '#0d0b10')
    }
    // kenetli eller: ince halka, düğüm yerlerinde ten rengi
    rect(b, pl.x, pl.y, pl.w, 2, kocari ? '#f4ead8' : '#2a2430')
    for (let i = 0; i <= n; i++) rect(b, Math.round(pl.x + i * step - 1), pl.y, 3, 2, skin)
    // yere vuruşta toz
    if (lift < 1 && kocari && this.chance(0.3)) this.particles.push({ x: pl.x + Math.random() * pl.w, y: pl.max + 30, vx: (Math.random() - 0.5) * 30, vy: -20, life: 0.3, max: 0.3, color: 'rgba(200,190,170,0.7)', size: 1, grav: 60 })
    rect(b, pl.x + 2 + lift / 4, pl.max + 30, pl.w - 4 - lift / 2, 1, 'rgba(0,0,0,0.35)')
  }

  /** Kapadokya balonu: sepet platform, üstünde renkli zarf; yükselirken alev yanar */
  private drawBalloon(b: Ctx, pl: { x: number; y: number; w: number; dy: number }) {
    const cx = pl.x + pl.w / 2
    const top = pl.y - 46
    const cols = ['#e8604a', '#f2c14e', '#3fa8c8', '#f4ead8']
    for (let yy = 0; yy < 30; yy++) {
      const t = yy / 30
      const hw = Math.round(Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.62 + 0.25) * 16)
      for (let xx = -hw; xx <= hw; xx++) {
        const band = Math.floor(((xx + hw) / (hw * 2 + 1)) * 5)
        rect(b, cx + xx, top + yy, 1, 1, cols[band % cols.length])
      }
      rect(b, cx - hw, top + yy, 1, 1, 'rgba(0,0,0,0.25)')
      rect(b, cx + hw, top + yy, 1, 1, 'rgba(0,0,0,0.35)')
    }
    rect(b, cx - 6, top + 30, 12, 2, '#a84a2a')
    // ipler
    for (const dx of [-6, 5]) for (let yy = top + 32; yy < pl.y; yy += 2) rect(b, cx + dx + (dx < 0 ? (yy - top - 32) / 6 : -(yy - top - 32) / 6), yy, 1, 1, '#5a3c26')
    // sepet
    rect(b, pl.x + 2, pl.y, pl.w - 4, 7, '#8a5a35')
    rect(b, pl.x + 2, pl.y, pl.w - 4, 1, '#b07a48')
    for (let i = pl.x + 4; i < pl.x + pl.w - 3; i += 3) rect(b, i, pl.y + 2, 1, 4, '#6b4428')
    if (pl.dy < -0.05) {
      rect(b, cx - 1, top + 32, 3, 3, '#ffd36a')
      rect(b, cx, top + 31, 1, 2, '#ffffff')
    }
  }

  /** Şehrin tezgâhı: simit arabası, mırra, kayısı, leblebi kazanı, Sivas halısı, saman ve kopuz */
  private drawStall(b: Ctx, x: number, bot: number) {
    switch (this.city) {
      case 'edirne': {
        // tava ciğeri tezgâhı: kazan, ipe dizili kuru biberler
        rect(b, x - 4, bot - 9, 26, 9, '#6a4a32')
        rect(b, x - 6, bot - 12, 30, 3, '#d8ccb4')
        rect(b, x, bot - 18, 12, 6, '#3a3440')
        rect(b, x, bot - 18, 12, 1, '#6a6474')
        for (let i = 0; i < 4; i++) rect(b, x + 2 + i * 2, bot - 20, 2, 2, '#8a4a24')
        rect(b, x - 6, bot - 26, 32, 1, '#6a4a32')
        for (let i = 0; i < 7; i++) rect(b, x - 4 + i * 4, bot - 25, 2, 4, i % 2 ? '#c8302a' : '#a8201c')
        rect(b, x - 6, bot - 26, 1, 14, '#6a4a32')
        rect(b, x + 25, bot - 26, 1, 14, '#6a4a32')
        break
      }
      case 'bursa': {
        // İskender tezgâhı: dikey döner, bakır tabak
        rect(b, x - 4, bot - 9, 26, 9, '#5e4634')
        rect(b, x - 6, bot - 12, 30, 3, '#c8743a')
        rect(b, x + 3, bot - 26, 2, 14, '#8a8e98')
        for (let i = 0; i < 5; i++) rect(b, x + 1 - (i < 2 ? i : 4 - i), bot - 24 + i * 2, 6 + (i < 2 ? i : 4 - i) * 2, 2, i % 2 ? '#8a4a24' : '#a8602e')
        disc(b, x + 16, bot - 13, 4, '#e8a85a', true)
        rect(b, x + 12, bot - 13, 9, 1, '#f6ecd8')
        rect(b, x - 6, bot - 28, 32, 2, '#3a7a5a')
        rect(b, x - 6, bot - 26, 1, 14, '#5e4634')
        rect(b, x + 25, bot - 26, 1, 14, '#5e4634')
        break
      }
      case 'antalya': {
        // portakal tezgâhı: piramit dizili portakallar, sıkma makinesi
        rect(b, x - 4, bot - 8, 26, 8, '#7a5234')
        rect(b, x - 6, bot - 11, 30, 3, '#f6ecd8')
        for (const [dx, dy] of [[0, 0], [5, 0], [10, 0], [2, -4], [7, -4], [5, -8]] as const) disc(b, x + dx + 2, bot - 14 + dy, 2, '#f08a2a')
        rect(b, x + 17, bot - 20, 5, 9, '#c8ccd4')
        disc(b, x + 19, bot - 21, 2, '#f08a2a')
        rect(b, x - 6, bot - 27, 32, 2, '#f08a2a')
        rect(b, x - 6, bot - 25, 1, 14, '#7a5234')
        rect(b, x + 25, bot - 25, 1, 14, '#7a5234')
        break
      }
      case 'sanliurfa': {
        // çiğ köfte sinisi ve mırra cezvesi
        rect(b, x - 4, bot - 8, 26, 8, '#6a4a32')
        rect(b, x - 6, bot - 10, 30, 2, '#c8743a')
        for (let i = 0; i < 6; i++) rect(b, x - 3 + i * 4, bot - 12, 3, 2, '#8a3a24')
        rect(b, x + 20, bot - 17, 4, 7, '#b8862a')
        rect(b, x + 24, bot - 15, 3, 1, '#b8862a')
        rect(b, x - 6, bot - 26, 32, 2, '#c8302a')
        for (let i = 0; i < 8; i++) rect(b, x - 5 + i * 4, bot - 24, 2, 2, '#f2c14e')
        rect(b, x - 6, bot - 24, 1, 14, '#6a4a32')
        rect(b, x + 25, bot - 24, 1, 14, '#6a4a32')
        break
      }
      case 'rize': {
        // çay ocağı: tezgâhta ince belli bardaklar, köşede pirinç semaver, yeşil beyaz tente
        rect(b, x - 4, bot - 9, 26, 9, '#6a4a32')
        rect(b, x - 4, bot - 9, 26, 1, '#8e6a4a')
        rect(b, x - 6, bot - 11, 30, 2, '#f4ead8')
        for (let i = 0; i < 4; i++) {
          rect(b, x - 3 + i * 4, bot - 15, 3, 4, '#c0301e')
          rect(b, x - 3 + i * 4, bot - 15, 3, 1, '#f4f8fa')
          rect(b, x - 2 + i * 4, bot - 13, 1, 1, '#8a1e12')
          rect(b, x - 4 + i * 4, bot - 11, 5, 1, '#d8dce4')
        }
        rect(b, x + 15, bot - 21, 7, 10, '#c8683a')
        rect(b, x + 15, bot - 21, 2, 10, '#e08a5a')
        rect(b, x + 15, bot - 17, 7, 1, '#e8b84a')
        rect(b, x + 14, bot - 12, 9, 1, '#d8a83a')
        rect(b, x + 22, bot - 16, 2, 1, '#d8a83a')
        rect(b, x + 16, bot - 24, 5, 3, '#f8f6f0')
        rect(b, x + 17, bot - 23, 1, 1, '#3a8ac8')
        rect(b, x + 18, bot - 28 - Math.round(Math.sin(this.t * 3)), 1, 3, 'rgba(255,255,255,0.5)')
        rect(b, x - 6, bot - 30, 1, 19, '#5a3c26')
        rect(b, x + 25, bot - 30, 1, 19, '#5a3c26')
        for (let i = 0; i < 8; i++) {
          const col = i % 2 ? '#f4ead8' : '#4a8a4a'
          rect(b, x - 7 + i * 4, bot - 32, 4, 3, col)
          rect(b, x - 6 + i * 4, bot - 29, 2, 1, col)
        }
        break
      }
      case 'artvin': {
        // bal tezgâhı: kavanoz kavanoz bal, süzme petek, üstünde gezinen arı
        rect(b, x - 4, bot - 9, 26, 9, '#6e5038')
        rect(b, x - 4, bot - 9, 26, 1, '#94704e')
        rect(b, x - 6, bot - 11, 30, 2, '#8a6a4a')
        for (let i = 0; i < 4; i++) {
          rect(b, x - 3 + i * 5, bot - 17, 4, 6, '#e8a826')
          rect(b, x - 3 + i * 5, bot - 17, 1, 6, '#f6d06a')
          rect(b, x - 3 + i * 5, bot - 18, 4, 1, i % 2 ? '#c8302a' : '#f4ead8')
        }
        rect(b, x + 17, bot - 16, 7, 5, '#f2b232')
        for (let i = 0; i < 3; i++) rect(b, x + 18 + i * 2, bot - 15 + (i % 2), 1, 1, '#b8761a')
        rect(b, x + 19, bot - 11, 1, 2, '#f2b232')
        const bx = x + 8 + Math.round(Math.sin(this.t * 2.4) * 6)
        const by = bot - 22 + Math.round(Math.sin(this.t * 5) * 1.5)
        rect(b, bx, by, 2, 1, '#f2c14e')
        rect(b, bx + 1, by, 1, 1, '#2a2420')
        rect(b, bx, by - 1, 1, 1, 'rgba(255,255,255,0.7)')
        rect(b, x - 6, bot - 28, 1, 17, '#5a3c26')
        rect(b, x + 25, bot - 28, 1, 17, '#5a3c26')
        rect(b, x - 7, bot - 30, 34, 2, '#6a8a3a')
        rect(b, x - 7, bot - 28, 34, 1, '#4e6a2a')
        break
      }
      case 'kars': {
        // peynir tezgâhı: üst üste gravyer tekerlekleri, biri kesik, delikleri görünür
        rect(b, x - 4, bot - 8, 26, 8, '#6a4c34')
        rect(b, x - 6, bot - 10, 30, 2, '#e6edf6')
        for (const [dx, dy] of [[-3, 0], [6, 0], [1, -5]] as const) {
          rect(b, x + dx, bot - 15 + dy, 9, 5, '#e8c45a')
          rect(b, x + dx, bot - 15 + dy, 9, 1, '#f6dc8a')
          rect(b, x + dx, bot - 11 + dy, 9, 1, '#b88a2a')
        }
        rect(b, x + 16, bot - 15, 7, 5, '#f6d468')
        for (const [dx, dy] of [[17, -14], [20, -12], [18, -11]] as const) rect(b, x + dx, bot + dy, 1, 1, '#c09030')
        rect(b, x + 16, bot - 15, 1, 5, '#c88a2a')
        rect(b, x - 6, bot - 28, 1, 18, '#5a3c26')
        rect(b, x + 25, bot - 28, 1, 18, '#5a3c26')
        rect(b, x - 7, bot - 30, 34, 2, '#c8302a')
        rect(b, x - 7, bot - 31, 34, 1, '#f6f9fd')
        for (let i = 0; i < 8; i++) rect(b, x - 6 + i * 4, bot - 28, 2, 1, '#c8302a')
        break
      }
      case 'bitlis': {
        // büryan kuyusu: taş ağızlı ocak çukuru, kapağından tüten duman; yanında pide tablası
        rect(b, x - 4, bot - 6, 16, 6, '#8a7462')
        rect(b, x - 5, bot - 8, 18, 2, '#a89078')
        for (let i = 0; i < 4; i++) rect(b, x - 3 + i * 4, bot - 5, 1, 4, '#5c4a3e')
        rect(b, x - 1, bot - 10, 10, 2, '#4e3a34')
        rect(b, x + 3, bot - 12, 2, 2, '#4e3a34')
        for (let k = 0; k < 3; k++) {
          const ph = (((this.t * 0.8 + k / 3) % 1) + 1) % 1
          rect(b, x + 3 + Math.round(Math.sin(this.t * 2 + k) * 2), bot - 14 - Math.round(ph * 14), 2 + Math.round(ph * 2), 2, `rgba(220,214,206,${(0.6 * (1 - ph)).toFixed(2)})`)
        }
        rect(b, x + 14, bot - 7, 12, 7, '#6e4c34')
        rect(b, x + 13, bot - 9, 14, 2, '#f4f0e6')
        rect(b, x + 15, bot - 12, 10, 3, '#e8b86a')
        rect(b, x + 16, bot - 14, 7, 2, '#a8542a')
        rect(b, x + 17, bot - 14, 2, 1, '#d88a54')
        break
      }
      case 'giresun': {
        // kiraz tezgâhı: sepet sepet parlak kiraz, kefede yaprak; yeşil beyaz çizgili tente
        rect(b, x - 4, bot - 8, 26, 8, '#6a4a32')
        rect(b, x - 4, bot - 8, 26, 1, '#8e6a4a')
        for (const dx of [-3, 6, 15]) {
          rect(b, x + dx, bot - 13, 8, 5, '#b8884e')
          rect(b, x + dx, bot - 11, 8, 1, '#8a6034')
          for (let i = 0; i < 4; i++) rect(b, x + dx + i * 2, bot - 15 + (i % 2), 2, 2, i % 2 ? '#a81e30' : '#d8283c')
          rect(b, x + dx + 1, bot - 15, 1, 1, '#ff9aa4')
          rect(b, x + dx + 5, bot - 16, 2, 1, '#5a9a3a')
        }
        rect(b, x - 6, bot - 28, 1, 20, '#5a3c26')
        rect(b, x + 25, bot - 28, 1, 20, '#5a3c26')
        for (let i = 0; i < 8; i++) rect(b, x - 7 + i * 4, bot - 31, 4, 3, i % 2 ? '#f4f0e6' : '#3e8a4a')
        for (let i = 0; i < 8; i++) rect(b, x - 6 + i * 4, bot - 28, 2, 1, i % 2 ? '#f4f0e6' : '#3e8a4a')
        break
      }
      case 'tokat': {
        // yazma tezgâhı: ipte köşesinden asılı yazmalar sallanır, tezgâhta katlı yığın ve tahta kalıp
        rect(b, x - 4, bot - 8, 26, 8, '#6a4a32')
        for (const [dy, col] of [[0, '#f4ead8'], [-2, '#2e4a9a'], [-4, '#b8302a']] as const) rect(b, x - 2, bot - 10 + dy, 14, 2, col)
        rect(b, x + 1, bot - 14, 2, 1, '#b8302a')
        rect(b, x + 7, bot - 12, 2, 1, '#f4ead8')
        rect(b, x + 14, bot - 12, 7, 4, '#a8763e')
        rect(b, x + 14, bot - 9, 7, 1, '#2e4a9a')
        rect(b, x + 16, bot - 14, 3, 2, '#8a5a2e')
        rect(b, x - 6, bot - 31, 1, 31, '#5a3c26')
        rect(b, x + 25, bot - 31, 1, 31, '#5a3c26')
        rect(b, x - 6, bot - 31, 32, 1, '#5a3c26')
        for (let i = 0; i < 3; i++) {
          const sw = Math.round(Math.sin(this.t * 1.5 + i * 1.3) * 0.8)
          const cx = x + 1 + i * 9 + sw
          const ground = i === 1 ? '#2e4a9a' : '#f4ead8'
          const print = i === 1 ? '#f4ead8' : '#b8302a'
          // köşesinden asılı kare yemeni: baklava
          for (let k = 0; k < 4; k++) rect(b, cx - k, bot - 30 + k, k * 2 + 1, 1, ground)
          for (let k = 0; k < 4; k++) rect(b, cx - 3 + k, bot - 26 + k, 7 - k * 2, 1, ground)
          rect(b, cx, bot - 27, 1, 1, print)
          rect(b, cx - 2, bot - 26, 1, 1, print)
          rect(b, cx + 2, bot - 26, 1, 1, print)
          rect(b, cx, bot - 25, 1, 1, print)
          rect(b, cx, bot - 22, 1, 2, '#e8d8b0')
          rect(b, cx - 2, bot - 23, 1, 2, '#e8d8b0')
          rect(b, cx + 2, bot - 23, 1, 2, '#e8d8b0')
        }
        break
      }
      case 'aydin': {
        // incir ve zeytinyağı tezgâhı: sepet sepet mor incir, yanında yeşil-altın zeytinyağı şişeleri; mor beyaz çizgili tente
        rect(b, x - 4, bot - 8, 26, 8, '#7a5a38')
        rect(b, x - 4, bot - 8, 26, 1, '#9a7a52')
        for (const dx of [-3, 5]) {
          rect(b, x + dx, bot - 13, 7, 5, '#b8884e')
          rect(b, x + dx, bot - 11, 7, 1, '#8a6034')
          for (let i = 0; i < 3; i++) rect(b, x + dx + i * 2, bot - 15 + (i % 2), 2, 2, i % 2 ? '#6a3a7a' : '#8a5a9a')
          rect(b, x + dx + 2, bot - 16, 2, 1, '#5a9a3a')
        }
        for (const dx of [14, 17, 20]) {
          rect(b, x + dx, bot - 14, 2, 6, '#9ab24a')
          rect(b, x + dx, bot - 14, 1, 6, '#c8d878')
          rect(b, x + dx, bot - 15, 2, 1, '#5a4a2a')
        }
        rect(b, x - 6, bot - 31, 1, 23, '#5a3c26')
        rect(b, x + 25, bot - 31, 1, 23, '#5a3c26')
        for (let i = 0; i < 8; i++) rect(b, x - 7 + i * 4, bot - 32, 4, 3, i % 2 ? '#f4f0e6' : '#7a4a8c')
        for (let i = 0; i < 3; i++) {
          const sw = Math.round(Math.sin(this.t * 1.4 + i * 1.7) * 0.8)
          rect(b, x + 3 + i * 8 + sw, bot - 29, 1, 3, '#4e8a2a')
          rect(b, x + 2 + i * 8 + sw, bot - 26, 3, 3, '#7a4a8c')
        }
        break
      }
      case 'mersin': {
        // tantuni tezgâhı: büyük sacda cızırdayan et, yanında dürülmüş lavaşlar, limon ve maydanoz; tentede portakal
        rect(b, x - 4, bot - 8, 26, 8, '#8a5a32')
        rect(b, x - 4, bot - 8, 26, 1, '#aa7a4e')
        rect(b, x - 2, bot - 11, 13, 3, '#3a3a40')
        rect(b, x - 3, bot - 11, 15, 1, '#5a5a62')
        for (let i = 0; i < 5; i++) rect(b, x + i * 2, bot - 12 + (i % 2), 2, 1, '#9a4a2a')
        const hiss = Math.floor(this.t * 6) % 3
        rect(b, x + 2 + hiss * 2, bot - 15, 1, 2, 'rgba(240,240,240,0.55)')
        rect(b, x + 7 - hiss, bot - 16, 1, 2, 'rgba(240,240,240,0.45)')
        for (let i = 0; i < 3; i++) {
          rect(b, x + 13 + i * 3, bot - 12, 3, 4, '#f2e2b8')
          rect(b, x + 13 + i * 3, bot - 12, 3, 1, '#c8a46a')
        }
        rect(b, x + 13, bot - 14, 2, 2, '#f2dc3a')
        rect(b, x + 16, bot - 14, 3, 2, '#3e8a2e')
        rect(b, x - 6, bot - 31, 1, 23, '#5a3a22')
        rect(b, x + 25, bot - 31, 1, 23, '#5a3a22')
        for (let i = 0; i < 8; i++) rect(b, x - 7 + i * 4, bot - 32, 4, 3, i % 2 ? '#f4f0e6' : '#e8582e')
        for (let i = 0; i < 3; i++) {
          const sw = Math.round(Math.sin(this.t * 1.4 + i * 1.7) * 0.8)
          rect(b, x + 3 + i * 8 + sw, bot - 29, 1, 3, '#4e8a2a')
          rect(b, x + 2 + i * 8 + sw, bot - 26, 3, 3, '#f29a2a')
        }
        break
      }
      case 'balikesir': {
        // höşmerimci: tepside altın sarısı höşmerim kâseleri (üstü ceviz), yanında zeytinyağı tenekeleri; zeytin yeşili tente
        rect(b, x - 4, bot - 8, 26, 8, '#7a5a38')
        rect(b, x - 4, bot - 8, 26, 1, '#9a7a52')
        rect(b, x - 3, bot - 10, 15, 2, '#c8ccd4')
        rect(b, x - 3, bot - 10, 15, 1, '#eef0f4')
        for (const dx of [-2, 3, 8]) {
          rect(b, x + dx, bot - 13, 4, 3, '#b8603a')
          rect(b, x + dx, bot - 15, 4, 2, '#f2c24a')
          rect(b, x + dx + 1, bot - 16, 2, 1, '#f2c24a')
          rect(b, x + dx + 1, bot - 15, 1, 1, '#8a5226')
        }
        for (const dx of [14, 19]) {
          rect(b, x + dx, bot - 16, 5, 8, '#c8b048')
          rect(b, x + dx, bot - 16, 1, 8, '#ecd878')
          rect(b, x + dx + 1, bot - 13, 3, 3, '#4e7a3a')
          rect(b, x + dx + 3, bot - 17, 1, 1, '#5a5a5a')
        }
        rect(b, x - 6, bot - 31, 1, 23, '#5a3c26')
        rect(b, x + 25, bot - 31, 1, 23, '#5a3c26')
        for (let i = 0; i < 8; i++) rect(b, x - 7 + i * 4, bot - 32, 4, 3, i % 2 ? '#f4f0e6' : '#5e7a3a')
        for (let i = 0; i < 8; i++) rect(b, x - 6 + i * 4, bot - 29, 2, 1, i % 2 ? '#f4f0e6' : '#5e7a3a')
        break
      }
      case 'afyon': {
        // kaymakçı: tepside kaymak tabakları (rulo kaymak, üstünde bal), bal kavanozları; tentede sucuk dizisi
        rect(b, x - 4, bot - 8, 26, 8, '#7a5236')
        rect(b, x - 4, bot - 8, 26, 1, '#9a7250')
        rect(b, x - 3, bot - 10, 16, 2, '#c8ccd4')
        rect(b, x - 3, bot - 10, 16, 1, '#eef0f4')
        for (const dx of [-2, 3, 8]) {
          rect(b, x + dx - 1, bot - 11, 6, 1, '#f4f6f8')
          rect(b, x + dx - 1, bot - 11, 1, 1, '#4a7ab8')
          rect(b, x + dx + 4, bot - 11, 1, 1, '#4a7ab8')
          rect(b, x + dx, bot - 13, 4, 2, '#fbf3dc')
          rect(b, x + dx, bot - 13, 4, 1, '#f2dfa8')
          rect(b, x + dx + 3, bot - 13, 1, 2, '#e4d4ac')
          rect(b, x + dx + 1, bot - 14, 2, 1, '#f2b42a')
        }
        for (const dx of [15, 20]) {
          rect(b, x + dx, bot - 14, 4, 6, '#f2a82a')
          rect(b, x + dx, bot - 14, 1, 6, '#ffd060')
          rect(b, x + dx, bot - 15, 4, 1, '#d04a3a')
          rect(b, x + dx + 1, bot - 12, 2, 2, '#fff4d8')
        }
        rect(b, x - 6, bot - 31, 1, 23, '#5a3c26')
        rect(b, x + 25, bot - 31, 1, 23, '#5a3c26')
        for (let i = 0; i < 8; i++) rect(b, x - 7 + i * 4, bot - 32, 4, 3, i % 2 ? '#f4f0e6' : '#3ab8c4')
        for (let i = 0; i < 4; i++) {
          const sw = Math.round(Math.sin(this.t * 1.3 + i * 1.5) * 0.7)
          const cx = x + 1 + i * 6 + sw
          rect(b, cx, bot - 29, 1, 1, '#e8dcc0')
          rect(b, cx - 1, bot - 28, 3, 7, '#8a2a24')
          rect(b, cx - 1, bot - 28, 1, 7, '#a8443a')
          rect(b, cx, bot - 21, 1, 1, '#5a1a18')
        }
        break
      }
      case 'bingol': {
        // balcı: rafta altın sarısı bal kavanozları (bez kapaklı), dikili petek çerçeveleri, direkte asılı arıcı şapkası; bal sarısı tente
        rect(b, x - 4, bot - 8, 26, 8, '#7a5234')
        rect(b, x - 4, bot - 8, 26, 1, '#9a7250')
        for (const dx of [-3, 1, 5, 9]) {
          rect(b, x + dx, bot - 12, 3, 4, '#f2b42a')
          rect(b, x + dx, bot - 12, 1, 4, '#ffd870')
          rect(b, x + dx, bot - 13, 3, 1, dx % 2 ? '#d04a3a' : '#f4f0e6')
        }
        rect(b, x - 3, bot - 15, 15, 1, '#6a4a2e')
        for (const dx of [-2, 3, 8]) {
          rect(b, x + dx, bot - 19, 3, 4, '#f2b42a')
          rect(b, x + dx, bot - 19, 1, 4, '#ffd870')
          rect(b, x + dx, bot - 20, 3, 1, '#e8dcc0')
        }
        for (const dx of [14, 19]) {
          rect(b, x + dx, bot - 17, 5, 9, '#8a5a32')
          rect(b, x + dx + 1, bot - 16, 3, 7, '#e8a826')
          for (let k = 0; k < 3; k++) rect(b, x + dx + 1 + (k % 2) * 2, bot - 15 + k * 2, 1, 1, '#ffd060')
        }
        rect(b, x - 6, bot - 31, 1, 23, '#5a3c26')
        rect(b, x + 25, bot - 31, 1, 23, '#5a3c26')
        for (let i = 0; i < 8; i++) rect(b, x - 7 + i * 4, bot - 32, 4, 3, i % 2 ? '#f4f0e6' : '#e8a43a')
        const sw = Math.round(Math.sin(this.t * 1.2) * 0.6)
        rect(b, x + 22 + sw, bot - 28, 7, 1, '#f4f0e6')
        rect(b, x + 23 + sw, bot - 30, 5, 2, '#f4f0e6')
        rect(b, x + 22 + sw, bot - 27, 7, 4, 'rgba(60,60,70,0.55)')
        const bz = this.t * 3
        rect(b, x + 6 + Math.round(Math.cos(bz) * 6), bot - 24 + Math.round(Math.sin(bz * 1.7) * 2), 1, 1, '#2a1a12')
        rect(b, x + 12 + Math.round(Math.sin(bz * 0.8) * 5), bot - 22 + Math.round(Math.cos(bz * 1.3) * 2), 1, 1, '#f2c040')
        break
      }
      case 'elazig': {
        // orcikçi: askıda sallanan kayısı rengi orcik dizileri, tezgâhta kayısı kasaları ve kuru kayısı
        rect(b, x - 4, bot - 8, 26, 8, '#6e4c34')
        rect(b, x - 4, bot - 8, 26, 1, '#8e6a4a')
        for (const dx of [-3, 7]) {
          rect(b, x + dx, bot - 13, 9, 5, '#c89a5a')
          rect(b, x + dx, bot - 11, 9, 1, '#8a6034')
          for (let i = 0; i < 4; i++) rect(b, x + dx + i * 2, bot - 15 + (i % 2), 2, 2, i % 2 ? '#e08a3a' : '#f2a650')
        }
        rect(b, x + 17, bot - 12, 7, 4, '#b07a3e')
        rect(b, x + 18, bot - 13, 5, 1, '#9a5a2e')
        rect(b, x - 6, bot - 31, 1, 31, '#5a3c26')
        rect(b, x + 25, bot - 31, 1, 31, '#5a3c26')
        rect(b, x - 6, bot - 31, 32, 1, '#5a3c26')
        for (let i = 0; i < 5; i++) {
          const sw = Math.round(Math.sin(this.t * 1.3 + i * 1.1) * 0.7)
          const cx = x - 2 + i * 6 + sw
          const len = 9 + (i % 3) * 2
          rect(b, cx, bot - 30, 1, 2, '#e8dcc0')
          rect(b, cx - 1, bot - 28, 3, len, '#d8742a')
          rect(b, cx - 1, bot - 28, 1, len, '#f2a24a')
          for (let k = 3; k < len; k += 3) rect(b, cx - 1, bot - 28 + k, 3, 1, '#a8541c')
          rect(b, cx, bot - 28 + len, 1, 1, '#a8541c')
        }
        break
      }
      case 'karabuk': {
        // safranlı lokum tezgâhı: pudra şekerli lokum küpleri, safran kavanozu, tentede mor-krem şeritler
        rect(b, x - 4, bot - 8, 26, 8, '#7a4e2c')
        rect(b, x - 4, bot - 8, 26, 1, '#9a6e48')
        for (let i = 0; i < 5; i++) {
          rect(b, x - 2 + i * 4, bot - 12, 3, 4, i % 2 ? '#f2c24a' : '#e8a8c0')
          rect(b, x - 2 + i * 4, bot - 12, 3, 1, '#fffaf0')
        }
        rect(b, x + 18, bot - 15, 4, 7, '#d8e4e8')
        rect(b, x + 19, bot - 12, 2, 4, '#e8451c')
        rect(b, x + 18, bot - 16, 4, 1, '#8a5a32')
        rect(b, x - 6, bot - 31, 1, 23, '#5a3a22')
        rect(b, x + 25, bot - 31, 1, 23, '#5a3a22')
        for (let i = 0; i < 8; i++) rect(b, x - 7 + i * 4, bot - 32, 4, 3, i % 2 ? '#f4ecd8' : '#8a52a8')
        for (let i = 0; i < 3; i++) {
          const sw = Math.round(Math.sin(this.t * 1.4 + i * 1.7) * 0.8)
          rect(b, x + 2 + i * 8 + sw, bot - 29, 3, 3, '#8a52a8')
          rect(b, x + 3 + i * 8 + sw, bot - 26, 1, 3, '#e8451c')
        }
        break
      }
      case 'zonguldak': {
        // madenci tezgâhı: tezgâhta lambalı baretler ve kömür sepeti, tentede sallanan madenci lambaları
        rect(b, x - 4, bot - 8, 26, 8, '#5a3e2a')
        rect(b, x - 4, bot - 8, 26, 1, '#7a5a40')
        for (const [dx, col] of [[-3, '#f2c232'], [4, '#f4f2ea']] as const) {
          rect(b, x + dx, bot - 12, 6, 4, col)
          rect(b, x + dx + 1, bot - 13, 4, 1, col)
          rect(b, x + dx - 1, bot - 9, 8, 1, col)
          rect(b, x + dx + 4, bot - 12, 2, 2, '#ffe28a')
        }
        rect(b, x + 12, bot - 13, 9, 5, '#6a4a30')
        rect(b, x + 12, bot - 11, 9, 1, '#4a3220')
        for (let i = 0; i < 4; i++) rect(b, x + 12 + i * 2, bot - 15 + (i % 2), 2, 2, '#1c1c22')
        rect(b, x + 15, bot - 15, 1, 1, '#9aa4c0')
        rect(b, x - 6, bot - 31, 1, 23, '#3a2a1e')
        rect(b, x + 25, bot - 31, 1, 23, '#3a2a1e')
        for (let i = 0; i < 8; i++) rect(b, x - 7 + i * 4, bot - 32, 4, 3, i % 2 ? '#2a2a30' : '#f2a12e')
        for (let i = 0; i < 3; i++) {
          const sw = Math.round(Math.sin(this.t * 1.6 + i * 1.4) * 0.8)
          const lx = x + 1 + i * 8 + sw
          rect(b, lx + 1, bot - 29, 1, 4, '#3a2a1e')
          rect(b, lx, bot - 25, 3, 1, '#c8963a')
          rect(b, lx, bot - 24, 3, 3, '#ffd04a')
          rect(b, lx + 1, bot - 23, 1, 1, '#fff6c0')
          rect(b, lx, bot - 21, 3, 1, '#c8963a')
        }
        break
      }
      case 'denizli': {
        // havlu tezgâhı: üst üste katlı çizgili havlular, askıda sallanan saçaklı peştamallar
        rect(b, x - 4, bot - 8, 26, 8, '#7a5a3e')
        rect(b, x - 4, bot - 8, 26, 1, '#9a7a5a')
        for (const [dy, col, band] of [[0, '#9ad0e8', '#2e6aa0'], [-3, '#fbfaf4', '#d0402a'], [-6, '#f2d27a', '#c8742a']] as const) {
          rect(b, x - 2, bot - 11 + dy, 13, 3, col)
          rect(b, x + 1, bot - 11 + dy, 1, 3, band)
          rect(b, x + 8, bot - 11 + dy, 1, 3, band)
        }
        rect(b, x + 13, bot - 11, 8, 3, '#fbfaf4')
        rect(b, x + 13, bot - 10, 8, 1, '#3a8ac8')
        rect(b, x - 6, bot - 31, 1, 23, '#5a3c26')
        rect(b, x + 25, bot - 31, 1, 23, '#5a3c26')
        rect(b, x - 6, bot - 31, 32, 1, '#5a3c26')
        for (let i = 0; i < 3; i++) {
          const sw = Math.round(Math.sin(this.t * 1.3 + i * 1.6) * 0.7)
          const tx = x - 3 + i * 10 + sw
          const col = ['#fbfaf4', '#5cc8d4', '#e86a5a'][i]
          rect(b, tx, bot - 30, 7, 11, col)
          rect(b, tx, bot - 30, 7, 1, 'rgba(255,255,255,0.6)')
          for (const dy of [-27, -24]) rect(b, tx, bot + dy, 7, 1, i === 0 ? '#3a8ac8' : '#f4f0e6')
          for (let k = 0; k < 4; k++) rect(b, tx + k * 2, bot - 19, 1, 2, '#e8e0d0')
        }
        break
      }
      case 'agri': {
        // kilim tezgâhı: ipte sallanan desenli kilimler, tezgâhta katlı yığın
        rect(b, x - 4, bot - 8, 26, 8, '#6a4a32')
        for (const [dy, col] of [[0, '#b8302a'], [-2, '#2e5a8a'], [-4, '#d8a03a']] as const) {
          rect(b, x - 2, bot - 10 + dy, 22, 2, col)
          rect(b, x + 2, bot - 10 + dy, 2, 1, '#f4ead8')
          rect(b, x + 12, bot - 10 + dy, 2, 1, '#f4ead8')
        }
        rect(b, x - 6, bot - 30, 1, 30, '#5a3c26')
        rect(b, x + 25, bot - 30, 1, 30, '#5a3c26')
        rect(b, x - 6, bot - 30, 32, 1, '#5a3c26')
        for (let i = 0; i < 2; i++) {
          const sw = Math.round(Math.sin(this.t * 1.4 + i * 1.7) * 0.8)
          const kx = x - 2 + i * 14 + sw
          const col = i ? '#2e5a8a' : '#b8302a'
          rect(b, kx, bot - 29, 10, 13, col)
          rect(b, kx + 1, bot - 28, 8, 1, '#f2c14e')
          rect(b, kx + 1, bot - 18, 8, 1, '#f2c14e')
          rect(b, kx + 4, bot - 26, 2, 1, '#f4ead8')
          rect(b, kx + 3, bot - 25, 4, 2, '#f4ead8')
          rect(b, kx + 4, bot - 23, 2, 1, '#f4ead8')
          rect(b, kx + 4, bot - 25, 2, 2, i ? '#b8302a' : '#2e5a8a')
          for (let k = 0; k < 5; k++) rect(b, kx + 1 + k * 2, bot - 16, 1, 2, '#e8d8b0')
        }
        break
      }
      case 'van': {
        // Van kahvaltısı: tabak tabak peynir, bal, kaymak; semaver
        rect(b, x - 4, bot - 8, 26, 8, '#6a4a32')
        rect(b, x - 6, bot - 10, 30, 2, '#f6ecd8')
        for (const [dx, col] of [[-3, '#f8f4e8'], [2, '#e8b84a'], [7, '#6aa84a'], [12, '#e24a48']] as const) {
          rect(b, x + dx, bot - 12, 4, 2, col)
          rect(b, x + dx - 1, bot - 10, 6, 1, '#c8ccd4')
        }
        rect(b, x + 19, bot - 20, 5, 10, '#c8a050')
        rect(b, x + 20, bot - 23, 3, 3, '#a87a30')
        rect(b, x + 21, bot - 26 - Math.round(Math.sin(this.t * 3)), 1, 3, 'rgba(255,255,255,0.5)')
        break
      }
      case 'kayseri': {
        // pastırma askısı: çemenli pastırma ve sucuk dizisi, tezgâhta dilimler
        rect(b, x - 4, bot - 9, 26, 9, '#5e4634')
        rect(b, x - 6, bot - 12, 30, 3, '#e8dcc0')
        for (let i = 0; i < 4; i++) rect(b, x - 2 + i * 5, bot - 14, 4, 2, i % 2 ? '#a8302a' : '#c8402e')
        rect(b, x - 6, bot - 30, 32, 1, '#6a4a32')
        rect(b, x - 6, bot - 30, 1, 18, '#6a4a32')
        rect(b, x + 25, bot - 30, 1, 18, '#6a4a32')
        for (let i = 0; i < 4; i++) {
          const sw = Math.round(Math.sin(this.t * 2 + i) * 0.6)
          rect(b, x - 2 + i * 6 + sw, bot - 29, 1, 2, '#c8b48a')
          rect(b, x - 3 + i * 6 + sw, bot - 27, 4, 9, '#9a2a1e')
          rect(b, x - 3 + i * 6 + sw, bot - 27, 4, 2, '#c87a3a')
          rect(b, x - 3 + i * 6 + sw, bot - 21, 1, 3, '#6e1a14')
        }
        break
      }
      case 'hatay': {
        // künefe tepsisi ve defne sabunu yığını
        rect(b, x - 4, bot - 9, 26, 9, '#6a4a32')
        rect(b, x - 6, bot - 12, 30, 3, '#e8dcc0')
        rect(b, x - 4, bot - 15, 14, 3, '#c8743a')
        rect(b, x - 3, bot - 16, 12, 1, '#f2a43a')
        for (let i = 0; i < 4; i++) rect(b, x - 2 + i * 3, bot - 16, 1, 1, '#6aa840')
        if (Math.sin(this.t * 3) > -0.3) rect(b, x + 2, bot - 20 - Math.round(Math.sin(this.t * 3)), 1, 3, 'rgba(255,255,255,0.5)')
        for (const [dx, dy] of [[13, 0], [18, 0], [15, -3]] as const) {
          rect(b, x + dx, bot - 15 + dy, 5, 3, '#8a9a4a')
          rect(b, x + dx, bot - 15 + dy, 5, 1, '#b0c070')
        }
        break
      }
      case 'amasya': {
        // elma tezgâhı: iki sıra misket elması dolu tahta kasa, yeşil krem çizgili saçaklı tente, sallanan terazi
        rect(b, x - 4, bot - 9, 26, 9, '#7a5234')
        rect(b, x - 4, bot - 9, 26, 1, '#a07a4c')
        for (let i = 0; i < 6; i++) rect(b, x - 4 + i * 5, bot - 8, 1, 8, '#5a3c26')
        rect(b, x - 4, bot - 4, 26, 1, '#5a3c26')
        rect(b, x - 5, bot - 11, 28, 2, '#8a6a4a')
        rect(b, x - 5, bot - 11, 28, 1, '#b08a5a')
        for (let i = 0; i < 8; i++) {
          const al = i % 3 === 1
          disc(b, x - 2 + i * 3, bot - 13, 1, al ? '#d8402e' : '#ecc84e')
          rect(b, x - 3 + i * 3, bot - 14, 1, 1, al ? '#f08a70' : '#fff0b0')
          if (!al) rect(b, x - 1 + i * 3, bot - 13, 1, 1, '#e0603e')
        }
        for (let i = 0; i < 7; i++) {
          disc(b, x - 1 + i * 3, bot - 15, 1, i % 3 ? '#ecc84e' : '#d8402e')
          rect(b, x - 1 + i * 3, bot - 17, 1, 1, '#4e7a3a')
        }
        rect(b, x - 5, bot - 27, 1, 27, '#5a3c26')
        rect(b, x + 22, bot - 27, 1, 27, '#5a3c26')
        rect(b, x - 7, bot - 31, 32, 1, '#2e7a5e')
        for (let i = 0; i < 8; i++) {
          const col = i % 2 ? '#f4ead8' : '#4a9a7a'
          rect(b, x - 7 + i * 4, bot - 30, 4, 4, col)
          rect(b, x - 6 + i * 4, bot - 26, 2, 1, col)
        }
        {
          const sw = Math.round(Math.sin(this.t * 1.6) * 1)
          rect(b, x + 17, bot - 26, 1, 3, '#c8b48a')
          rect(b, x + 14, bot - 23, 7, 1, '#d8b04a')
          rect(b, x + 14, bot - 22, 1, 2 + sw, '#c8b48a')
          rect(b, x + 20, bot - 22, 1, 2 - sw, '#c8b48a')
          rect(b, x + 13, bot - 20 + sw, 3, 1, '#d8b04a')
          rect(b, x + 19, bot - 20 - sw, 3, 1, '#d8b04a')
          rect(b, x + 14, bot - 21 + sw, 1, 1, '#d8402e')
        }
        break
      }
      case 'mugla': {
        // süngerci tezgâhı: mavi beyaz kayık gövdesi, ipe dizili sallanan süngerler, pirinç dalgıç başlığı, direkte begonvil
        rect(b, x - 4, bot - 7, 24, 7, '#3f7fd0')
        rect(b, x - 4, bot - 4, 24, 1, '#2a5ea8')
        rect(b, x - 5, bot - 9, 26, 2, '#f8f5ea')
        rect(b, x - 7, bot - 10, 3, 1, '#f8f5ea')
        rect(b, x - 3, bot - 2, 22, 2, '#2a5ea8')
        rect(b, x + 3, bot - 6, 5, 1, '#f8f5ea')
        disc(b, x, bot - 11, 2, '#e8c66a')
        rect(b, x - 1, bot - 12, 1, 1, '#a87a2a')
        rect(b, x + 1, bot - 10, 1, 1, '#a87a2a')
        disc(b, x + 5, bot - 11, 2, '#d8b04a')
        rect(b, x + 5, bot - 12, 1, 1, '#a87a2a')
        disc(b, x + 14, bot - 13, 3, '#d8a23a')
        rect(b, x + 12, bot - 15, 1, 2, '#f4d27a')
        rect(b, x + 13, bot - 14, 3, 3, '#33465a')
        rect(b, x + 13, bot - 14, 1, 1, '#bfe4f8')
        rect(b, x + 11, bot - 10, 7, 1, '#b07a2a')
        rect(b, x - 5, bot - 28, 1, 28, '#f4f0e4')
        rect(b, x + 20, bot - 28, 1, 28, '#f4f0e4')
        rect(b, x - 6, bot - 27, 28, 1, '#8a6a4a')
        for (let i = 0; i < 5; i++) {
          const sw = Math.round(Math.sin(this.t * 1.8 + i * 1.3) * 0.7)
          const sy = bot - 22 - (i % 2)
          rect(b, x - 1 + i * 5, bot - 26, 1, 2 - (i % 2), '#c8b48a')
          disc(b, x - 1 + i * 5 + sw, sy, 2, i % 2 ? '#e8c66a' : '#d8b04a')
          rect(b, x - 2 + i * 5 + sw, sy - 1, 1, 1, '#fff0b4')
          rect(b, x + i * 5 + sw, sy, 1, 1, '#a87a2a')
        }
        for (const [dx, dy, k] of [[-6, -29, 0], [-4, -30, 1], [-7, -26, 1], [-5, -24, 0], [-3, -28, 0]] as const) rect(b, x + dx, bot + dy, 2, 2, k ? '#ee7ab4' : '#d8408a')
        rect(b, x - 6, bot - 22, 1, 2, '#4e8a3a')
        break
      }
      case 'eskisehir': {
        // çibörek tavası: kızgın yağda yarım ay çibörekler
        rect(b, x - 4, bot - 6, 26, 6, '#5e4634')
        rect(b, x - 2, bot - 11, 22, 5, '#3a3440')
        rect(b, x - 2, bot - 11, 22, 1, '#6a6474')
        rect(b, x - 1, bot - 10, 20, 1, '#e8b84a')
        rect(b, x + 20, bot - 10, 6, 1, '#3a3440')
        for (let i = 0; i < 3; i++) {
          const bob = Math.sin(this.t * 7 + i * 2) > 0 ? 1 : 0
          disc(b, x + 3 + i * 6, bot - 11 - bob, 3, '#e8b456', true)
          rect(b, x + 1 + i * 6, bot - 12 - bob, 1, 1, '#b87628')
        }
        for (let i = 0; i < 2; i++) rect(b, x + 4 + i * 8, bot - 17 - Math.round(Math.sin(this.t * 3 + i)), 1, 3, 'rgba(255,255,255,0.5)')
        break
      }
      case 'erzurum': {
        // cağ kebabı: yatay döner, önünde odun ateşi
        rect(b, x - 4, bot - 6, 26, 6, '#5e4634')
        rect(b, x - 2, bot - 18, 2, 12, '#8a8e98')
        rect(b, x + 20, bot - 18, 2, 12, '#8a8e98')
        rect(b, x - 2, bot - 17, 24, 1, '#8a8e98')
        for (let i = 0; i < 5; i++) rect(b, x + 1 + i * 4, bot - 20, 3, 7, i % 2 ? '#8a4a24' : '#a8602e')
        for (let i = 0; i < 4; i++) rect(b, x + 3 + i * 5, bot - 9 - (Math.sin(this.t * 9 + i) > 0 ? 2 : 0), 2, 3, i % 2 ? '#f2c14e' : '#e8794a')
        break
      }
      case 'canakkale': {
        // peynir helvası tezgâhı: tepside altın kızarmış dilimler, yanında seramik testi
        rect(b, x - 4, bot - 9, 26, 9, '#7a5234')
        rect(b, x - 6, bot - 12, 30, 3, '#e8dcc0')
        for (let i = 0; i < 5; i++) {
          rect(b, x - 3 + i * 5, bot - 15, 4, 3, '#e8b85a')
          rect(b, x - 3 + i * 5, bot - 15, 4, 1, '#c8843a')
        }
        rect(b, x + 22, bot - 20, 4, 8, '#5a8a4a')
        rect(b, x + 23, bot - 22, 2, 2, '#a86a34')
        rect(b, x - 6, bot - 25, 32, 2, '#d6403a')
        rect(b, x - 6, bot - 23, 1, 11, '#7a5234')
        rect(b, x + 25, bot - 23, 1, 11, '#7a5234')
        break
      }
      case 'sinop': {
        // mantı ve nokul tezgâhı: buğusu tüten sini
        rect(b, x - 4, bot - 9, 26, 9, '#5e4634')
        rect(b, x - 6, bot - 12, 30, 3, '#c8ccd4')
        for (let i = 0; i < 6; i++) rect(b, x - 3 + i * 4, bot - 14, 3, 2, '#f0e4c8')
        for (let i = 0; i < 3; i++) rect(b, x + 1 + i * 7, bot - 18 - Math.round(Math.sin(this.t * 3 + i) * 1), 1, 3, 'rgba(255,255,255,0.5)')
        rect(b, x - 6, bot - 25, 32, 2, '#2a6a86')
        rect(b, x - 6, bot - 23, 1, 11, '#5e4634')
        rect(b, x + 25, bot - 23, 1, 11, '#5e4634')
        break
      }
      case 'diyarbakir': {
        // karpuz sergisi: üst üste dizili koca karpuzlar, biri yarılmış
        rect(b, x - 6, bot - 3, 32, 3, '#6a4a32')
        for (const [dx, dy] of [[-2, 0], [8, 0], [18, 0], [3, -8], [13, -8]] as const) {
          disc(b, x + dx + 4, bot - 8 + dy, 5, '#2e6a30')
          rect(b, x + dx + 2, bot - 11 + dy, 1, 6, '#1e4a22')
          rect(b, x + dx + 5, bot - 12 + dy, 1, 7, '#1e4a22')
        }
        disc(b, x + 8, bot - 23, 5, '#e24a48', true)
        rect(b, x + 3, bot - 23, 11, 1, '#e8f0d0')
        break
      }
      case 'trabzon': {
        // hamsi tezgâhı: tepside sıra sıra gümüş balık, limon
        rect(b, x - 4, bot - 9, 26, 9, '#6a4a32')
        rect(b, x - 6, bot - 12, 30, 3, '#3a6a8a')
        for (let r2 = 0; r2 < 2; r2++) for (let i = 0; i < 7; i++) {
          const fx = x - 4 + i * 4 + r2 * 2
          const fy = bot - 15 - r2 * 3
          rect(b, fx, fy, 3, 1, '#c8d4e0')
          rect(b, fx + 3, fy, 1, 1, '#7a8a9a')
        }
        disc(b, x + 22, bot - 15, 2, '#f2d34a')
        rect(b, x - 6, bot - 24, 30, 2, '#d6403a')
        rect(b, x - 6, bot - 22, 1, 10, '#6a4a32')
        rect(b, x + 23, bot - 22, 1, 10, '#6a4a32')
        break
      }
      case 'konya': {
        // etli ekmek fırını: taş fırın, uzun kürek, ekmek
        rect(b, x - 4, bot - 18, 24, 18, '#8a6a4a')
        disc(b, x + 8, bot - 18, 12, '#8a6a4a', true)
        rect(b, x + 3, bot - 12, 10, 8, '#2a1a14')
        disc(b, x + 8, bot - 12, 5, '#2a1a14', true)
        rect(b, x + 4, bot - 8, 8, 2, '#f28c28')
        rect(b, x + 5, bot - 9, 6, 1, '#ffd36a')
        rect(b, x + 14, bot - 6, 18, 1, '#a07a58')
        rect(b, x + 26, bot - 8, 10, 3, '#e0a860')
        rect(b, x + 27, bot - 8, 8, 1, '#c86a3a')
        break
      }
      case 'nevsehir': {
        // Avanos çömlekçisi: çark ve testiler
        rect(b, x - 2, bot - 6, 14, 6, '#6a4a3a')
        disc(b, x + 5, bot - 8, 5, '#3a2a24')
        rect(b, x + 2, bot - 16, 6, 8, '#c8603a')
        rect(b, x + 3, bot - 18, 4, 2, '#a84a2a')
        for (let i = 0; i < 3; i++) {
          rect(b, x + 14 + i * 6, bot - 9, 5, 9, '#c8603a')
          rect(b, x + 15 + i * 6, bot - 11, 3, 2, '#a84a2a')
          rect(b, x + 14 + i * 6, bot - 6, 5, 1, '#f0c890')
        }
        break
      }
      case 'gaziantep': {
        // baklava tepsisi ve fıstık çuvalı
        rect(b, x - 4, bot - 10, 24, 10, '#5a3c26')
        rect(b, x - 4, bot - 10, 24, 1, '#7a5638')
        disc(b, x + 8, bot - 13, 11, '#b8682e', true)
        for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) rect(b, x - 1 + i * 2 + j, bot - 15 + j * 2, 2, 2, (i + j) % 2 ? '#eab24a' : '#86c040')
        rect(b, x + 22, bot - 12, 10, 12, '#c8a878')
        rect(b, x + 23, bot - 14, 8, 3, '#86c040')
        rect(b, x + 22, bot - 12, 10, 1, '#a88858')
        break
      }
      case 'istanbul': {
        rect(b, x - 6, bot - 14, 26, 10, '#c8302a')
        rect(b, x - 6, bot - 14, 26, 2, '#e8564a')
        rect(b, x - 4, bot - 26, 22, 12, 'rgba(220,240,255,0.35)')
        rect(b, x - 4, bot - 26, 22, 1, '#e8e8e8')
        rect(b, x - 4, bot - 26, 1, 12, '#e8e8e8')
        rect(b, x + 17, bot - 26, 1, 12, '#e8e8e8')
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
          disc(b, x - 1 + i * 5, bot - 22 + j * 5, 2, '#b8692e')
          rect(b, x - 1 + i * 5, bot - 22 + j * 5, 1, 1, '#f6e7c0')
        }
        disc(b, x - 2, bot - 3, 3, '#2a2236')
        disc(b, x + 16, bot - 3, 3, '#2a2236')
        rect(b, x + 20, bot - 18, 6, 1, '#5a3c26')
        break
      }
      case 'kocaeli': {
        // pişmaniye tezgâhı: pembe kutular
        rect(b, x - 4, bot - 10, 26, 10, '#7a5a40')
        rect(b, x - 4, bot - 10, 26, 1, '#a07a58')
        for (let i = 0; i < 4; i++) {
          rect(b, x - 2 + i * 6, bot - 16, 5, 6, '#e88aa0')
          rect(b, x - 1 + i * 6, bot - 15, 3, 3, '#fbf6ec')
        }
        for (let i = 0; i < 3; i++) {
          rect(b, x + 1 + i * 6, bot - 21, 5, 5, '#d8708a')
          rect(b, x + 2 + i * 6, bot - 20, 3, 2, '#fbf6ec')
        }
        rect(b, x - 6, bot - 28, 30, 3, '#e86a8a')
        for (let i = 0; i < 30; i += 6) rect(b, x - 6 + i, bot - 25, 3, 2, '#fbf6ec')
        break
      }
      case 'ordu': {
        // fındık çuvalları ve harman
        rect(b, x - 8, bot - 2, 34, 2, '#7a8a9a')
        for (let i = 0; i < 14; i++) rect(b, x - 6 + i * 2, bot - 4 - (i % 2), 2, 2, i % 3 ? '#a8682c' : '#7a4418')
        for (const sx of [x + 14, x + 20]) {
          rect(b, sx, bot - 12, 6, 10, '#c8b48a')
          rect(b, sx + 1, bot - 13, 4, 1, '#a8682c')
        }
        break
      }
      case 'adana': {
        // kebap mangalı ve şalgam şişeleri
        const fl = Math.floor(this.t * 8) % 2
        rect(b, x - 2, bot - 10, 22, 4, '#3a3440')
        rect(b, x, bot - 6, 2, 6, '#2a2430')
        rect(b, x + 16, bot - 6, 2, 6, '#2a2430')
        for (let i = 0; i < 5; i++) rect(b, x + i * 4, bot - 11 - fl, 3, 1, i % 2 ? '#f28c28' : '#ffd36a')
        for (let i = 0; i < 3; i++) {
          rect(b, x - 1, bot - 14 - i * 2, 22, 1, '#9aa3b5')
          rect(b, x + 3 + i * 2, bot - 15 - i * 2, 10, 2, '#8a3a24')
        }
        for (let k = 0; k < 4; k++) rect(b, x + 6 + k * 2, bot - 20 - k * 3 - fl, 2, 2, 'rgba(230,230,230,0.45)')
        for (let i = 0; i < 2; i++) {
          rect(b, x + 24 + i * 4, bot - 10, 3, 10, '#6a1a3a')
          rect(b, x + 25 + i * 4, bot - 12, 1, 2, '#6a1a3a')
        }
        break
      }
      case 'ardahan': {
        // odun yığını ve semaver
        for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) {
          disc(b, x + i * 6 + r * 3, bot - 3 - r * 5, 3, '#6a4a30')
          rect(b, x + i * 6 + r * 3, bot - 3 - r * 5, 1, 1, '#c8a070')
        }
        rect(b, x - 2, bot - 18, 26, 2, '#f6faff')
        rect(b, x + 26, bot - 14, 8, 14, '#c88a3a')
        rect(b, x + 27, bot - 18, 6, 4, '#a86a24')
        rect(b, x + 29, bot - 21, 2, 3, '#a86a24')
        rect(b, x + 34, bot - 8, 3, 1, '#a86a24')
        break
      }
      case 'izmir': {
        // boyoz tezgâhı: tepsiler, yumurtalar, çay
        rect(b, x - 4, bot - 12, 24, 3, '#8a6a4a')
        rect(b, x - 2, bot - 9, 2, 9, '#5a3c26')
        rect(b, x + 16, bot - 9, 2, 9, '#5a3c26')
        rect(b, x - 3, bot - 15, 22, 3, '#c8c4cc')
        for (let i = 0; i < 6; i++) disc(b, x + i * 3, bot - 16, 1, '#e0a040')
        for (let i = 0; i < 3; i++) rect(b, x + 1 + i * 3, bot - 19, 2, 3, '#f4efe6')
        rect(b, x + 13, bot - 20, 3, 4, 'rgba(200,60,40,0.9)')
        rect(b, x + 13, bot - 20, 3, 1, '#f4efe6')
        break
      }
      case 'ankara': {
        // Kale kuruyemişçisi: çuvallar
        const cols = ['#c87a3a', '#e0b050', '#8a4a2a', '#d8c8a0']
        for (let i = 0; i < 4; i++) {
          const sx = x - 6 + i * 8
          rect(b, sx, bot - 10, 7, 10, '#b8a078')
          rect(b, sx, bot - 11, 7, 2, cols[i])
          rect(b, sx + 1, bot - 12, 5, 1, cols[i])
        }
        rect(b, x - 7, bot - 24, 34, 2, '#c8302a')
        for (let i = 0; i < 34; i += 6) rect(b, x - 7 + i, bot - 22, 3, 2, '#f4efe6')
        break
      }
      case 'mardin': {
        rect(b, x - 6, bot - 2, 28, 2, '#a83a2a')
        for (let i = 0; i < 28; i += 4) rect(b, x - 6 + i, bot - 2, 2, 1, '#f2c14e')
        rect(b, x - 2, bot - 9, 20, 2, '#7a4a24')
        rect(b, x, bot - 7, 2, 5, '#5a3c26')
        rect(b, x + 14, bot - 7, 2, 5, '#5a3c26')
        // cezve ve mırra fincanları
        rect(b, x + 2, bot - 14, 5, 5, '#c87a3a')
        rect(b, x + 7, bot - 13, 3, 1, '#c87a3a')
        rect(b, x + 11, bot - 11, 2, 2, '#f4efe6')
        rect(b, x + 14, bot - 11, 2, 2, '#f4efe6')
        // buhar
        const t = Math.floor(this.t * 3) % 3
        rect(b, x + 4, bot - 17 - t, 1, 2, 'rgba(255,255,255,0.5)')
        // telkari vitrin
        rect(b, x - 8, bot - 26, 10, 14, '#5a3c26')
        rect(b, x - 7, bot - 25, 8, 12, '#2a2236')
        for (let i = 0; i < 3; i++) rect(b, x - 5 + (i % 2) * 3, bot - 23 + i * 4, 2, 2, '#e6ebf2')
        break
      }
      case 'malatya': {
        rect(b, x - 6, bot - 24, 30, 3, '#d9741a')
        for (let i = 0; i < 30; i += 6) rect(b, x - 6 + i, bot - 21, 3, 2, '#f4efe6')
        rect(b, x - 5, bot - 21, 2, 21, '#7a4a24')
        rect(b, x + 21, bot - 21, 2, 21, '#7a4a24')
        for (let k = 0; k < 3; k++) {
          const cx = x - 2 + k * 8
          rect(b, cx, bot - 8, 7, 8, '#a86a38')
          rect(b, cx, bot - 8, 7, 1, '#d29a5a')
          for (let i = 0; i < 4; i++) disc(b, cx + 1 + i * 2, bot - 9, 1, i % 2 ? '#f39a2e' : '#ffb84a')
        }
        for (let i = 0; i < 5; i++) disc(b, x + 1 + i * 4, bot - 13, 1, '#e8832a')
        break
      }
      case 'corum': {
        // leblebi kazanı + çuvallar
        const fl = Math.floor(this.t * 8) % 2
        rect(b, x, bot - 4, 14, 4, '#3a2a22')
        rect(b, x + 3, bot - 7 - fl, 2, 3 + fl, '#f28c28')
        rect(b, x + 8, bot - 6 + fl, 2, 2 + fl, '#ffd36a')
        rect(b, x - 1, bot - 12, 16, 5, '#b87333')
        rect(b, x - 2, bot - 13, 18, 1, '#d8955a')
        for (let i = 0; i < 6; i++) rect(b, x + 1 + i * 2, bot - 14, 1, 1, '#f2e2b4')
        for (const sx of [x + 17, x + 23]) {
          rect(b, sx, bot - 10, 6, 10, '#c9b27a')
          rect(b, sx + 1, bot - 11, 4, 1, '#a88a52')
          rect(b, sx + 1, bot - 12, 4, 1, '#f2e2b4')
        }
        break
      }
      case 'sivas': {
        // Sivas halısı askıda
        rect(b, x - 4, bot - 28, 24, 1, '#5a3c26')
        rect(b, x - 4, bot - 28, 1, 28, '#5a3c26')
        rect(b, x + 19, bot - 28, 1, 28, '#5a3c26')
        rect(b, x - 1, bot - 26, 18, 18, '#8a1e2a')
        rect(b, x + 1, bot - 24, 14, 14, '#1d3f6a')
        rect(b, x + 3, bot - 22, 10, 10, '#c9a24a')
        rect(b, x + 6, bot - 19, 4, 4, '#8a1e2a')
        for (let i = 0; i < 18; i += 2) rect(b, x - 1 + i, bot - 8, 1, 2, '#e8dcc0')
        rect(b, x - 1, bot - 26, 18, 1, '#f4f8ff')
        break
      }
      case 'bayburt': {
        rect(b, x - 4, bot - 10, 14, 10, '#c9a24a')
        rect(b, x - 4, bot - 10, 14, 1, '#e8c86a')
        rect(b, x - 4, bot - 6, 14, 1, '#a8822a')
        rect(b, x - 4, bot - 11, 14, 2, '#e6edf7')
        rect(b, x + 12, bot - 12, 14, 2, '#7a5a40')
        rect(b, x + 12, bot - 7, 14, 2, '#7a5a40')
        for (let i = 0; i < 3; i++) rect(b, x + 12 + i * 6, bot - 14, 2, 14, '#5e4634')
        break
      }
    }
  }

  /** Şehrin ikinci simge nesnesi: tramvay, telkari vitrini, güneş kursu, çay ocağı */
  private drawCityProp(b: Ctx, x: number, bot: number) {
    switch (this.city) {
      case 'istanbul': {
        // nostaljik tramvay: kırmızı-krem gövde, pantograf, raylar
        rect(b, x - 16, bot - 1, 48, 1, '#5a5a66')
        rect(b, x - 14, bot - 20, 44, 16, '#c8302a')
        rect(b, x - 14, bot - 20, 44, 2, '#e8564a')
        rect(b, x - 14, bot - 10, 44, 3, '#f4ead8')
        for (let i = 0; i < 5; i++) rect(b, x - 11 + i * 8, bot - 17, 6, 5, '#cfe4f0')
        rect(b, x - 14, bot - 4, 44, 2, '#3a2a2a')
        for (const wx of [x - 8, x + 20]) disc(b, wx, bot - 2, 2, '#2a2222')
        rect(b, x + 6, bot - 26, 1, 6, '#3a3a40')
        rect(b, x + 2, bot - 26, 9, 1, '#3a3a40')
        rect(b, x + 1, bot - 18, 4, 2, '#f2c14e')
        break
      }
      case 'mardin': {
        // telkari vitrini: ahşap raf, ışıkta parlayan gümüş işler
        rect(b, x - 2, bot - 22, 20, 22, '#6a4a32')
        rect(b, x, bot - 20, 16, 18, '#2a2028')
        const glint = Math.floor(this.t * 3) % 4
        for (let i = 0; i < 4; i++) {
          const gx = x + 2 + (i % 2) * 8
          const gy = bot - 18 + Math.floor(i / 2) * 8
          disc(b, gx + 2, gy + 2, 2, '#c8d0dc')
          rect(b, gx + 2, gy + 2, 1, 1, i === glint ? '#ffffff' : '#8a96a8')
        }
        rect(b, x - 2, bot - 23, 20, 1, '#8a6a4a')
        break
      }
      case 'corum': {
        // Hitit güneş kursu: taş kaide üstünde tunç halka ve geyik
        rect(b, x + 3, bot - 6, 10, 6, '#9a8a6a')
        rect(b, x + 7, bot - 10, 2, 4, '#7a5a2a')
        for (let a = 0; a < 20; a++) {
          const ang = Math.PI + (a / 19) * Math.PI
          rect(b, x + 8 + Math.round(Math.cos(ang) * 7), bot - 14 + Math.round(Math.sin(ang) * 7), 1, 1, '#c8862e')
        }
        rect(b, x + 6, bot - 16, 4, 3, '#a86a24')
        rect(b, x + 5, bot - 19, 1, 3, '#a86a24')
        rect(b, x + 10, bot - 19, 1, 3, '#a86a24')
        for (const dx of [1, 8, 15]) rect(b, x + dx, bot - 14 - (dx === 8 ? 7 : 3), 1, 1, '#f2c14e')
        break
      }
      case 'trabzon': {
        // çay ocağı: semaver, ince belli bardak
        rect(b, x + 3, bot - 4, 10, 4, '#5e4634')
        rect(b, x + 5, bot - 16, 6, 12, '#c8a050')
        rect(b, x + 6, bot - 19, 4, 3, '#a87a30')
        rect(b, x + 11, bot - 10, 3, 1, '#a87a30')
        rect(b, x + 15, bot - 8, 2, 4, 'rgba(220,240,255,0.7)')
        rect(b, x + 15, bot - 7, 2, 2, '#a8301e')
        if (Math.sin(this.t * 2) > 0) rect(b, x + 7, bot - 22, 1, 2, 'rgba(255,255,255,0.5)')
        break
      }
      default:
        this.drawLandmarkProp(b, x, bot)
    }
  }

  /** Şehrin kendine özgü küçük nesnesi: bölümü her yerde o şehre bağlar. */
  private drawLandmarkProp(b: Ctx, x: number, bot: number) {
    switch (this.city) {
      case 'edirne': {
        // Kırkpınar'ın altın kemeri, kaidede
        rect(b, x + 2, bot - 6, 12, 6, '#8a7a5e')
        rect(b, x + 1, bot - 7, 14, 1, '#b4a48a')
        rect(b, x + 2, bot - 14, 12, 5, '#f2c14e')
        rect(b, x + 2, bot - 14, 12, 1, '#fff0b0')
        rect(b, x + 6, bot - 15, 4, 7, '#c8922a')
        rect(b, x + 7, bot - 13, 2, 3, '#d6403a')
        break
      }
      case 'bursa': {
        // Karagöz perdesi: iki sopanın arasında aydınlık bez, arkasında suret
        rect(b, x - 2, bot - 26, 1, 26, '#5e4634')
        rect(b, x + 17, bot - 26, 1, 26, '#5e4634')
        rect(b, x - 1, bot - 25, 18, 16, '#f6e8c0')
        disc(b, x + 5, bot - 18, 2, '#3a2a44')
        rect(b, x + 4, bot - 16, 3, 6, '#3a2a44')
        rect(b, x + 3, bot - 21, 4, 1, '#3a2a44')
        disc(b, x + 12, bot - 18, 2, '#3a2a44')
        rect(b, x + 11, bot - 16, 3, 6, '#3a2a44')
        rect(b, x + 10, bot - 22, 5, 2, '#3a2a44')
        break
      }
      case 'antalya': {
        // Hadrian Kapısı'ndan bir kemer parçası
        rect(b, x, bot - 20, 4, 20, '#d8c8a8')
        rect(b, x + 12, bot - 20, 4, 20, '#d8c8a8')
        rect(b, x - 1, bot - 24, 18, 4, '#e8dcc0')
        rect(b, x - 1, bot - 25, 18, 1, '#b8a888')
        disc(b, x + 8, bot - 20, 4, '#b8a888', true)
        rect(b, x, bot - 2, 4, 2, '#b8a888')
        rect(b, x + 12, bot - 2, 4, 2, '#b8a888')
        break
      }
      case 'sanliurfa': {
        // Göbeklitepe dikilitaşı: T biçimli, üstünde tilki kabartması
        rect(b, x + 5, bot - 22, 6, 22, '#c8a878')
        rect(b, x + 1, bot - 27, 14, 6, '#d8b888')
        rect(b, x + 1, bot - 27, 14, 1, '#f0d8a8')
        rect(b, x + 6, bot - 16, 3, 2, '#8a6a44')
        rect(b, x + 7, bot - 14, 1, 6, '#8a6a44')
        rect(b, x + 9, bot - 17, 1, 1, '#8a6a44')
        break
      }
      case 'rize': {
        // koca pirinç semaver, taş kaidede; tepesinde demlik, buğusu tüter
        rect(b, x + 1, bot - 3, 14, 3, '#8a8478')
        rect(b, x + 1, bot - 3, 14, 1, '#aaa496')
        rect(b, x + 5, bot - 5, 6, 2, '#d8a83a')
        rect(b, x + 3, bot - 17, 10, 12, '#c8683a')
        rect(b, x + 2, bot - 15, 12, 8, '#c8683a')
        rect(b, x + 3, bot - 16, 2, 10, '#e08a5a')
        rect(b, x + 12, bot - 15, 2, 8, '#9a4a26')
        rect(b, x + 2, bot - 14, 12, 1, '#e8b84a')
        rect(b, x + 2, bot - 9, 12, 1, '#e8b84a')
        rect(b, x, bot - 14, 2, 1, '#d8a83a')
        rect(b, x, bot - 14, 1, 4, '#d8a83a')
        rect(b, x + 14, bot - 10, 2, 1, '#d8a83a')
        rect(b, x + 15, bot - 10, 1, 2, '#d8a83a')
        rect(b, x + 5, bot - 19, 6, 2, '#d8a83a')
        rect(b, x + 5, bot - 23, 6, 4, '#f8f6f0')
        rect(b, x + 6, bot - 22, 1, 1, '#3a8ac8')
        rect(b, x + 9, bot - 21, 1, 1, '#3a8ac8')
        rect(b, x + 11, bot - 22, 2, 1, '#f8f6f0')
        rect(b, x + 7, bot - 24, 2, 1, '#f8f6f0')
        if (Math.sin(this.t * 2.5) > -0.2) rect(b, x + 13, bot - 27 - Math.round(Math.sin(this.t * 2.5)), 1, 3, 'rgba(255,255,255,0.55)')
        break
      }
      case 'artvin': {
        // karakovan: oyulmuş kütük kovan, direğe asılı; ağzında arılar
        rect(b, x + 7, bot - 14, 2, 14, '#5a4030')
        rect(b, x + 1, bot - 26, 14, 1, '#5a4030')
        rect(b, x + 3, bot - 25, 1, 2, '#c8b48a')
        rect(b, x + 12, bot - 25, 1, 2, '#c8b48a')
        rect(b, x + 1, bot - 23, 14, 9, '#8a6a46')
        rect(b, x + 1, bot - 23, 14, 1, '#a8885a')
        rect(b, x + 1, bot - 15, 14, 1, '#6a4e32')
        for (const dy of [-20, -17]) rect(b, x + 1, bot + dy, 14, 1, '#6e5236')
        rect(b, x, bot - 22, 1, 7, '#5a4030')
        rect(b, x + 15, bot - 22, 1, 7, '#5a4030')
        rect(b, x + 7, bot - 18, 2, 2, '#2a1e16')
        for (let k = 0; k < 2; k++) {
          const a = this.t * 3 + k * 3
          const bx = x + 8 + Math.round(Math.cos(a) * 5)
          const by = bot - 17 + Math.round(Math.sin(a * 1.3) * 3)
          rect(b, bx, by, 2, 1, '#f2c14e')
          rect(b, bx + 1, by, 1, 1, '#2a2420')
        }
        rect(b, x + 4, bot - 1, 8, 1, '#4a3424')
        break
      }
      case 'kars': {
        // Ani'den bir taş: kızıl tüften küçük kilise maketi, konik kubbe, üstünde kar
        rect(b, x + 1, bot - 2, 14, 2, '#6c6a72')
        rect(b, x + 2, bot - 13, 12, 11, '#9a5a4a')
        rect(b, x + 2, bot - 13, 2, 11, '#b8786a')
        rect(b, x + 12, bot - 13, 2, 11, '#7a4236')
        rect(b, x + 5, bot - 18, 6, 5, '#9a5a4a')
        for (let i = 0; i < 4; i++) rect(b, x + 5 + i, bot - 19 - i, 6 - i * 2, 1, '#8a4a3e')
        rect(b, x + 6, bot - 22, 4, 1, '#f6f9fd')
        rect(b, x + 1, bot - 14, 14, 1, '#f6f9fd')
        rect(b, x + 7, bot - 9, 2, 7, '#3a2420')
        rect(b, x + 7, bot - 10, 2, 1, '#3a2420')
        rect(b, x + 4, bot - 11, 1, 3, '#5a3028')
        rect(b, x + 11, bot - 11, 1, 3, '#5a3028')
        break
      }
      case 'bitlis': {
        // Ahlat mezar taşı: ince uzun, sivri tepeli, oyma kuşaklı; dibinde ot
        rect(b, x + 5, bot - 24, 6, 24, '#8a6a58')
        rect(b, x + 5, bot - 24, 1, 24, '#a8887a')
        rect(b, x + 10, bot - 24, 1, 24, '#6a4e40')
        for (let i = 0; i < 3; i++) rect(b, x + 5 + i, bot - 25 - i, 6 - i * 2, 1, '#8a6a58')
        rect(b, x + 6, bot - 21, 4, 1, '#5a4236')
        rect(b, x + 7, bot - 19, 2, 3, '#5a4236')
        rect(b, x + 6, bot - 15, 4, 1, '#5a4236')
        for (let i = 0; i < 3; i++) rect(b, x + 6 + (i % 2) * 2, bot - 13 + i * 3, 2, 1, '#5a4236')
        rect(b, x + 3, bot - 2, 10, 2, '#6a5244')
        for (const [dx, h] of [[3, 2], [4, 3], [12, 2]] as const) rect(b, x + dx, bot - 2 - h, 1, h, '#6a7a3a')
        break
      }
      case 'giresun': {
        // karaya çekilmiş Karadeniz kayığı: kalkık burun, boyalı tekne, takozların üstünde; yanında kürek
        rect(b, x + 2, bot - 3, 3, 3, '#5a3c26')
        rect(b, x + 13, bot - 3, 3, 3, '#5a3c26')
        rect(b, x - 2, bot - 13, 2, 4, '#c8402e')
        rect(b, x + 18, bot - 12, 2, 3, '#c8402e')
        for (let i = 0; i < 7; i++) {
          const ins = Math.round(i * 0.4 + (i > 4 ? i - 4 : 0))
          rect(b, x - 1 + ins, bot - 10 + i, 21 - ins * 2, 1, i === 0 ? '#f4efe2' : i === 2 ? '#f4efe2' : i === 6 ? '#2e2620' : '#2e6aa0')
        }
        rect(b, x + 1, bot - 9, 17, 1, '#4a3a2e')
        rect(b, x + 3, bot - 7, 1, 1, '#f2c14e')
        rect(b, x + 22, bot - 16, 1, 16, '#8a6a46')
        rect(b, x + 21, bot - 4, 3, 4, '#a8885a')
        break
      }
      case 'tokat': {
        // Saat Kulesi: kesme taş gövde, dört yüzlü saat, kurşun külah; ibreleri saate bağlı döner
        rect(b, x + 3, bot - 2, 10, 2, '#7a6a5a')
        rect(b, x + 4, bot - 22, 8, 20, '#c8b49a')
        rect(b, x + 4, bot - 22, 2, 20, '#e0d0b8')
        rect(b, x + 10, bot - 22, 2, 20, '#9a8670')
        for (const dy of [-8, -15]) rect(b, x + 4, bot + dy, 8, 1, '#a8927a')
        rect(b, x + 7, bot - 6, 2, 4, '#4a3a3e')
        rect(b, x + 3, bot - 23, 10, 1, '#8a7660')
        for (let i = 0; i < 6; i++) rect(b, x + 4 + i * 0.6, bot - 24 - i, 8 - i * 1.2, 1, '#5a6070')
        rect(b, x + 7, bot - 31, 2, 2, '#f2c14e')
        disc(b, x + 8, bot - 19, 2, '#f4ead8')
        const a = this.t * 0.6
        rect(b, x + 8 + Math.round(Math.cos(a) * 1.4), bot - 19 + Math.round(Math.sin(a) * 1.4), 1, 1, '#2a2420')
        rect(b, x + 8, bot - 19, 1, 1, '#2a2420')
        break
      }
      case 'aydin': {
        // Selçuk'taki tek Artemis sütunu: yivli mermer gövde, kaide ve başlık; tepesinde dal yığınından leylek yuvası ve bir leylek
        rect(b, x + 1, bot - 3, 14, 3, '#cfc8b8')
        rect(b, x + 2, bot - 5, 12, 2, '#e4ded0')
        rect(b, x + 4, bot - 34, 8, 29, '#f0ece2')
        rect(b, x + 4, bot - 34, 1, 29, '#fffcf4')
        rect(b, x + 10, bot - 34, 2, 29, '#c4beb0')
        for (let i = 0; i < 3; i++) rect(b, x + 6 + i * 2, bot - 32, 1, 26, 'rgba(120,112,98,0.28)')
        rect(b, x + 2, bot - 37, 12, 3, '#f0ece2')
        rect(b, x + 1, bot - 38, 14, 1, '#c4beb0')
        for (let i = 0; i < 7; i++) rect(b, x + 1 + i * 2, bot - 41 - (i % 3), 3, 2, '#7a5a3a')
        rect(b, x + 6, bot - 49, 2, 7, '#f6f2ec')
        rect(b, x + 6, bot - 50, 5, 1, '#e8582e')
        rect(b, x + 9, bot - 51, 1, 1, '#1c1a20')
        if (Math.sin(this.t * 1.7) > 0.7) rect(b, x + 5, bot - 48, 1, 4, '#1c1a20')
        break
      }
      case 'mersin': {
        // Kızkalesi'nin burcu: dalgaların vurduğu kaya üstünde mazgallı taş kule, tepede kırmızı sancak
        rect(b, x, bot - 4, 16, 4, '#6a5a44')
        rect(b, x + 3, bot - 26, 10, 22, '#d8c8a4')
        rect(b, x + 3, bot - 26, 2, 22, '#efe2c4')
        rect(b, x + 11, bot - 26, 2, 22, '#a8946e')
        for (let i = 0; i < 3; i++) rect(b, x + 3 + i * 4, bot - 29, 2, 3, '#d8c8a4')
        rect(b, x + 7, bot - 18, 2, 4, '#3e3226')
        rect(b, x + 6, bot - 9, 4, 5, '#3e3226')
        rect(b, x + 8, bot - 37, 1, 8, '#4a3a2e')
        const fl = Math.round(Math.sin(this.t * 3) * 0.8)
        rect(b, x + 9, bot - 37 + fl, 4, 3, '#d0402a')
        const surf = Math.floor(this.t * 3) % 4
        rect(b, x - 1 + surf, bot - 2, 3, 1, 'rgba(240,250,255,0.85)')
        rect(b, x + 14 - surf, bot - 3, 3, 1, 'rgba(240,250,255,0.85)')
        break
      }
      case 'balikesir': {
        // Saat Kulesi: Galata'yı andıran yuvarlak kesme taş gövde, saat yüzü, sivri külah; ibresi saate bağlı döner
        rect(b, x + 1, bot - 3, 14, 3, '#7a6a58')
        rect(b, x + 1, bot - 3, 14, 1, '#9a8a76')
        rect(b, x + 3, bot - 28, 10, 25, '#d4c09c')
        rect(b, x + 3, bot - 28, 2, 25, '#ead8b6')
        rect(b, x + 11, bot - 28, 2, 25, '#a8946e')
        for (const dy of [-10, -17]) rect(b, x + 3, bot + dy, 10, 1, '#b4a07c')
        rect(b, x + 7, bot - 7, 2, 4, '#4a3a2e')
        rect(b, x + 6, bot - 14, 1, 2, '#4a3a2e')
        rect(b, x + 9, bot - 14, 1, 2, '#4a3a2e')
        rect(b, x + 2, bot - 29, 12, 1, '#8a7660')
        rect(b, x + 2, bot - 31, 12, 2, '#d4c09c')
        for (let i = 0; i < 3; i++) rect(b, x + 2 + i * 4, bot - 32, 2, 1, '#d4c09c')
        for (let i = 0; i < 10; i++) rect(b, x + 3 + Math.round(i * 0.45), bot - 33 - i, 10 - Math.round(i * 0.9), 1, i % 3 ? '#5a6478' : '#6e788c')
        rect(b, x + 8, bot - 46, 1, 3, '#f2c14e')
        disc(b, x + 8, bot - 22, 2, '#f4ead8')
        const a = this.t * 0.6
        rect(b, x + 8 + Math.round(Math.cos(a) * 1.4), bot - 22 + Math.round(Math.sin(a) * 1.4), 1, 1, '#2a2420')
        rect(b, x + 8, bot - 22, 1, 1, '#2a2420')
        break
      }
      case 'afyon': {
        // termal otelin kaplıca çeşmesi: mermer havuz başı, kurşun kubbeli küçük köşk, lüleden akan sıcak su ve tüten buhar
        rect(b, x - 1, bot - 4, 18, 4, '#e6e2da')
        rect(b, x - 1, bot - 4, 18, 1, '#ffffff')
        rect(b, x + 15, bot - 3, 2, 3, '#b8b4ac')
        rect(b, x, bot - 3, 16, 1, '#3ab8c4')
        rect(b, x + 2, bot - 18, 12, 14, '#ece6da')
        rect(b, x + 2, bot - 18, 2, 14, '#fffaf0')
        rect(b, x + 12, bot - 18, 2, 14, '#bcb4a6')
        rect(b, x + 5, bot - 14, 6, 7, '#5a6878')
        disc(b, x + 8, bot - 14, 3, '#5a6878', true)
        rect(b, x + 7, bot - 10, 2, 1, '#d8a050')
        rect(b, x + 8, bot - 9, 1, 5, 'rgba(160,226,240,0.85)')
        rect(b, x + 1, bot - 19, 14, 1, '#a8a094')
        disc(b, x + 8, bot - 19, 6, '#8a96a4', true)
        rect(b, x + 5, bot - 23, 2, 1, '#a8b4c2')
        rect(b, x + 8, bot - 29, 1, 4, '#f2c14e')
        for (let i = 0; i < 3; i++) {
          const k = (this.t * 0.5 + i / 3) % 1
          const sx = x + 3 + i * 5 + Math.round(Math.sin(this.t * 1.6 + i * 2) * 1.5)
          const sy = bot - 6 - Math.round(k * 26)
          const r = 1 + Math.round(k * 2)
          disc(b, sx, sy, r, `rgba(250,250,252,${(0.6 * (1 - k)).toFixed(2)})`)
        }
        break
      }
      case 'bingol': {
        // yayla arı kovanları: taş üstünde üst üste iki renkli tahta kutu kovan, beyaz kapak, uçuş deliği; çevresinde vızıldayan arılar
        rect(b, x, bot - 3, 16, 3, '#7a6a58')
        rect(b, x, bot - 3, 16, 1, '#9a8a76')
        rect(b, x + 2, bot - 13, 12, 10, '#4a8ac8')
        rect(b, x + 2, bot - 13, 2, 10, '#6aa6dc')
        rect(b, x + 12, bot - 13, 2, 10, '#2e6aa0')
        rect(b, x + 6, bot - 6, 4, 1, '#1e1a16')
        rect(b, x + 2, bot - 22, 12, 9, '#e8c24a')
        rect(b, x + 2, bot - 22, 2, 9, '#f6dc7a')
        rect(b, x + 12, bot - 22, 2, 9, '#b8922a')
        rect(b, x + 2, bot - 14, 12, 1, '#6a5a3e')
        rect(b, x + 1, bot - 25, 14, 3, '#f0ece2')
        rect(b, x + 1, bot - 25, 14, 1, '#ffffff')
        rect(b, x + 13, bot - 24, 2, 2, '#c4beb0')
        rect(b, x + 7, bot - 17, 2, 1, '#1e1a16')
        for (let i = 0; i < 4; i++) {
          const a = this.t * (2.2 + i * 0.4) + i * 1.6
          const bx = x + 8 + Math.round(Math.cos(a) * (6 + i * 2))
          const by = bot - 18 + Math.round(Math.sin(a * 1.3) * (4 + i))
          rect(b, bx, by, 2, 1, '#f2c040')
          rect(b, bx + 1, by, 1, 1, '#2a1a12')
          rect(b, bx, by - 1, 1, 1, 'rgba(240,248,255,0.8)')
        }
        break
      }
      case 'elazig': {
        // Harput Ulu Camii'nin eğri minaresi: kalın tuğla gövde sağa yatık, tuğla örgü kuşakları, kısa külah
        rect(b, x, bot - 3, 16, 3, '#8a7462')
        rect(b, x, bot - 3, 16, 1, '#a89078')
        for (let i = 0; i < 26; i++) {
          const lean = Math.round(i * 0.12)
          const y = bot - 4 - i
          rect(b, x + 4 + lean, y, 8, 1, i % 4 === 0 ? '#8a4a2e' : '#b4643e')
          rect(b, x + 4 + lean, y, 2, 1, i % 4 === 0 ? '#9a5a3a' : '#cc7c52')
          rect(b, x + 10 + lean, y, 2, 1, '#8a4a2e')
          if (i % 4 === 2) rect(b, x + 7 + lean + (i % 8 === 2 ? 0 : 1), y, 1, 1, '#e8b48a')
        }
        rect(b, x + 6, bot - 31, 10, 2, '#cc7c52')
        rect(b, x + 6, bot - 30, 10, 1, '#8a4a2e')
        for (let i = 0; i < 7; i++) rect(b, x + 8 + Math.round(i / 2), bot - 32 - i, 7 - i, 1, '#6a6a74')
        rect(b, x + 11, bot - 42, 1, 3, '#f2c14e')
        rect(b, x + 8, bot - 18, 2, 3, '#3a2420')
        break
      }
      case 'karabuk': {
        // Safranbolu konağı: beyaz sıvalı, koyu kirişli, çıkmalı üst katı ve kiremit çatısıyla
        rect(b, x - 2, bot - 14, 18, 14, '#ece0c8')
        rect(b, x - 5, bot - 26, 24, 12, '#d8c4a0')
        for (let k = 0; k <= 22; k += 6) rect(b, x - 5 + k, bot - 26, 1, 12, '#5a3e28')
        rect(b, x - 5, bot - 15, 24, 1, '#5a3e28')
        rect(b, x + 1, bot - 24, 3, 4, '#3a3a4a')
        rect(b, x + 9, bot - 24, 3, 4, '#3a3a4a')
        rect(b, x + 5, bot - 8, 4, 8, '#5a3e28')
        for (let i = 0; i < 6; i++) rect(b, x - 7 + i * 1, bot - 27 - i, 28 - i * 2, 1, i % 2 ? '#a8402a' : '#b94c32')
        break
      }
      case 'zonguldak': {
        // Uzun Mehmet anıtı: taş kaidede tunç madenci, elinde havaya kaldırdığı kara elmas, omzunda kazma
        rect(b, x + 2, bot - 7, 12, 7, '#8a8a84')
        rect(b, x + 2, bot - 7, 12, 1, '#b0b0a8')
        rect(b, x + 1, bot - 1, 14, 1, '#5e5e58')
        rect(b, x + 5, bot - 5, 6, 1, '#d8a548')
        rect(b, x + 6, bot - 12, 2, 5, '#4a3e30')
        rect(b, x + 9, bot - 12, 2, 5, '#4a3e30')
        rect(b, x + 5, bot - 20, 7, 8, '#5a4a38')
        rect(b, x + 5, bot - 20, 1, 8, '#7a6a52')
        rect(b, x + 6, bot - 24, 4, 4, '#5a4a38')
        rect(b, x + 6, bot - 25, 4, 1, '#3e3428')
        rect(b, x + 12, bot - 24, 1, 5, '#5a4a38')
        rect(b, x + 12, bot - 27, 2, 3, '#1c1c22')
        rect(b, x + 13, bot - 27, 1, 1, '#9aa4c0')
        rect(b, x + 3, bot - 22, 1, 10, '#6a4a30')
        rect(b, x + 1, bot - 23, 5, 1, '#8e939c')
        rect(b, x + 1, bot - 22, 1, 1, '#8e939c')
        if (Math.sin(this.t * 2.2) > 0.6) rect(b, x + 14, bot - 28, 1, 1, '#ffffff')
        break
      }
      case 'denizli': {
        // Denizli horozu heykeli: uzun bacaklı, iri ibikli, orak kuyruklu; taş kaidede
        rect(b, x + 1, bot - 5, 14, 5, '#d8d0bc')
        rect(b, x + 1, bot - 5, 14, 1, '#f4eee0')
        rect(b, x + 1, bot - 1, 14, 1, '#a89e88')
        rect(b, x + 7, bot - 10, 1, 5, '#d8a240')
        rect(b, x + 10, bot - 10, 1, 5, '#d8a240')
        rect(b, x + 5, bot - 16, 8, 6, '#6a2e22')
        rect(b, x + 6, bot - 15, 5, 2, '#8a3a22')
        rect(b, x + 1, bot - 22, 2, 8, '#1e2e2c')
        rect(b, x + 3, bot - 24, 3, 2, '#1e2e2c')
        rect(b, x + 2, bot - 23, 1, 6, '#2a4a42')
        rect(b, x + 3, bot - 17, 2, 3, '#1e2e2c')
        rect(b, x + 11, bot - 21, 3, 6, '#c8642a')
        rect(b, x + 11, bot - 24, 4, 3, '#c8642a')
        rect(b, x + 11, bot - 26, 1, 2, '#e2262a')
        rect(b, x + 13, bot - 27, 1, 3, '#e2262a')
        rect(b, x + 12, bot - 25, 3, 1, '#e2262a')
        rect(b, x + 15, bot - 23, 2, 1, '#f2c04a')
        rect(b, x + 14, bot - 21, 1, 2, '#e2262a')
        rect(b, x + 13, bot - 23, 1, 1, '#1a1410')
        break
      }
      case 'agri': {
        // dokuma tezgâhı: iki direk arasında yarısı dokunmuş kilim, gergin çözgü ipleri
        rect(b, x + 1, bot - 26, 2, 26, '#6a4a32')
        rect(b, x + 13, bot - 26, 2, 26, '#6a4a32')
        rect(b, x, bot - 26, 16, 2, '#7a5a40')
        rect(b, x, bot - 4, 16, 2, '#7a5a40')
        for (let i = 0; i < 5; i++) rect(b, x + 4 + i * 2, bot - 24, 1, 10, '#e8d8b0')
        rect(b, x + 3, bot - 14, 10, 10, '#b8302a')
        rect(b, x + 3, bot - 14, 10, 1, '#f2c14e')
        rect(b, x + 7, bot - 12, 2, 1, '#f4ead8')
        rect(b, x + 6, bot - 11, 4, 2, '#2e5a8a')
        rect(b, x + 7, bot - 9, 2, 1, '#f4ead8')
        rect(b, x + 3, bot - 6, 10, 1, '#2e5a8a')
        const sh = Math.round(Math.sin(this.t * 2) * 3)
        rect(b, x + 7 + sh, bot - 15, 3, 1, '#d8a03a')
        break
      }
      case 'van': {
        // Urartu çivi yazılı taş
        rect(b, x + 2, bot - 18, 12, 18, '#8a8490')
        rect(b, x + 2, bot - 18, 12, 1, '#b0aab6')
        for (let r2 = 0; r2 < 4; r2++) for (let i = 0; i < 4; i++) rect(b, x + 4 + i * 2 + (r2 % 2), bot - 15 + r2 * 3, 1, 2, '#4e4a56')
        rect(b, x + 1, bot - 2, 14, 2, '#6e6874')
        break
      }
      case 'kayseri': {
        // Döner Kümbet: on iki köşeli taş gövde, kör kemerler, sivri külah
        rect(b, x + 2, bot - 18, 12, 18, '#8a8698')
        rect(b, x + 2, bot - 18, 2, 18, '#a8a4b6')
        rect(b, x + 12, bot - 18, 2, 18, '#6a6678')
        for (const dx of [5, 9]) {
          rect(b, x + dx, bot - 14, 2, 8, '#5a5668')
          rect(b, x + dx, bot - 15, 1, 1, '#5a5668')
        }
        rect(b, x + 1, bot - 19, 14, 1, '#b4b0c2')
        for (let i = 0; i < 8; i++) rect(b, x + 1 + i * 0.9, bot - 20 - i, 14 - i * 1.8, 1, i % 3 ? '#7a7688' : '#9a96a8')
        rect(b, x + 1, bot - 2, 14, 2, '#5a5668')
        break
      }
      case 'hatay': {
        // Asi'nin su dolabı: dönen tahta çark, kovalardan damlayan su
        rect(b, x - 2, bot - 3, 22, 3, '#3a8aa0')
        rect(b, x + 8, bot - 12, 2, 10, '#5a4030')
        rect(b, x + 4, bot - 3, 10, 1, '#5a4030')
        const rot = this.t * 0.8
        for (let a = 0; a < 56; a++) {
          const an = (a / 56) * Math.PI * 2
          rect(b, x + 9 + Math.round(Math.cos(an) * 9), bot - 12 + Math.round(Math.sin(an) * 9), 1, 1, '#6a4a32')
        }
        for (let k = 0; k < 3; k++) {
          const an = rot + (k * Math.PI) / 3
          for (let r2 = -8; r2 <= 8; r2++) rect(b, x + 9 + Math.round(Math.cos(an) * r2), bot - 12 + Math.round(Math.sin(an) * r2), 1, 1, '#8a6a4a')
        }
        for (let k = 0; k < 6; k++) {
          const an = rot + (k * Math.PI) / 3
          rect(b, x + 8 + Math.round(Math.cos(an) * 10), bot - 13 + Math.round(Math.sin(an) * 10), 2, 2, '#4a3424')
        }
        rect(b, x + 8, bot - 13, 2, 2, '#3a2a1a')
        rect(b, x + 19, bot - 9 + (Math.floor(this.t * 6) % 3), 1, 2, '#8ad0f0')
        break
      }
      case 'amasya': {
        // kral kaya mezarı: yalçın kayaya oyulmuş kemerli oyuk, açık renk söve, önünde iki basamak, tepesinde ot
        const tops = [5, 3, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 2, 3, 5, 8]
        for (let i = 0; i < 16; i++) rect(b, x + i, bot - 23 + tops[i], 1, 23 - tops[i], i < 3 ? '#a8a8a0' : i > 12 ? '#72727a' : '#8c8c88')
        rect(b, x + 3, bot - 22, 6, 1, '#b4b4aa')
        rect(b, x + 1, bot - 8, 2, 1, '#72727a')
        rect(b, x + 13, bot - 14, 2, 1, '#5e5e66')
        rect(b, x + 14, bot - 9, 1, 4, '#5e5e66')
        rect(b, x + 3, bot - 14, 11, 12, '#bcbcb0')
        disc(b, x + 8, bot - 14, 5, '#bcbcb0', true)
        rect(b, x + 4, bot - 14, 9, 12, '#3a3a40')
        disc(b, x + 8, bot - 14, 4, '#3a3a40', true)
        rect(b, x + 6, bot - 11, 5, 9, '#24242a')
        rect(b, x + 4, bot - 14, 1, 12, '#4c4c54')
        rect(b, x + 2, bot - 3, 13, 1, '#c8c4b4')
        rect(b, x + 1, bot - 2, 15, 2, '#b8b4a4')
        rect(b, x + 1, bot - 1, 15, 1, '#9a9688')
        for (const [dx, h] of [[4, 2], [5, 3], [10, 2], [11, 1]] as const) rect(b, x + dx, bot - 22 - h, 1, h, '#5a8a4a')
        rect(b, x + 6, bot - 26, 1, 1, '#e8c44a')
        break
      }
      case 'mugla': {
        // sualtı müzesinden bir amfora: sivri dipli, çift kulplu, midye tutmuş; demir sehpada, taş kaidede
        const rows = [6, 4, 4, 4, 6, 8, 10, 10, 10, 10, 8, 8, 6, 6, 4, 4, 2]
        for (let i = 0; i < rows.length; i++) {
          const w = rows[i]
          const y = bot - 22 + i
          rect(b, x + 8 - w / 2, y, w, 1, '#c8743a')
          rect(b, x + 8 - w / 2, y, w > 4 ? 2 : 1, 1, '#e89a5a')
          rect(b, x + 7 + w / 2, y, 1, 1, '#a0562a')
        }
        rect(b, x + 5, bot - 22, 6, 1, '#f0b078')
        rect(b, x + 4, bot - 15, 8, 1, '#8a4a22')
        rect(b, x + 5, bot - 12, 6, 1, '#f0d8b0')
        for (const k of [0, 1]) {
          const hx = k ? x + 12 : x + 3
          rect(b, hx, bot - 20, 1, 4, '#a0562a')
          rect(b, hx + (k ? -1 : 1), bot - 21, 1, 1, '#a0562a')
          rect(b, hx + (k ? -1 : 1), bot - 16, 1, 1, '#a0562a')
        }
        rect(b, x + 9, bot - 14, 1, 1, '#f4f0e4')
        rect(b, x + 10, bot - 10, 1, 1, '#f4f0e4')
        rect(b, x + 6, bot - 9, 1, 1, '#f4f0e4')
        rect(b, x + 3, bot - 7, 10, 1, '#4a4a54')
        rect(b, x + 3, bot - 7, 1, 5, '#4a4a54')
        rect(b, x + 12, bot - 7, 1, 5, '#4a4a54')
        rect(b, x + 1, bot - 2, 14, 2, '#d8cdb8')
        rect(b, x + 1, bot - 2, 14, 1, '#f0e8d6')
        break
      }
      case 'eskisehir': {
        // lületaşı pipo, taş kaidede
        rect(b, x + 1, bot - 4, 14, 4, '#8a7a6a')
        rect(b, x, bot - 5, 16, 1, '#b4a48a')
        rect(b, x + 3, bot - 15, 6, 10, '#f6f0e2')
        rect(b, x + 3, bot - 15, 1, 10, '#ffffff')
        rect(b, x + 8, bot - 15, 1, 10, '#cfc4ac')
        rect(b, x + 3, bot - 16, 6, 1, '#5a3a24')
        rect(b, x + 5, bot - 12, 2, 1, '#b8a888')
        rect(b, x + 4, bot - 9, 3, 1, '#b8a888')
        rect(b, x + 9, bot - 9, 4, 2, '#c8862a')
        rect(b, x + 13, bot - 10, 2, 2, '#7a4a20')
        if (Math.sin(this.t * 2) > 0) rect(b, x + 5, bot - 20, 1, 3, 'rgba(255,255,255,0.5)')
        break
      }
      case 'erzurum': {
        // cirit: yere saplı iki değnek ve bayrak
        rect(b, x + 3, bot - 24, 1, 24, '#6a4a2e')
        rect(b, x + 11, bot - 20, 1, 20, '#6a4a2e')
        rect(b, x + 4, bot - 24, 6, 4, '#d6403a')
        rect(b, x + 4, bot - 22, 4, 1, '#f4f9ff')
        rect(b, x + 12, bot - 20, 5, 3, '#2e6aa8')
        rect(b, x + 1, bot - 2, 14, 2, '#f4f9ff')
        break
      }
      case 'canakkale': {
        // Çimenlik Kalesi'nin eski topu: tekerlekli kundak, bronz namlu
        disc(b, x + 4, bot - 4, 4, '#5a3c26')
        disc(b, x + 4, bot - 4, 2, '#8a6240')
        rect(b, x + 1, bot - 9, 12, 3, '#6a4a32')
        rect(b, x + 3, bot - 13, 16, 4, '#8a7a4a')
        rect(b, x + 3, bot - 13, 16, 1, '#c8b46a')
        rect(b, x + 18, bot - 14, 2, 6, '#6a5a34')
        for (const dx of [20, 24]) disc(b, x + dx, bot - 2, 2, '#3a3440')
        break
      }
      case 'sinop': {
        // Diyojen'in feneri: taş kaide üstünde yanan fener
        rect(b, x + 3, bot - 6, 10, 6, '#6a6e78')
        rect(b, x + 2, bot - 7, 12, 1, '#8a8e98')
        rect(b, x + 5, bot - 16, 6, 9, '#3a3440')
        rect(b, x + 6, bot - 15, 4, 7, Math.sin(this.t * 5) > 0 ? '#ffd36a' : '#f2b84a')
        rect(b, x + 4, bot - 17, 8, 1, '#3a3440')
        rect(b, x + 7, bot - 20, 2, 3, '#3a3440')
        disc(b, x + 8, bot - 12, 8, 'rgba(255,220,140,0.14)')
        break
      }
      case 'diyarbakir': {
        // Dört Ayaklı Minare: dört sütun üstünde bazalt gövde
        for (const dx of [2, 5, 9, 12]) rect(b, x + dx, bot - 8, 2, 8, '#8e8a96')
        rect(b, x + 1, bot - 10, 14, 2, '#34303c')
        rect(b, x + 3, bot - 30, 10, 20, '#56525e')
        for (let k = 0; k < 4; k++) rect(b, x + 3, bot - 28 + k * 5, 10, 1, '#e8dcc0')
        rect(b, x + 2, bot - 32, 12, 2, '#34303c')
        rect(b, x + 5, bot - 38, 6, 6, '#56525e')
        rect(b, x + 7, bot - 42, 2, 4, '#34303c')
        break
      }
      case 'trabzon': {
        // tabure üstünde kemençe ve yayı
        rect(b, x + 2, bot - 6, 12, 2, '#5e4634')
        rect(b, x + 3, bot - 4, 2, 4, '#5e4634')
        rect(b, x + 11, bot - 4, 2, 4, '#5e4634')
        rect(b, x + 6, bot - 20, 4, 14, '#8a4a24')
        rect(b, x + 7, bot - 23, 2, 3, '#5a2e14')
        rect(b, x + 6, bot - 14, 4, 1, '#f0c890')
        rect(b, x + 7, bot - 19, 1, 9, '#e8dcc0')
        const sway = Math.round(Math.sin(this.t * 6) * 2)
        rect(b, x + 1 + sway, bot - 16, 14, 1, '#d8c8a0')
        break
      }
      case 'konya': {
        // dönen semazen: tennure açılır kapanır
        const k = Math.sin(this.t * 6)
        const skirt = 5 + Math.round(Math.abs(k) * 3)
        rect(b, x + 7, bot - 22, 3, 6, '#c8a070')
        rect(b, x + 7, bot - 16, 3, 3, '#f0d0b0')
        rect(b, x + 6, bot - 13, 5, 5, '#f4f0e8')
        rect(b, x + 8 - skirt, bot - 8, skirt * 2 + 1, 8, '#f4f0e8')
        rect(b, x + 8 - skirt, bot - 1, skirt * 2 + 1, 1, '#d8d0c4')
        rect(b, x + 2, bot - 14 - Math.round(k), 4, 1, '#f4f0e8')
        rect(b, x + 11, bot - 14 + Math.round(k), 4, 1, '#f4f0e8')
        break
      }
      case 'nevsehir': {
        // güvercinlik: kaya duvarına oyulmuş boyalı delikler
        rect(b, x, bot - 20, 16, 20, '#c89a7a')
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
          rect(b, x + 2 + i * 5, bot - 17 + j * 8, 3, 4, '#3a2420')
          rect(b, x + 1 + i * 5, bot - 18 + j * 8, 5, 1, j ? '#e8604a' : '#f4ead8')
        }
        rect(b, x + 6, bot - 22 + Math.round(Math.sin(this.t * 4)), 3, 2, '#c8ccd8')
        break
      }
      case 'gaziantep': {
        // bakır kazan ve cezve
        disc(b, x + 7, bot - 6, 6, '#c8682e')
        rect(b, x + 1, bot - 6, 13, 6, '#c8682e')
        rect(b, x + 1, bot - 12, 13, 1, '#e8904a')
        rect(b, x + 3, bot - 10, 3, 5, '#f0a868')
        rect(b, x + 14, bot - 7, 4, 1, '#8a4a20')
        break
      }
      case 'istanbul': {
        // çay masası: ince belli bardaklar
        rect(b, x + 1, bot - 9, 14, 2, '#8a5a3a')
        rect(b, x + 7, bot - 7, 2, 7, '#5a3c26')
        for (const cx of [x + 3, x + 10]) {
          rect(b, cx, bot - 14, 3, 5, 'rgba(230,240,255,0.6)')
          rect(b, cx, bot - 12, 3, 3, '#b8381e')
          rect(b, cx - 1, bot - 10, 5, 1, '#e8e2d8')
        }
        break
      }
      case 'kocaeli':
        for (let i = 0; i < 3; i++) {
          disc(b, x + 4 + i * 5, bot - 4, 4, '#f2ece0')
          disc(b, x + 4 + i * 5, bot - 4, 1, '#a8a090')
        }
        disc(b, x + 7, bot - 11, 4, '#e8e0d0')
        disc(b, x + 7, bot - 11, 1, '#a8a090')
        break
      case 'izmir':
        // Kordon bankı
        rect(b, x - 2, bot - 8, 20, 2, '#8a5a3a')
        rect(b, x - 2, bot - 12, 20, 2, '#8a5a3a')
        rect(b, x, bot - 6, 2, 6, '#3a3440')
        rect(b, x + 14, bot - 6, 2, 6, '#3a3440')
        break
      case 'ankara':
        // taş çeşme
        rect(b, x, bot - 18, 16, 18, '#a6887e')
        rect(b, x + 3, bot - 15, 10, 9, '#5c4844')
        disc(b, x + 8, bot - 15, 5, '#5c4844', true)
        rect(b, x + 7, bot - 9, 2, 3, '#9aa3b5')
        rect(b, x + 7, bot - 6 + (Math.floor(this.t * 6) % 2), 1, 3, '#8ad0f0')
        rect(b, x - 1, bot - 19, 18, 2, '#c2b0a6')
        break
      case 'adana':
        // pamuk balyası yığını
        for (const [dx, dy] of [[0, 0], [9, 0], [4, 7]] as const) {
          rect(b, x + dx, bot - 7 - dy, 9, 7, '#f4f2ec')
          rect(b, x + dx, bot - 5 - dy, 9, 1, '#c8b48a')
          rect(b, x + dx + 3, bot - 7 - dy, 1, 7, '#c8b48a')
        }
        break
      case 'mardin':
        // asılı kilim
        rect(b, x, bot - 26, 16, 1, '#5a3c26')
        rect(b, x + 1, bot - 25, 14, 20, '#a8302a')
        rect(b, x + 3, bot - 23, 10, 16, '#e0a23a')
        rect(b, x + 6, bot - 19, 4, 8, '#2a3a6a')
        for (let i = 1; i < 15; i += 2) rect(b, x + i, bot - 5, 1, 2, '#e8dcc0')
        break
      case 'malatya':
        for (let i = 0; i < 3; i++) {
          rect(b, x + i * 5, bot - 6, 4, 6, '#a86a38')
          disc(b, x + 2 + i * 5, bot - 7, 1, '#f39a2e')
        }
        break
      case 'corum':
        // Hitit stelinde güneş kursu
        rect(b, x + 3, bot - 22, 10, 22, '#8a7a5a')
        rect(b, x + 2, bot - 2, 12, 2, '#6e6250')
        disc(b, x + 8, bot - 15, 4, '#b8a058')
        disc(b, x + 8, bot - 15, 2, '#8a7a5a')
        for (let i = 0; i < 4; i++) rect(b, x + 5 + i * 2, bot - 8, 1, 4, '#6e6250')
        break
      case 'ordu':
        for (const dx of [0, 7]) {
          rect(b, x + dx, bot - 10, 7, 10, '#c8b48a')
          rect(b, x + dx + 1, bot - 11, 5, 1, '#a8682c')
          rect(b, x + dx + 2, bot - 12, 3, 1, '#7a4418')
        }
        break
      case 'sivas':
        // Divriği taş işlemesi pano
        rect(b, x, bot - 20, 16, 20, '#9a9fb0')
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) disc(b, x + 3 + i * 3.5, bot - 16 + j * 4, 1, '#555a6a')
        rect(b, x - 1, bot - 21, 18, 2, '#f4f8ff')
        break
      case 'ardahan':
        // kardan adam
        disc(b, x + 8, bot - 5, 5, '#f6faff')
        disc(b, x + 8, bot - 13, 4, '#f6faff')
        rect(b, x + 7, bot - 14, 1, 1, '#1d1a22')
        rect(b, x + 9, bot - 14, 1, 1, '#1d1a22')
        rect(b, x + 10, bot - 13, 3, 1, '#f28c28')
        rect(b, x + 4, bot - 10, 9, 2, '#d6403a')
        rect(b, x + 5, bot - 20, 7, 3, '#2a2420')
        break
      case 'bayburt':
        // tabure üstünde kopuz
        rect(b, x + 2, bot - 6, 12, 2, '#5e4634')
        rect(b, x + 3, bot - 4, 2, 4, '#5e4634')
        rect(b, x + 11, bot - 4, 2, 4, '#5e4634')
        disc(b, x + 6, bot - 10, 4, '#a8693a')
        rect(b, x + 9, bot - 18, 2, 8, '#7a4a24')
        break
    }
  }

  /** Haritanın altı (dikey ekranda görünür): taş sütunları HD zemin sürdürür; burada su derinleşir, çukur uçuruma döner */
  private drawUnderground(b: Ctx, w: World, cx: number, cy: number) {
    const lh = w.rows * T
    if (cy + this.viewH <= lh) return
    const s = CITY[this.city]
    const h = cy + this.viewH - lh
    const x0 = Math.max(0, Math.floor(cx / T))
    const x1 = Math.min(w.cols - 1, Math.ceil((cx + this.viewW) / T))
    // çukur: arka plan görünür, aşağı indikçe karanlığa gömülür
    const pit = b.createLinearGradient(0, lh, 0, lh + Math.min(h, 96))
    pit.addColorStop(0, 'rgba(11,9,16,0.15)')
    pit.addColorStop(1, 'rgba(11,9,16,0.96)')
    for (let tx = x0; tx <= x1; tx++) {
      const t = w.tile(tx, w.rows - 1)
      if (t === WATER) rect(b, tx * T, lh, T, h, s.water[1])
      else if (t === SWIM) rect(b, tx * T, lh, T, h, SWIM_COLORS[1])
      else if (t === EMPTY || t === SPIKE_UP) {
        b.fillStyle = pit
        b.fillRect(tx * T, lh, T, h)
      }
    }
    // derinleştikçe kararan örtü (taşın üstüne de düşer)
    const g = b.createLinearGradient(0, lh, 0, lh + h)
    g.addColorStop(0, 'rgba(10,8,16,0)')
    g.addColorStop(1, 'rgba(10,8,16,0.6)')
    b.fillStyle = g
    b.fillRect(cx, lh, this.viewW, h)
  }

  private drawDynamicTiles(b: Ctx, w: World, cx: number, cy: number) {
    const x0 = Math.max(0, Math.floor(cx / T))
    const x1 = Math.min(w.cols - 1, Math.ceil((cx + this.viewW) / T))
    const y0 = Math.max(0, Math.floor(cy / T))
    const y1 = Math.min(w.rows - 1, Math.ceil((cy + this.viewH) / T))
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        const t = w.tile(tx, ty)
        const x = tx * T
        const y = ty * T
        if (t === DOOR) {
          if (w.hasKey) {
            b.globalAlpha = 0.15
            rect(b, x + 2, y, 12, T, '#c88a3a')
            b.globalAlpha = 1
          } else {
            rect(b, x + 1, y, 14, T, '#7a4a24')
            rect(b, x + 2, y, 2, T, '#9a6a3a')
            rect(b, x + 7, y, 2, T, '#9a6a3a')
            rect(b, x + 12, y, 2, T, '#9a6a3a')
            rect(b, x + 1, y + 6, 14, 2, '#3a3440')
            if (w.tile(tx, ty - 1) !== DOOR) {
              rect(b, x + 5, y + 9, 6, 5, '#f2c14e')
              rect(b, x + 7, y + 10, 2, 3, '#120f1a')
            }
          }
        }
        if (t === BOSS_GATE && w.isSolid(tx, ty)) {
          // meydan kapısı: demir parmaklık, boss yenilince kalkar
          rect(b, x, y, T, T, 'rgba(18,12,26,0.45)')
          for (let i = 1; i < T; i += 5) {
            rect(b, x + i, y, 3, T, '#4a4654')
            rect(b, x + i, y, 1, T, '#8a8694')
          }
          rect(b, x, y + 6, T, 2, '#2e2a38')
          rect(b, x, y + 6, T, 1, '#6a6674')
        }
        if (t === RHYTHM_A || t === RHYTHM_B) {
          // ritim bloğu: kiremit (önce) ve turkuaz (sonra) takımlar; kaybolmadan önce yanıp söner, belirmeden önce
          // kesik çerçevesi dolmaya başlar (dörtte bir vuruş). Hepsi saatten: her Hz'de aynı
          const on = w.rhythmOn(t)
          const left = RHYTHM.half - (w.clock % RHYTHM.half)
          const col = t === RHYTHM_A ? '#ff9a7a' : '#5ad6c6'
          const deep = t === RHYTHM_A ? '#b8503a' : '#2a8a7e'
          if (on) {
            const blink = left < RHYTHM.warn && Math.floor(left * 12) % 2 === 0
            b.globalAlpha = blink ? 0.45 : 1
            rect(b, x, y, T, T, deep)
            rect(b, x + 1, y + 1, T - 2, T - 2, col)
            rect(b, x + 1, y + 1, T - 2, 1, 'rgba(255,255,255,0.5)')
            rect(b, x + 5, y + 5, 6, 6, deep)
            // vuruş göstergesi: ortadaki kare kalan süreyle küçülür
            const k = Math.max(0, Math.round((left / RHYTHM.half) * 4))
            rect(b, x + 8 - k, y + 8 - k, k * 2, k * 2, 'rgba(255,255,255,0.55)')
            b.globalAlpha = 1
          } else {
            const soon = left < RHYTHM.warn
            for (let i = 0; i < T; i += 4) {
              rect(b, x + i, y, 2, 1, col)
              rect(b, x + i, y + T - 1, 2, 1, col)
              rect(b, x, y + i, 1, 2, col)
              rect(b, x + T - 1, y + i, 1, 2, col)
            }
            if (soon) rect(b, x + 2, y + 2, T - 4, T - 4, t === RHYTHM_A ? 'rgba(255,154,122,0.35)' : 'rgba(90,214,198,0.35)')
          }
        }
        if (t === BLOCK_A || t === BLOCK_B) {
          const solid = t === BLOCK_A ? !w.switchOn : w.switchOn
          const skin = SWITCH_SKIN[this.city]
          // gölge oyunu: perde rengi ve siyah suret · gece-gündüz: güneş taşı ve ay taşı
          const col = skin === 'shadow' ? (t === BLOCK_A ? '#f0dca8' : '#3a2a44') : skin === 'daynight' ? (t === BLOCK_A ? '#f2c14e' : '#8ab4e8') : cbc(t === BLOCK_A ? '#e8794a' : '#4aa8e0')
          const inner = skin === 'shadow' ? (t === BLOCK_A ? '#c8ac6c' : '#1e1426') : skin === 'daynight' ? (t === BLOCK_A ? '#c8922a' : '#4a6ea8') : cbc(t === BLOCK_A ? '#c8582a' : '#2a7ab0')
          if (solid) {
            rect(b, x, y, T, T, col)
            rect(b, x + 1, y + 1, T - 2, T - 2, inner)
            rect(b, x + 3, y + 3, T - 6, T - 6, col)
            if (skin === 'daynight') disc(b, x + 8, y + 8, 3, t === BLOCK_A ? '#fff4c8' : '#e8f0ff')
            if (skin === 'daynight' && t === BLOCK_B) disc(b, x + 10, y + 7, 3, col)
            if (skin === 'shadow') rect(b, x + 5, y + 5, 6, 6, inner)
            rect(b, x + 1, y + 1, T - 2, 1, 'rgba(255,255,255,0.35)')
          } else {
            for (let i = 0; i < T; i += 4) {
              rect(b, x + i, y, 2, 1, col)
              rect(b, x + i, y + T - 1, 2, 1, col)
              rect(b, x, y + i, 1, 2, col)
              rect(b, x + T - 1, y + i, 1, 2, col)
            }
          }
          // renk körü: renge ek ikinci işaret, A bloğu daire, B bloğu üçgen (açıkken dolu, kapalıyken soluk)
          if (cb.mode !== 'yok' && !skin) this.drawBlockMark(b, x, y, t === BLOCK_A, solid)
        }
      }
  }

  /** renk körü: blok türünü renksiz gösteren simge (A: daire, B: üçgen) */
  private drawBlockMark(b: Ctx, x: number, y: number, isA: boolean, solid: boolean) {
    const col = solid ? '#14121f' : 'rgba(255,255,255,0.55)'
    if (isA) disc(b, x + 8, y + 8, 2, col)
    else for (let r = 0; r < 4; r++) rect(b, x + 8 - r, y + 6 + r, 1 + r * 2, 1, col)
  }

  private drawCrumbles(b: Ctx, w: World, cx: number, cy: number) {
    const s = CITY[this.city]
    const x0 = Math.floor(cx / T)
    const x1 = Math.ceil((cx + this.viewW) / T)
    const y0 = Math.max(0, Math.floor(cy / T))
    const y1 = Math.min(w.rows - 1, Math.ceil((cy + this.viewH) / T))
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        if (w.tile(tx, ty) !== CRUMBLE) continue
        const st = w.crumbles.get(ty * w.cols + tx)
        if (st?.broken) {
          if (st.respawn < 0.5) {
            b.globalAlpha = 0.3
            rect(b, tx * T, ty * T, T, T, s.tileLight)
            b.globalAlpha = 1
          }
          continue
        }
        // kırılmaya ne kadar kaldı: titreme artar, çatlak büyür, taş hafifçe çöker, toz dökülür
        const k = st ? Math.min(1, st.t / 0.42) : 0
        const shakeX = st ? Math.round(Math.sin(this.t * 90 + tx * 1.7) * 0.5 * (1 + k * 2)) : 0
        const sink = Math.round(k * 2)
        const x = tx * T + shakeX
        const y = ty * T + sink
        rect(b, x, y, T, 14 - sink, s.tileLight)
        rect(b, x, y, T, 2, s.tileTop)
        rect(b, x, y + 12 - sink, T, 2, s.tileDark)
        rect(b, x + 1, y + 2, 4, 1, 'rgba(255,240,210,0.35)')
        rect(b, x + 5, y + 2, 1, 4, s.tileDark)
        rect(b, x + 6, y + 5, 3, 1, s.tileDark)
        rect(b, x + 11, y + 4, 1, 5, s.tileDark)
        if (k > 0.3) {
          rect(b, x + 2, y + 6, 1, 5, s.tileDark)
          rect(b, x + 8, y + 7, 1, 4, s.tileDark)
          rect(b, x + 3, y + 9, 4, 1, s.tileDark)
        }
        if (k > 0.65) {
          rect(b, x + 7, y, 1, 12, s.tileDark)
          rect(b, x + 12, y + 8, 3, 1, s.tileDark)
        }
        if (st && this.chance(0.25 + k * 0.4)) this.particles.push({ x: tx * T + Math.random() * T, y: ty * T + 13, vx: (Math.random() - 0.5) * 10, vy: 10, life: 0.5, max: 0.5, color: s.tileLight, size: 1, grav: 200 })
      }
  }

  /** iç mekânın sütunları (dünya başına bir kez): tavanın altı (ilk boş satır); tavansız sütun -1 */
  private room: { w: World | null; top: Int16Array; buf: Int16Array; runs: [number, number][] } = { w: null, top: new Int16Array(0), buf: new Int16Array(0), runs: [] }

  /** çini lambrinin deseni (16x16, bir kez çizilir): turkuaz zemin, beyaz baklavalar şaşırtmalı; dünya koordinatına oturur */
  private tilePat: CanvasPattern | null = null
  private tilePattern(b: Ctx): CanvasPattern | string {
    if (this.tilePat) return this.tilePat
    if (typeof document === 'undefined') return '#2f8f9a'
    const cv = document.createElement('canvas')
    cv.width = T
    cv.height = T
    const c = cv.getContext('2d')
    if (!c) return '#2f8f9a'
    c.fillStyle = '#2f8f9a'
    c.fillRect(0, 0, T, T)
    c.fillStyle = '#e8f6f4'
    for (const [ox, oy] of [[0, 0], [8, 8]]) {
      c.fillRect(ox + 3, oy + 2, 2, 1)
      c.fillRect(ox + 2, oy + 3, 4, 1)
      c.fillRect(ox + 3, oy + 4, 2, 1)
    }
    this.tilePat = b.createPattern(cv, 'repeat')
    return this.tilePat ?? '#2f8f9a'
  }

  private roomOf(w: World) {
    if (this.room.w === w) return this.room
    const top = new Int16Array(w.cols).fill(-1)
    for (let tx = 0; tx < w.cols; tx++) {
      if (!w.isSolid(tx, 0)) continue
      let r = 1
      while (r < w.rows && w.isSolid(tx, r)) r++
      if (r < w.rows - 4) top[tx] = r
    }
    // açık büfe: tavanlı sütunların altında kızgın tepsi (diken) varsa orası büfe salonudur; duvara uzun tezgâh çizilir
    const buf = new Int16Array(w.cols).fill(-1)
    const runs: [number, number][] = []
    let start = -1
    for (let tx = 0; tx <= w.cols; tx++) {
      let hot = false
      if (tx < w.cols && top[tx] >= 0) for (let ty = top[tx]; ty < w.rows && !hot; ty++) hot = w.raw(tx, ty) === SPIKE_UP
      if (hot && start < 0) start = tx
      if (!hot && start >= 0) {
        if (tx - start >= 6) {
          runs.push([start, tx - 1])
          for (let k = start; k < tx; k++) buf[k] = k - start
        }
        start = -1
      }
    }
    this.room = { w, top, buf, runs }
    return this.room
  }

  /**
   * Açık büfe (termal otelin kahvaltı salonu): duvar boyu mermer tezgâh, üstünde sırayla büyük ve tanınır kahvaltılıklar
   * (benmari kapları, sucuklu yumurta, menemen, simit kulesi, semaver ve çay, kaymak ve bal, peynir, zeytin, domates,
   * kakaolu süt kutuları, bebe bisküvisi, lokum, portakal suyu), tepede piksel yazılı "AÇIK BÜFE" tabelası. Arka tampona,
   * yalnız görünen sütunlar; buhar saatten.
   */
  private drawBuffet(b: Ctx, w: World, a: number, z: number, from: number, to: number) {
    const top = this.room.top
    const cy = (w.rows - 7) * T // tezgâhın üstü: çini lambrinin hizası
    const t = w.clock
    const ITEMS = 14
    for (let tx = from; tx <= to; tx++) {
      const x = tx * T
      const k = tx - a
      // tezgâh: mermer üst, ahşap ön, pirinç şerit
      rect(b, x, cy - 3, T, 3, '#f4f0ea')
      rect(b, x, cy - 3, T, 1, '#ffffff')
      rect(b, x + ((k * 5) % 11), cy - 2, 4, 1, '#d8d0c8')
      // ön yüz soluk: arka plandır, üstüne basılmaz (çini lambri arasından görünür)
      rect(b, x, cy, T, 12, 'rgba(176,136,96,0.55)')
      rect(b, x, cy, T, 1, 'rgba(120,84,52,0.6)')
      if (k % 2 === 0) rect(b, x + 3, cy + 3, 10, 6, 'rgba(150,110,74,0.45)')
      if (tx === a || tx === z) continue
      const ix = x
      const iy = cy - 3 // eşyaların oturduğu çizgi
      switch ((k - 1) % ITEMS) {
        case 0: // benmari: gümüş kap, kapağı açık, içinde sucuklu yumurta
        case 7: {
          rect(b, ix + 1, iy - 6, 14, 6, '#aab2bc')
          rect(b, ix + 1, iy - 6, 14, 1, '#e4e8ee')
          rect(b, ix + 2, iy - 7, 12, 1, '#fff4e0')
          for (const dx of [3, 7, 11]) rect(b, ix + dx, iy - 8, 2, 2, '#fff8ee')
          for (const dx of [4, 8, 12]) rect(b, ix + dx, iy - 8, 1, 1, '#f2a81e')
          for (const dx of [5, 10]) rect(b, ix + dx, iy - 8, 1, 1, '#b8402e')
          // kapak arkada açık durur
          rect(b, ix + 2, iy - 14, 12, 2, '#c8ced6')
          rect(b, ix + 7, iy - 15, 2, 1, '#8a929c')
          break
        }
        case 1: // menemen tavası, sapı yana
          rect(b, ix + 1, iy - 4, 12, 4, '#2a2630')
          rect(b, ix + 2, iy - 5, 10, 1, '#e8582e')
          rect(b, ix + 3, iy - 5, 2, 1, '#f2c14e')
          rect(b, ix + 8, iy - 5, 2, 1, '#f2c14e')
          rect(b, ix + 6, iy - 6, 1, 1, '#5aa83e')
          rect(b, ix + 13, iy - 3, 3, 1, '#2a2630')
          break
        case 2: // simit kulesi
          for (let r = 0; r < 4; r++) {
            const ox = r % 2 ? 4 : 2
            rect(b, ix + ox, iy - 3 - r * 3, 10, 3, '#b8743a')
            rect(b, ix + ox + 3, iy - 2 - r * 3, 4, 1, '#7a4a22')
            rect(b, ix + ox + 1, iy - 3 - r * 3, 2, 1, '#f4e6c0')
          }
          break
        case 3: { // semaver: buhar tüter
          rect(b, ix + 4, iy - 14, 8, 14, '#c8a050')
          rect(b, ix + 4, iy - 14, 2, 14, '#f0d080')
          rect(b, ix + 6, iy - 17, 4, 3, '#a87a30')
          rect(b, ix + 12, iy - 8, 3, 1, '#a87a30')
          rect(b, ix + 3, iy - 2, 10, 2, '#8a6420')
          const ph = (t * 0.8) % 1
          b.globalAlpha = 0.6 * (1 - ph)
          rect(b, ix + 7, Math.round(iy - 19 - ph * 8), 2, 2, '#ffffff')
          b.globalAlpha = 1
          break
        }
        case 4: // ince belli çay bardakları, tabakta
          for (const dx of [1, 6, 11]) {
            rect(b, dx + ix, iy - 1, 4, 1, '#e4e8ee')
            rect(b, dx + ix, iy - 6, 4, 5, '#c84a1e')
            rect(b, dx + ix + 1, iy - 4, 2, 1, '#e8742e')
            rect(b, dx + ix, iy - 6, 4, 1, '#f4e6c0')
          }
          break
        case 5: // kaymak tabağı ve bal peteği (şehrin hatırası)
          rect(b, ix + 1, iy - 2, 14, 2, '#e4e8ee')
          rect(b, ix + 2, iy - 6, 7, 4, '#fff8e8')
          rect(b, ix + 3, iy - 7, 5, 1, '#fffdf6')
          rect(b, ix + 10, iy - 6, 5, 4, '#e8a43a')
          rect(b, ix + 11, iy - 5, 1, 1, '#f8d070')
          rect(b, ix + 13, iy - 4, 1, 1, '#f8d070')
          break
        case 6: // tekerlek peynir, bir dilimi kesik
          rect(b, ix + 2, iy - 7, 12, 7, '#f4dc8a')
          rect(b, ix + 2, iy - 7, 12, 1, '#fff0b0')
          rect(b, ix + 10, iy - 7, 4, 3, '#eadcc0')
          rect(b, ix + 5, iy - 4, 1, 1, '#d8b860')
          rect(b, ix + 8, iy - 2, 1, 1, '#d8b860')
          break
        case 8: // kakaolu süt kutuları (markasız): kahverengi kutu, sarı şerit, pipet
          for (const dx of [1, 6, 11]) {
            rect(b, ix + dx, iy - 9, 4, 9, '#7a4a2a')
            rect(b, ix + dx, iy - 9, 4, 1, '#a87a52')
            rect(b, ix + dx, iy - 6, 4, 2, '#f2c14e')
            rect(b, ix + dx + 2, iy - 12, 1, 3, '#f2f2f2')
          }
          break
        case 9: // bebe bisküvisi paketi ve tabakta bisküviler (markasız)
          rect(b, ix + 1, iy - 8, 8, 8, '#f2d24e')
          rect(b, ix + 2, iy - 6, 6, 2, '#e8794a')
          rect(b, ix + 3, iy - 8, 4, 1, '#ffffff')
          rect(b, ix + 9, iy - 1, 7, 1, '#e4e8ee')
          for (const [dx, dy] of [[10, 3], [13, 3], [11, 5]]) rect(b, ix + dx, iy - dy, 3, 2, '#e4b46a')
          break
        case 10: // zeytin kâsesi ve domates salatalık
          rect(b, ix + 1, iy - 4, 7, 4, '#ffffff')
          rect(b, ix + 2, iy - 5, 5, 1, '#2a2430')
          rect(b, ix + 3, iy - 6, 2, 1, '#4a5a2a')
          rect(b, ix + 9, iy - 4, 3, 3, '#d8342a')
          rect(b, ix + 9, iy - 5, 1, 1, '#4a8a2a')
          rect(b, ix + 12, iy - 3, 4, 2, '#6aae4a')
          rect(b, ix + 12, iy - 3, 4, 1, '#c8e8a8')
          break
        case 11: // portakal suyu sürahisi ve bardak
          rect(b, ix + 2, iy - 11, 7, 11, '#d8eef4')
          rect(b, ix + 3, iy - 9, 5, 8, '#f29a2e')
          rect(b, ix + 9, iy - 8, 2, 4, '#d8eef4')
          rect(b, ix + 12, iy - 5, 3, 5, '#d8eef4')
          rect(b, ix + 12, iy - 4, 3, 4, '#f29a2e')
          break
        case 12: // lokum tepsisi
          rect(b, ix + 1, iy - 2, 14, 2, '#c8a060')
          for (const [dx, c] of [[2, '#f2a8c0'], [6, '#ffffff'], [10, '#f2a8c0']] as const) {
            rect(b, ix + dx, iy - 5, 3, 3, c)
            rect(b, ix + dx + 2, iy - 8, 3, 3, c === '#ffffff' ? '#f2a8c0' : '#ffffff')
          }
          break
        default: // tabak kulesi ve çatal bıçak
          for (let r = 0; r < 5; r++) rect(b, ix + 2, iy - 1 - r * 2, 9, 1, r % 2 ? '#dfe4ea' : '#ffffff')
          rect(b, ix + 13, iy - 9, 1, 9, '#aab2bc')
          rect(b, ix + 15, iy - 8, 1, 8, '#aab2bc')
      }
    }
    // tabela: tezgâhın ortasında, tavandan iki zincirle; içinde piksel "AÇIK BÜFE"
    const mid = Math.floor((a + z) / 2)
    if (mid >= from - 3 && mid <= to + 3 && top[mid] >= 0) {
      const text = 'AÇIK BÜFE'
      const tw = text.length * 4 - 1
      const bw = tw + 8
      const bx = mid * T + T / 2 - Math.round(bw / 2)
      // tezgâhın biraz üstünde asılı (telefonda üst gösterge altında kalmasın)
      const by = Math.max(top[mid] * T + 22, cy - 46)
      rect(b, bx + 3, top[mid] * T + 4, 1, by - top[mid] * T - 4, '#5a4a3a')
      rect(b, bx + bw - 4, top[mid] * T + 4, 1, by - top[mid] * T - 4, '#5a4a3a')
      rect(b, bx - 1, by - 1, bw + 2, 13, '#5a3a20')
      rect(b, bx, by, bw, 11, '#2f5a4a')
      rect(b, bx, by, bw, 1, '#4a7a66')
      let px = bx + 4
      for (const ch of text) {
        const g = PIX_FONT[ch]
        if (g) for (let r = 0; r < 7; r++) for (let c = 0; c < 3; c++) if (g[r][c] === '#') rect(b, px + c, by + 2 + r, 1, 1, '#f8e8b8')
        px += 4
      }
    }
  }

  /**
   * Termal otelin içi (LevelDef.indoor): tavanlı sütunlarda gök yerine duvar. Krem sıva, altta turkuaz çini lambri (beyaz
   * baklava), ahşap pervaz; aralıklı kemerli pencere (dışarıda buhar) ve tavandan sarkan lamba. Büfe masalarında (altı su
   * olmayan tek yönlü tahta) yemek tepsileri, havuz yüzünde buhar. Otelin içinde sokak feneri ve ağaç süsü çizilmez. Arka tampona, saate bağlı (her Hz'de aynı), yalnız görünen sütunlar.
   */
  private drawInterior(b: Ctx, w: World, cx: number) {
    const { top, buf, runs } = this.roomOf(w)
    const x0 = Math.max(0, Math.floor(cx / T) - 1)
    const x1 = Math.min(w.cols - 1, Math.ceil((cx + this.viewW) / T) + 1)
    const t = w.clock
    for (let tx = x0; tx <= x1; tx++) {
      if (top[tx] < 0) continue
      const x = tx * T
      const y0 = top[tx] * T
      // duvar haritanın dibine dek: taş, seki ve su önde çizilir (araya giren seki altında gök kalmaz)
      const y1 = w.rows * T
      rect(b, x, y0, T, y1 - y0, '#eadcc0')
      // sıva dokusu: birkaç ince yatay iz
      for (let k = 0; k < 4; k++) rect(b, x + ((tx * 5 + k * 7) % 9), y0 + 9 + k * 23 + (tx % 3) * 4, 4, 1, 'rgba(160,130,90,0.12)')
      // tavan pervazı
      rect(b, x, y0, T, 3, '#8a6a48')
      rect(b, x, y0 + 3, T, 1, '#c8a060')
      // çini lambri: bütün odada aynı hizada (yürünen satırın iki karo üstü), zemine dek
      const wy = Math.max(y0 + 4, (w.rows - 7) * T)
      b.fillStyle = this.tilePattern(b)
      b.fillRect(x, wy, T, y1 - wy)
      rect(b, x, wy, T, 2, '#c8a060')
      // tavan lambası
      if (tx % 7 === 1) {
        rect(b, x + 7, y0 + 4, 1, 7, '#5a4a3a')
        rect(b, x + 4, y0 + 11, 7, 3, '#e8b04a')
        rect(b, x + 5, y0 + 14, 5, 1, 'rgba(255,232,170,0.9)')
        rect(b, x + 2, y0 + 15, 11, 4, 'rgba(255,232,170,0.18)')
      }
      // büfe masası: tek yönlü tahtanın üstünde tepsi ve yemek
      for (let ty = top[tx]; ty < w.rows; ty++) {
        // havuzun üstündeki ızgara masa değildir (altı su)
        if (w.raw(tx, ty) !== ONEWAY || w.isSolid(tx, ty - 1) || w.tile(tx, ty + 1) === SWIM) continue
        const by = ty * T
        rect(b, x + 1, by - 2, T - 2, 2, '#c8ccd4')
        rect(b, x + 1, by - 1, T - 2, 1, '#9aa0aa')
        // kahvaltı büfesi: masa masa başka yemek (sütuna göre sabit)
        switch (tx % 9) {
          case 0: // sucuklu yumurta tavası
            rect(b, x + 3, by - 4, 10, 2, '#3a3440')
            rect(b, x + 4, by - 5, 8, 1, '#fff4e0')
            rect(b, x + 6, by - 5, 2, 1, '#f2b134')
            for (const dx of [4, 9]) rect(b, x + dx, by - 5, 2, 1, '#b8402e')
            rect(b, x + 13, by - 4, 2, 1, '#3a3440')
            break
          case 1: // rulo kaymak ve bal
            rect(b, x + 4, by - 5, 8, 3, '#fff8e8')
            rect(b, x + 9, by - 5, 2, 1, '#e8a43a')
            rect(b, x + 11, by - 3, 1, 1, '#e8a43a')
            break
          case 2: // simit
            rect(b, x + 4, by - 5, 7, 3, '#b87a3a')
            rect(b, x + 6, by - 4, 3, 1, '#c8ccd4')
            rect(b, x + 5, by - 5, 1, 1, '#f4e6c0')
            break
          case 3: // ince belli çay bardakları
            for (const dx of [4, 9]) {
              rect(b, x + dx, by - 6, 3, 4, '#c8502a')
              rect(b, x + dx, by - 6, 3, 1, '#f4e6c0')
            }
            break
          case 4: // menemen tavası
            rect(b, x + 3, by - 4, 10, 2, '#3a3440')
            rect(b, x + 4, by - 5, 8, 1, '#e8582e')
            rect(b, x + 5, by - 5, 2, 1, '#f2c14e')
            rect(b, x + 9, by - 5, 1, 1, '#6aae4a')
            break
          case 5: // peynir ve zeytin tabağı
            rect(b, x + 3, by - 4, 5, 2, '#fffaf0')
            for (const dx of [9, 11, 13]) rect(b, x + dx, by - 4, 1, 1, '#2a2430')
            rect(b, x + 10, by - 5, 1, 1, '#4a5a2a')
            break
          case 6: // kakaolu süt kutusu (markasız), yanında bardak
            rect(b, x + 4, by - 9, 5, 7, '#7a4a2a')
            rect(b, x + 4, by - 9, 5, 1, '#f4e6c0')
            rect(b, x + 5, by - 6, 3, 2, '#f2c14e')
            rect(b, x + 10, by - 5, 3, 3, '#a87a52')
            rect(b, x + 10, by - 5, 3, 1, '#fff4e8')
            break
          case 7: // bebe bisküvisi paketi (markasız) ve tabakta bisküviler
            rect(b, x + 3, by - 6, 6, 4, '#f2d24e')
            rect(b, x + 4, by - 5, 4, 1, '#e8794a')
            for (const dx of [10, 12]) rect(b, x + dx, by - 3, 2, 1, '#e4b46a')
            rect(b, x + 11, by - 4, 2, 1, '#e4b46a')
            break
          default: // domates, salatalık ve lokum
            rect(b, x + 3, by - 4, 3, 2, '#d8342a')
            rect(b, x + 7, by - 4, 3, 2, '#6aae4a')
            rect(b, x + 7, by - 4, 3, 1, '#c8e8a8')
            rect(b, x + 11, by - 4, 3, 2, '#f2a8c0')
        }
      }
    }
    for (const [a, z] of runs) if (z >= x0 - 2 && a <= x1 + 2) this.drawBuffet(b, w, a, z, Math.max(a, x0 - 1), Math.min(z, x1 + 1))
    // kemerli pencereler: duvarlardan sonra (iki karo genişliğinde, komşu sütunun duvarı üstüne binmesin); oda yeterince yüksekse
    for (let tx = x0; tx <= x1; tx++) {
      if (tx % 9 !== 3 || top[tx] < 0 || top[tx + 1] < 0 || buf[tx] >= 0 || buf[tx + 1] >= 0) continue
      const y0 = top[tx] * T
      const wt = y0 + T + 2
      const wh = Math.min((w.rows - 7) * T - wt - T, 3 * T)
      if (wh < T * 2) continue
      const wx = tx * T + 6
      const ww = 2 * T - 12
      rect(b, wx - 2, wt - 2, ww + 4, wh + 4, '#8a6a48')
      rect(b, wx, wt, ww, wh, '#bfe2ee')
      // kemer: üst köşeler pervaz renginde yuvarlatılır
      rect(b, wx, wt, 3, 2, '#8a6a48')
      rect(b, wx + ww - 3, wt, 3, 2, '#8a6a48')
      rect(b, wx, wt + 2, 1, 2, '#8a6a48')
      rect(b, wx + ww - 1, wt + 2, 1, 2, '#8a6a48')
      rect(b, wx + 3, wt + 3, ww - 6, 2, '#d8eef4')
      // dışarıda geçen buhar bulutu
      const sx = (t * 5 + tx * 13) % (ww + 8)
      rect(b, Math.round(wx - 4 + sx), wt + wh - 10, 7, 3, 'rgba(255,255,255,0.75)')
      rect(b, wx + Math.floor(ww / 2), wt, 1, wh, '#8a6a48')
      rect(b, wx, wt + Math.floor(wh / 2), ww, 1, '#8a6a48')
    }
    // sıcak havuz: yüzeyden tüten buhar (tavanlı sütunlarda)
    for (let tx = x0; tx <= x1; tx++) {
      if (top[tx] < 0) continue
      for (let ty = top[tx]; ty < w.rows; ty++) {
        if (w.tile(tx, ty) !== SWIM || w.tile(tx, ty - 1) === SWIM) continue
        // havuz kenarı duvarında askıda çizgili havlu (dört sütunda bir; renkleri sırayla)
        if (tx % 4 === 0) {
          const hy = (w.rows - 7) * T - 10
          const col = ['#f08aa8', '#7ac8d8', '#f2c14e'][Math.floor(tx / 4) % 3]
          rect(b, tx * T + 6, hy, 4, 1, '#8a6a48')
          rect(b, tx * T + 5, hy + 1, 6, 8, '#fffaf4')
          rect(b, tx * T + 5, hy + 3, 6, 2, col)
          rect(b, tx * T + 5, hy + 7, 6, 1, col)
        }
        for (let k = 0; k < 2; k++) {
          const ph = (t * 0.7 + tx * 0.37 + k * 0.5) % 1
          const yy = ty * T - 2 - ph * 14
          const xx = tx * T + 3 + k * 7 + Math.round(Math.sin(t * 2 + tx + k) * 2)
          b.globalAlpha = 0.5 * (1 - ph)
          rect(b, xx, Math.round(yy), 3, 2, '#ffffff')
          b.globalAlpha = 1
        }
        break
      }
    }
  }

  /**
   * Yükselen hava (V): sütunun içi sıcak, yarı saydam bir hava; içinde yukarı akan çizgiler, tüyler ve kuru yapraklar.
   * Sütunun tepesinde dalgalı bir kenar: oyuncu nereye dek taşınacağını görür. Hepsi saatten (her Hz'de aynı).
   */
  private drawLift(b: Ctx, w: World, cx: number, cy: number) {
    const x0 = Math.floor(cx / T) - 1
    const x1 = Math.ceil((cx + this.viewW) / T) + 1
    const y0 = Math.max(0, Math.floor(cy / T) - 1)
    const y1 = Math.min(w.rows - 1, Math.ceil((cy + this.viewH) / T) + 1)
    const t = w.clock
    for (let tx = x0; tx <= x1; tx++)
      for (let ty = y0; ty <= y1; ty++) {
        if (!w.isLift(tx, ty)) continue
        const x = tx * T
        const y = ty * T
        const top = !w.isLift(tx, ty - 1)
        rect(b, x, y, T, T, top ? 'rgba(255,230,170,0.14)' : 'rgba(255,230,170,0.22)')
        // yukarı akan ince çizgiler: karoya göre kaymış, hızı termalin hızıyla orantılı
        for (let k = 0; k < 3; k++) {
          const ph = (tx * 37 + k * 53) % 97
          const yy = y + T - (((t * THERMAL.rise * 0.45 + ph * 3) % (T + 6)) | 0)
          const xx = x + 2 + ((k * 5 + tx * 3) % 12)
          if (yy >= y - 4 && yy <= y + T) rect(b, xx, yy, 1, 4, 'rgba(255,248,226,0.55)')
        }
        // arada bir yukarı süzülen tüy ya da yaprak
        const f = (t * 0.9 + ((tx * 13 + ty * 7) % 11) * 0.37) % 4
        if (f < 1) {
          const fy = y + T - f * T
          const fx = x + 8 + Math.sin(t * 3 + tx) * 3
          rect(b, Math.round(fx), Math.round(fy), 2, 1, (tx + ty) % 3 === 0 ? '#e8b04a' : '#ffffff')
          rect(b, Math.round(fx) + 1, Math.round(fy) - 1, 1, 1, 'rgba(255,255,255,0.7)')
        }
        if (top) {
          // tepe kenarı: dalgalı, hafif parlayan çizgi
          for (let i = 0; i < T; i += 2) rect(b, x + i, y + Math.round(1.5 + Math.sin(t * 4 + (x + i) * 0.4) * 1.5), 2, 1, 'rgba(255,244,214,0.6)')
        }
      }
  }

  /**
   * Donan su (Z): buzken açık mavi buz (kenarı beyaz, içinde kabarcık), erimeden önce çatlaklar büyür ve yanıp söner;
   * suyken suyu drawWater çizer, donmadan önce yüzeyde kırağı çizgisi belirir. Hepsi saatten (her Hz'de aynı).
   */
  private drawFrost(b: Ctx, w: World, cx: number, cy: number) {
    const x0 = Math.floor(cx / T) - 1
    const x1 = Math.ceil((cx + this.viewW) / T) + 1
    const y0 = Math.max(0, Math.floor(cy / T) - 1)
    const y1 = Math.min(w.rows - 1, Math.ceil((cy + this.viewH) / T) + 1)
    const left = FROST_CYCLE.half - (w.clock % FROST_CYCLE.half)
    const soon = left < FROST_CYCLE.warn
    const crack = soon ? 1 - left / FROST_CYCLE.warn : 0
    for (let tx = x0; tx <= x1; tx++)
      for (let ty = y0; ty <= y1; ty++) {
        if (!w.isFrost(tx, ty)) continue
        const x = tx * T
        const y = ty * T
        const ice = w.tile(tx, ty) === ICE
        const top = !w.isFrost(tx, ty - 1) && !w.isSolid(tx, ty - 1)
        if (ice) {
          const blink = soon && Math.floor(left * 12) % 2 === 0
          b.globalAlpha = blink ? 0.6 : 1
          rect(b, x, y, T, T, '#9fd4ec')
          rect(b, x, y, T, top ? 3 : 1, '#e8f8ff')
          rect(b, x + 3 + ((tx * 5) % 7), y + 6 + ((ty * 3) % 5), 2, 2, 'rgba(255,255,255,0.7)')
          rect(b, x + 10 - ((tx * 3) % 5), y + 10, 1, 1, 'rgba(255,255,255,0.8)')
          if (!w.isFrost(tx, ty + 1)) rect(b, x, y + T - 1, T, 1, '#6aa6c8')
          if (crack > 0) {
            // çatlak: erimeye yaklaştıkça uzar
            const n = Math.ceil(crack * 8)
            for (let i = 0; i < n; i++) rect(b, x + 3 + i, y + 4 + ((i * 7 + tx) % 3) + (i > 4 ? i - 4 : 0), 1, 1, '#3a6e94')
          }
          b.globalAlpha = 1
        } else if (soon && top) {
          // donacak yüzey: kırağı kenardan ortaya yürür
          const k = Math.ceil(crack * (T / 2))
          rect(b, x, y, k, 2, 'rgba(240,252,255,0.85)')
          rect(b, x + T - k, y, k, 2, 'rgba(240,252,255,0.85)')
        }
      }
  }

  private drawWater(b: Ctx, w: World, cx: number, cy: number) {
    const s = CITY[this.city]
    const x0 = Math.floor(cx / T)
    const x1 = Math.ceil((cx + this.viewW) / T)
    for (let tx = x0; tx <= x1; tx++) {
      let depth = 0
      for (let ty = 0; ty < w.rows; ty++) {
        const kind = w.tile(tx, ty)
        // gelgit suyu kendi çizilir (drawTide): yüzü karo karo değil, akıcı iner çıkar
        if ((kind !== WATER && kind !== SWIM) || w.isTide(tx, ty)) {
          depth = 0
          continue
        }
        // yüzülen su açık turkuaz (öldüren su şehrin koyu suyu): ikisi karışmasın
        const pal = kind === SWIM ? SWIM_COLORS : s.water
        const surface = depth === 0
        const x = tx * T
        const y = ty * T
        if (w.poison.has(ty * w.cols + tx)) {
          this.drawPoison(b, x, y, tx, surface)
          depth++
          continue
        }
        rect(b, x, y + (surface ? 6 : 0), T, T - (surface ? 6 : 0), pal[ty % 2 ? 1 : 0])
        // derinlik: aşağı indikçe koyulaşır
        const dk = Math.min(0.42, depth * 0.11)
        if (dk > 0) rect(b, x, y, T, T, `rgba(8,14,36,${dk.toFixed(2)})`)
        else rect(b, x, y + 12, T, 4, 'rgba(8,14,36,0.06)')
        // öldüren su yüzülen sudan ayrı okunsun: daha koyu ve bulanık, yüzeyinde sivri köpük dişleri (girilmez)
        if (kind === WATER) rect(b, x, y + (surface ? 6 : 0), T, T - (surface ? 6 : 0), `rgba(10,8,28,${Math.min(0.55, 0.28 + depth * 0.1).toFixed(2)})`)
        // renk körü: öldüren su dikey çizgili (yüzülen suyla renkten bağımsız ayrılır)
        if (kind === WATER && cb.mode !== 'yok') for (let i = 1; i < T; i += 4) rect(b, x + i, y + (surface ? 6 : 0), 1, T - (surface ? 6 : 0), 'rgba(255,236,190,0.3)')
        if (surface && kind === WATER) {
          const off = Math.floor(this.t * 5)
          for (let i = 0; i < 16; i++) {
            const k = (i + off + tx * 3) % 4
            // sivri diş: tepe beyaz, etek mavimsi; sırayla kayar (yüzülen suyun yuvarlak dalgasından belirgin farklı)
            const h = k === 0 ? 4 : k === 1 || k === 3 ? 2 : 1
            rect(b, x + i, y + 7 - h, 1, h, k === 0 ? 'rgba(248,250,255,1)' : 'rgba(200,214,236,0.85)')
          }
          rect(b, x, y + 7, T, 1, 'rgba(10,8,28,0.6)')
        } else if (surface) {
          for (let i = 0; i < 16; i++) {
            const h = Math.round(Math.sin(this.t * 3 + (x + i) * 0.35) * 1.2)
            rect(b, x + i, y + 6 + h, 1, 2, pal[2])
            // dalga tepesinde köpük
            if (h < 0) rect(b, x + i, y + 6 + h, 1, 1, 'rgba(240,250,255,0.75)')
          }
          // kayan pırıltılar (yalnız yüzülen suda: berrak)
          for (let g = 0; g < (kind === SWIM ? 2 : 0); g++) {
            const gx = Math.floor((this.t * (14 + g * 6) + tx * 37 + g * 9) % 16)
            if ((Math.floor(this.t * 2 + tx + g) & 3) !== 0) rect(b, x + gx, y + 9 + g * 3, 2, 1, 'rgba(255,255,255,0.55)')
          }
          // kıyıya vuran köpük
          const shoreL = w.tile(tx - 1, ty) !== kind && w.tile(tx - 1, ty) !== 0
          const shoreR = w.tile(tx + 1, ty) !== kind && w.tile(tx + 1, ty) !== 0
          const surf = Math.round((Math.sin(this.t * 2.2 + tx) + 1) * 1.5)
          if (shoreL) rect(b, x, y + 5, 2 + surf, 2, 'rgba(240,250,255,0.7)')
          if (shoreR) rect(b, x + T - 2 - surf, y + 5, 2 + surf, 2, 'rgba(240,250,255,0.7)')
        } else if (((tx * 7 + ty * 3 + Math.floor(this.t * 1.5)) % 5) === 0) {
          // derinde ışık oyunu
          const lx = Math.floor((this.t * 6 + tx * 11) % 14)
          rect(b, x + lx, y + 4, 3, 1, 'rgba(200,235,255,0.08)')
          rect(b, x + lx + 2, y + 5, 3, 1, 'rgba(200,235,255,0.06)')
        }
        depth++
      }
    }
    void cy
  }

  /**
   * Zehirli su karosu: koyu, bulanık yeşil gövde; parlayan köpüklü yüzey; dipten yükselip yüzeyde patlayan kabarcıklar;
   * üstte soluk buhar. Çimenle karışmasın diye gövde koyu ve mor gölgeli, yüzey kıvrak. Her şey saate bağlı.
   */
  private drawPoison(b: Ctx, x: number, y: number, tx: number, surface: boolean) {
    const top = surface ? 5 : 0
    rect(b, x, y + top, T, T - top, POISON_COLORS[1])
    rect(b, x, y + top + 5, T, T - top - 5, 'rgba(40,20,50,0.45)')
    rect(b, x, y + T - 3, T, 3, 'rgba(30,12,40,0.4)')
    if (!surface) return
    for (let i = 0; i < 16; i++) {
      const h = Math.round(Math.sin(this.t * 2.4 + (x + i) * 0.45) * 1.2)
      rect(b, x + i, y + 5 + h, 1, 2, POISON_COLORS[0])
      if (h < 0) rect(b, x + i, y + 5 + h, 1, 1, POISON_COLORS[2])
    }
    // kabarcıklar: dipten yükselir, yüzeye varınca patlar (karoya göre ayrı faz)
    for (let k = 0; k < 3; k++) {
      const ph = (this.t * (0.6 + k * 0.22) + tx * 0.37 + k * 0.33) % 1
      const bx = x + 2 + ((tx * 5 + k * 5) % 11)
      if (ph < 0.82) {
        const by = Math.round(y + 14 - (ph / 0.82) * 8)
        const r = k === 0 ? 3 : 2
        rect(b, bx, by, r, r, POISON_COLORS[0])
        rect(b, bx, by, 1, 1, POISON_COLORS[2])
      } else {
        // yüzeyde patlama: sıçrayan damlalar
        const up = Math.round((ph - 0.82) * 30)
        rect(b, bx - 1, y + 4 - up, 1, 1, POISON_COLORS[2])
        rect(b, bx + 2, y + 4 - up, 1, 1, POISON_COLORS[2])
        rect(b, bx, y + 5, 2, 1, POISON_COLORS[2])
      }
    }
    // zehir buharı: yükselip solar
    for (let k = 0; k < 2; k++) {
      const vap = (this.t * 0.45 + tx * 0.29 + k * 0.5) % 1
      const vx = x + ((tx * 3 + k * 7) % 12) + Math.round(Math.sin(this.t + tx + k) * 1.5)
      rect(b, vx, Math.round(y + 3 - vap * 14), 3, 2, `rgba(170,230,90,${(0.4 * (1 - vap)).toFixed(2)})`)
    }
  }

  /**
   * Yüzen ada (Bingöl): kök ve turba gövdeli, üstü çimenli, kamışlı sazlık ada. Battıkça sallanır ve koyulaşır; gömülmeye az
   * kala kabarcık çıkar; suyun altındayken yalnız soluk gölgesi ve kabarcıklar görünür. Hepsi saatten ve adanın hâlinden.
   */
  private drawIsland(b: Ctx, pl: { x: number; y: number; w: number; min: number; max: number; under?: number }, t: number) {
    const sink = (pl.y - pl.min) / Math.max(1, pl.max - pl.min)
    const x = Math.round(pl.x)
    const y = Math.round(pl.y)
    if (pl.under) {
      b.globalAlpha = 0.35
      rect(b, x + 1, y + 2, pl.w - 2, 5, '#1e4a3a')
      b.globalAlpha = 1
      for (let i = 0; i < 3; i++) {
        const ph = (t * 1.6 + i * 0.33 + pl.x * 0.01) % 1
        rect(b, x + 4 + ((i * 11) % Math.max(4, pl.w - 6)), Math.round(y - ph * 8), 2, 2, 'rgba(230,250,255,0.75)')
      }
      return
    }
    // sallantı: batarken iki yana yatar (saatle)
    const wob = sink > 0.05 ? Math.round(Math.sin(t * 18) * sink * 1.5) : 0
    // gövde suya gömülü: turba suyun içine dek iner (su yüzü adanın 4 px altında), altta su rengine karışan kök
    rect(b, x - 1, y + 2, pl.w + 2, 9, 'rgba(14,20,24,0.35)')
    rect(b, x, y + 1, pl.w, 7, sink > 0.6 ? '#4a3a26' : '#5e4a2e')
    rect(b, x, y + 5, pl.w, 3, '#3a2c1c')
    rect(b, x + 1, y + 8, pl.w - 2, 3, 'rgba(58,44,28,0.55)')
    for (let i = 3; i < pl.w; i += 6) rect(b, x + i, y + 10, 1, 3, 'rgba(58,44,28,0.5)')
    // su yüzünde adanın çevresinde ince köpük halkası
    rect(b, x - 2, y + 4, 2, 1, 'rgba(230,250,255,0.7)')
    rect(b, x + pl.w, y + 4, 2, 1, 'rgba(230,250,255,0.7)')
    // çimen örtüsü
    rect(b, x, y, pl.w, 2, sink > 0.6 ? '#4f8a3e' : '#6aae4a')
    rect(b, x, y, pl.w, 1, '#9ad06a')
    // kamış ve saz başları
    for (let i = 2; i < pl.w - 1; i += 5) {
      const h = 4 + ((i * 7 + x) % 4)
      const lean = wob + (((i + x) % 3) - 1)
      rect(b, x + i + Math.round(lean / 2), y - h, 1, h, '#5e9a3e')
      if ((i + x) % 2 === 0) rect(b, x + i + lean, y - h - 2, 1, 3, '#7a5432')
    }
    // gömülmeye az kala kabarcık
    if (sink > 0.7) for (let i = 0; i < 2; i++) rect(b, x + 3 + i * (pl.w - 8), y + 6 - Math.round(((t * 3 + i) % 1) * 4), 2, 1, 'rgba(230,250,255,0.8)')
  }

  private drawEntities(b: Ctx, w: World) {
    const s = CITY[this.city]
    // platformlar
    for (const pl of w.platforms) {
      if (pl.axis === 'b') {
        this.drawBalloon(b, pl)
        continue
      }
      if (pl.axis === 'h') {
        this.drawHoron(b, pl)
        continue
      }
      if (pl.axis === 'f') {
        this.drawIsland(b, pl, w.clock)
        continue
      }
      if (pl.axis === 'o') {
        // sema halkası: merkeze ince ip, turkuaz dönen tepsi
        const cx = Math.round(pl.cx!)
        const cy = Math.round(pl.cy!)
        disc(b, cx, cy, 2, '#f2c14e')
        const n = 8
        for (let k = 1; k < n; k++) rect(b, cx + ((pl.x + pl.w / 2 - cx) * k) / n, cy + ((pl.y + 3 - cy) * k) / n, 1, 1, 'rgba(244,234,216,0.55)')
        rect(b, pl.x, pl.y, pl.w, 5, '#2f9a94')
        rect(b, pl.x, pl.y, pl.w, 1, '#7ad8cc')
        rect(b, pl.x, pl.y + 4, pl.w, 1, '#1e6a66')
        for (let i = 2; i < pl.w; i += 5) rect(b, pl.x + i, pl.y + 2, 2, 1, '#f4ead8')
        continue
      }
      rect(b, pl.x - 1, pl.y + 1, pl.w + 2, 6, 'rgba(18,12,26,0.55)')
      rect(b, pl.x, pl.y, pl.w, 6, s.plank)
      rect(b, pl.x, pl.y, pl.w, 1, lighten(s.plank))
      rect(b, pl.x, pl.y + 5, pl.w, 1, 'rgba(0,0,0,0.45)')
      rect(b, pl.x, pl.y + 6, pl.w, 2, 'rgba(0,0,0,0.18)')
      for (let i = 8; i < pl.w; i += 8) rect(b, pl.x + i, pl.y + 1, 1, 4, 'rgba(0,0,0,0.3)')
      for (let i = 3; i < pl.w; i += 8) rect(b, pl.x + i, pl.y + 2, 1, 1, 'rgba(255,240,210,0.55)')
      if (this.city === 'ordu') {
        // teleferik kabini: askı ve kırmızı gövde
        rect(b, pl.x + pl.w / 2 - 1, pl.y - 30, 2, 30, '#2a3a30')
        rect(b, pl.x - 30, pl.y - 31, pl.w + 60, 1, '#2a3a30')
        rect(b, pl.x + 4, pl.y + 6, pl.w - 8, 10, '#d6403a')
        rect(b, pl.x + 7, pl.y + 8, pl.w - 14, 4, '#cfe8f0')
      }
      if (w.level.indoor) {
        // servis arabası: paslanmaz ayaklar, tekerlek, alt rafta çaydanlık ve tabaklar
        rect(b, pl.x + 1, pl.y + 6, 2, 12, '#9aa2ac')
        rect(b, pl.x + pl.w - 3, pl.y + 6, 2, 12, '#9aa2ac')
        rect(b, pl.x + 1, pl.y + 14, pl.w - 2, 2, '#c8ced6')
        disc(b, pl.x + 3, pl.y + 19, 2, '#2a2630')
        disc(b, pl.x + pl.w - 3, pl.y + 19, 2, '#2a2630')
        rect(b, pl.x + 6, pl.y + 9, 6, 5, '#d8d0c8')
        rect(b, pl.x + 7, pl.y + 8, 4, 1, '#aab2bc')
        rect(b, pl.x + 12, pl.y + 10, 2, 1, '#aab2bc')
        for (let i = 18; i < pl.w - 6; i += 8) {
          rect(b, pl.x + i, pl.y + 12, 6, 2, '#ffffff')
          rect(b, pl.x + i + 1, pl.y + 11, 4, 1, '#f2c14e')
        }
      }
      if (this.city === 'istanbul') {
        // iskele dubaları
        rect(b, pl.x + 2, pl.y + 6, 6, 3, '#e8794a')
        rect(b, pl.x + pl.w - 8, pl.y + 6, 6, 3, '#e8794a')
      }
    }
    // bakırcı tokmakları
    for (const h of w.hammers) {
      const st = hammerState(h, w.clock)
      const shake = st.phase === 1 ? Math.round(Math.sin(this.t * 70)) : 0
      const hx = h.x + shake
      // sap: tavana kadar
      let topY = h.top - T
      while (topY > 0 && !w.isSolid(Math.floor((h.x + 8) / T), Math.floor(topY / T))) topY -= T
      rect(b, hx + 7, topY + T, 2, st.y - topY - T + 2, '#5a3c26')
      rect(b, hx + 6, topY + T, 4, 2, '#3a2a1e')
      // baş: bakır, alt yüzü parlak
      rect(b, hx, st.y + 2, T, T - 2, '#b8682e')
      rect(b, hx, st.y + 2, T, 2, '#e8904a')
      rect(b, hx, st.y + T - 2, T, 2, '#7a3a14')
      rect(b, hx + 2, st.y + 5, 3, 6, '#f0b070')
      if (st.phase === 1) {
        // uyarı: yerde gölge ve kıvılcım
        rect(b, h.x + 1, h.bottom + T - 1, T - 2, 1, 'rgba(255,80,60,0.6)')
      }
      if (st.phase === 3 && this.chance(0.3)) this.particles.push({ x: h.x + Math.random() * T, y: h.bottom + T - 1, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 40, life: 0.3, max: 0.3, color: '#ffd36a', size: 1, grav: 300 })
    }
    // bayraklar
    for (const cp of w.checkpoints) this.drawFlag(b, cp)
    // çıkış kapısı
    this.drawExit(b, w.exit)
    if (w.warp) this.drawExit(b, w.warp, true)
    // basınç plakaları
    for (const pl of w.plates) {
      rect(b, pl.x, pl.y + (pl.pressed ? 2 : 0), pl.w, pl.pressed ? 2 : 4, cbc(w.switchOn ? '#4aa8e0' : '#e8794a'))
      rect(b, pl.x - 1, pl.y + 3, pl.w + 2, 1, '#2a2438')
    }
    // ok tuzağı yükleniyor: atıştan hemen önce yarık kızarır
    for (const tr of w.turrets) {
      if (tr.timer < 0.5) {
        const a = 1 - tr.timer / 0.5
        b.globalAlpha = 0.4 + a * 0.6
        rect(b, tr.tx * T + 3, tr.ty * T + 6, 10, 3, cbc('#ff4a3a'))
        disc(b, tr.tx * T + (tr.dir > 0 ? 15 : 1), tr.ty * T + 7, 2 + Math.round(a * 2), 'rgba(255,90,60,0.5)')
        b.globalAlpha = 1
      }
    }
    // oklar
    for (const pr of w.projectiles) {
      if (pr.towel) {
        // havuz teyzesinin havlusu: dönerek uçan, pembe-beyaz çizgili, saçaklı katlı havlu (dönüş saatten ve konumdan)
        const px = Math.round(pr.x + pr.w / 2)
        const py = Math.round(pr.y + pr.h / 2)
        const spin = Math.floor((this.t * 14 + pr.x * 0.05) % 4)
        const flat = spin === 0 || spin === 2
        const hw = flat ? 6 : 3
        const hh = flat ? 3 : 5
        rect(b, px - hw - 1, py - hh - 1, hw * 2 + 2, hh * 2 + 2, '#1a1424')
        rect(b, px - hw, py - hh, hw * 2, hh * 2, '#fff4f4')
        if (flat) for (let i = -hw + 1; i < hw; i += 3) rect(b, px + i, py - hh, 1, hh * 2, '#f08aa8')
        else for (let j = -hh + 1; j < hh; j += 3) rect(b, px - hw, py + j, hw * 2, 1, '#f08aa8')
        // saçak ve arkasında kısa iz
        rect(b, flat ? px + hw : px - 1, flat ? py - 1 : py + hh, flat ? 2 : 3, flat ? 3 : 2, '#ffffff')
        rect(b, px - Math.sign(pr.vx) * (hw + 4), py, 3, 1, 'rgba(255,255,255,0.45)')
        continue
      }
      if (pr.w > 6) {
        // boss’un savurduğu: şehrin vurgu renginde top, arkasında iz
        const px = Math.round(pr.x + pr.w / 2)
        const py = Math.round(pr.y + pr.h / 2)
        disc(b, px - Math.sign(pr.vx) * 3, py - (pr.vy ? Math.sign(pr.vy) * 2 : 0), 2, 'rgba(255,255,255,0.3)')
        disc(b, px, py, 4, '#120f1a')
        // Kara Elmas Devi kömür savurur: kara topak, kor gibi kenar
        disc(b, px, py, 3, this.bossCity === 'zonguldak' ? '#2a2630' : s.accent)
        if (this.bossCity === 'zonguldak') rect(b, px - 1, py + 1, 3, 1, '#f2a12e')
        rect(b, px - 2, py - 2, 2, 1, 'rgba(255,255,255,0.7)')
        continue
      }
      // ok: koyu mürekkep hat, açık gövde, kırmızı uç ve arkasında kısa iz; açık gökte (Muğla, Denizli) de seçilsin
      const x = Math.round(pr.x)
      const y = Math.round(pr.y)
      const f = pr.vx > 0 ? 1 : -1
      const tail = f > 0 ? x - 6 : x + 6
      rect(b, Math.min(tail, x), y + 1, 6, 1, 'rgba(255,255,255,0.35)')
      rect(b, x - 1, y, 8, 3, '#1a1220')
      rect(b, x, y + 1, 6, 1, '#f4e6c0')
      rect(b, f > 0 ? x + 5 : x - 1, y - 1, 2, 5, '#1a1220')
      rect(b, f > 0 ? x + 6 : x - 1, y, 1, 3, cbc('#e5484d'))
      rect(b, f > 0 ? x : x + 5, y, 1, 3, '#c8553d')
    }
  }

  /** Bayrak: taş kaide, gölgeli direk, altın topuz. Dokunulunca bez göndere çekilir ve sütun sütun dalgalanır. */
  private drawFlag(b: Ctx, cp: { x: number; y: number; h: number; index: number; active: boolean }) {
    const x = cp.x
    const bot = cp.y + cp.h
    const top = bot - 37
    if (cp.active) {
      const glow = 0.1 + Math.sin(this.t * 2.4 + cp.index) * 0.04
      disc(b, x + 4, bot - 2, 11, `rgba(255,190,110,${glow.toFixed(3)})`)
    }
    // kaide
    rect(b, x, bot - 3, 9, 3, '#5a5068')
    rect(b, x, bot - 3, 9, 1, '#8a7f96')
    rect(b, x + 1, bot, 8, 1, 'rgba(0,0,0,0.3)')
    // direk: ışıklı sol, gölgeli sağ
    rect(b, x + 3, top, 1, 34, '#ece6da')
    rect(b, x + 4, top, 1, 34, '#9a94a2')
    disc(b, x + 4, top - 1, 1.8, '#f2c14e')
    rect(b, x + 3, top - 2, 1, 1, '#fff1c0')
    if (!cp.active) {
      // yarıya inik, soluk bayrak: uzaktan da "bayrak" okunur (fenerle karışmaz); dokununca göndere çekilir
      const fy = top + 14
      rect(b, x + 5, fy, 9, 6, '#9a3a40')
      rect(b, x + 5, fy, 9, 1, '#b25058')
      rect(b, x + 5, fy + 5, 9, 1, '#7a2a30')
      rect(b, x + 8, fy + 2, 2, 2, '#e8d8d0')
      rect(b, x + 9, fy + 2, 1, 2, '#9a3a40')
      rect(b, x + 11, fy + 2, 1, 1, '#e8d8d0')
      return
    }
    // göndere çekiliş: 0,6 sn'de aşağıdan yukarı (yumuşak duruş)
    const since = this.raised.has(cp.index) ? this.t - this.raised.get(cp.index)! : 9
    const k = Math.min(1, since / 0.6)
    const lift = Math.round((1 - (1 - k) * (1 - k)) * 20)
    const y0 = top + 1 + (20 - lift)
    const W = 17
    const H = 11
    for (let i = 0; i < W; i++) {
      // dalga direkte sıfır, uca doğru büyür; eğim ışığı belirler
      const amp = (i / W) * 2
      const ph = this.t * 6 - i * 0.55
      const off = Math.round(Math.sin(ph) * amp)
      const slope = Math.cos(ph)
      const red = slope > 0.45 ? '#ff3b3b' : slope < -0.45 ? '#b0060f' : '#e30a17'
      for (let j = 0; j < H; j++) {
        // ay: büyük beyaz daireden kaydırılmış kırmızı daire çıkar; yıldız: küçük artı
        const cx = i + 0.5
        const cy = j + 0.5
        // TS 2994 oranları küçültülmüş: ay dış çember 0,5H, iç 0,4H; yıldız ayın açık tarafında
        const inMoon = Math.hypot(cx - 6, cy - 5.5) <= 3.6 && Math.hypot(cx - 7, cy - 5.5) > 2.9
        const inStar = STAR[j - 3]?.[i - 9] === '#'
        let col = inMoon || inStar ? '#ffffff' : red
        if (j === H - 1 && !inMoon && !inStar) col = '#9a0510'
        rect(b, x + 5 + i, y0 + j + off, 1, 1, col)
      }
    }
    // pırıltı
    if (k === 1 && Math.sin(this.t * 3.1 + cp.index * 1.7) > 0.97) rect(b, x + 4, top - 3, 1, 1, '#ffffff')
  }

  /** Kapı: bölümün çıkışı; meydan kapısı (warp) aynı kemer, kilim rengi ışıkla */
  private drawExit(b: Ctx, e: { x: number; y: number; h: number }, warp = false) {
    const s = CITY[this.city]
    const cx = e.x + T / 2
    const bot = e.y + e.h
    const glow = 0.25 + Math.sin(this.t * 3) * 0.1
    disc(b, cx, bot - 16, 22, `rgba(255,220,140,${glow * 0.5})`)
    rect(b, cx - 14, bot - 38, 28, 38, s.tileDark)
    rect(b, cx - 12, bot - 36, 24, 36, s.tile)
    rect(b, cx - 8, bot - 24, 16, 24, warp ? '#f0a08a' : '#ffe2a0')
    disc(b, cx, bot - 24, 8, warp ? '#f0a08a' : '#ffe2a0', true)
    rect(b, cx - 6, bot - 22, 12, 22, warp ? '#ffd0b8' : '#fff4d0')
    disc(b, cx, bot - 22, 6, warp ? '#ffd0b8' : '#fff4d0', true)
    rect(b, cx - 12, bot - 38, 24, 2, s.tileLight)
    if (warp) {
      // kemerin üstünde kilim şeridi: buradan meydana çıkılır
      for (let i = 0; i < 6; i++) rect(b, cx - 12 + i * 4, bot - 41, 4, 3, i % 2 ? '#d83c36' : '#f2c14e')
      return
    }
    if (this.city === 'corum') {
      // Aslanlı Kapı aslanları
      for (const side of [-1, 1]) {
        const lx = cx + side * 13 - (side < 0 ? 4 : 0)
        rect(b, lx, bot - 12, 4, 12, '#8a7a5a')
        rect(b, lx - (side < 0 ? 1 : -1), bot - 14, 4, 4, '#a8956e')
      }
    }
    if (this.city === 'sivas') for (let i = 0; i < 6; i++) rect(b, cx - 11 + i * 4, bot - 34, 2, 2, s.tileLight)
  }

  /** En iyi koşunun soluk mavi hayaleti: zamanlayıcıyla aynı anda, aynı yerden geçer. */
  private drawGhostRun(w: World) {
    const g = this.ghostRun
    if (!g || !w.started) return
    const n = g.data.length / 3
    // uzun koşunun hayaleti seyreltilmiş olabilir (step: örnek başına kaç kayıt adımı)
    const f = (w.time * GHOST_HZ) / (g.step ?? 1)
    const i = Math.floor(f)
    if (i >= n - 1) return
    const k = f - i
    // kapıdan geçiş anı: iki örnek arası ışınlanma, çizme
    if (Math.abs(g.data[i * 3 + 3] - g.data[i * 3]) > 48 * (g.step ?? 1)) return
    const x = g.data[i * 3] + (g.data[i * 3 + 3] - g.data[i * 3]) * k
    const y = g.data[i * 3 + 1] + (g.data[i * 3 + 4] - g.data[i * 3 + 1]) * k
    // oyuncuyla üst üste binince silikleşir, göz yormasın
    const near = Math.hypot(x - w.player.x, y - w.player.y)
    const alpha = near < 10 ? Math.min(0.15, this.ghostAlpha) : this.ghostAlpha
    const code = g.data[i * 3 + 2]
    const pose = code & 7
    // hayalet hız yazmaz: ardışık örneklerden (iki yanın ortalaması, adımlar arasında ara değerlenir)
    const sdt = (g.step ?? 1) / GHOST_HZ
    const d = g.data
    const a0 = Math.max(0, i - 1)
    const b0 = Math.min(n - 1, i + 1)
    const a1 = i
    const b1 = Math.min(n - 1, i + 2)
    const w0 = b0 > a0 ? 1 / ((b0 - a0) * sdt) : 0
    const w1 = b1 > a1 ? 1 / ((b1 - a1) * sdt) : 0
    const vx0 = (d[b0 * 3] - d[a0 * 3]) * w0
    const vy0 = (d[b0 * 3 + 1] - d[a0 * 3 + 1]) * w0
    const vx = vx0 + ((d[b1 * 3] - d[a1 * 3]) * w1 - vx0) * k
    const vy = vy0 + ((d[b1 * 3 + 1] - d[a1 * 3 + 1]) * w1 - vy0) * k
    // oyuncuyla aynı pozlar (heroAnim): koşu adımı katedilen yoldan (ayak kaymaz), havada dikey hıza göre, dash eğik ve gergin
    let body: Pose = POSES.idle
    let rot = 0
    let sx = 1
    let sy = 1
    if (pose === 4 && Math.abs(vy) > Math.abs(vx) * 1.2) {
      body = vy < 0 ? POSES.rocket : POSES.stomp
      sx = 0.9
      sy = 1.14
    } else if (pose === 4) {
      body = POSES.dash
      rot = 0.3
      sx = 1.14
      sy = 0.9
    } else if (pose === 2 || pose === 3) {
      body = airPoseInto(this.ghostPose, vy, this.t)
      const up = Math.max(0, Math.min(1, -vy / PHYS.jumpV)) * 0.14
      sx = 1 - up * 0.75
      sy = 1 + up
    } else if (pose === 1) {
      // sola koşarken yol ters yönde birikir: evre yine ileri aksın
      const cyc = (code >= 8 ? -x : x) / ((strideLength(1) * HERO_SIZE) / 100)
      body = gaitInto(this.ghostPose, cyc - Math.floor(cyc), Math.min(1.6, Math.abs(vx) / PHYS.run))
    } else {
      // bekleme pozu: oyuncuyla aynı kod; kıpırdamadan geçen süre kayıttan geriye sayılır (en çok 12 sn)
      let still = 0
      for (let j = i; j > 0 && still < 12 * GHOST_HZ / (g.step ?? 1) && (g.data[j * 3 + 2] & 7) === 0; j--) still++
      body = idlePose(this.ghostPose, undefined, (still * (g.step ?? 1)) / GHOST_HZ, this.t)
    }
    this.heroes.push({ look: g.hero === 'memo' ? 'memo' : 'uktun', pose: body, x: x + 6, y: y + 14, flip: code >= 8, alpha, ghost: true, scarf: GHOST_SCARF, scarfS: GHOST_SCARF_SHADE, moving: pose === 1 || pose === 4, sx, sy, rot, pivot: pose === 4 ? DASH_PIVOT : 0, flow: Math.min(1.3, Math.hypot(vx, vy * 0.6) / PHYS.run) })
  }

  /** İtilebilen sandıklar: tahta kasa, çapraz kuşak; oyundaki öbür vektör çizimlerle aynı mürekkep hat. */
  /** dost hayvanların bu karedeki yerleri (süs döngüsü doldurur, HD katman çizer) */
  private friends: { x: number; bot: number }[] = []

  /**
   * Halat (dikey, örgülü kenevir) ve teleferik halatı (yatay çelik tel): ekran çözünürlüğünde, mürekkep dış hatlı.
   * Halatın ucu saatle hafifçe salınır; tutunan oyuncunun altındaki kısım onunla birlikte durur.
   */
  private drawRopesHD(w: World, cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    const x0 = Math.max(0, Math.floor(cx / T) - 1)
    const x1 = Math.min(w.cols - 1, Math.ceil((cx + this.viewW) / T) + 1)
    const y0 = Math.max(0, Math.floor(cy / T) - 1)
    const y1 = Math.min(w.rows - 1, Math.ceil((cy + this.viewH) / T) + 1)
    const X = (x: number) => (x - cx) * sc
    const Y = (y: number) => (y - cy) * sc
    c.save()
    c.lineCap = 'round'
    for (let tx = x0; tx <= x1; tx++) {
      for (let ty = y0; ty <= y1; ty++) {
        // koşunun başı görüş alanının üstünde kalsa da halat çizilir: ilk görünen hücreden tepeye yürü
        if (w.tile(tx, ty) !== ROPE || (ty > y0 && w.tile(tx, ty - 1) === ROPE)) continue
        let start = ty
        while (start > 0 && w.tile(tx, start - 1) === ROPE) start--
        let end = ty
        while (w.tile(tx, end + 1) === ROPE) end++
        const top = start * T
        const bot = (end + 1) * T - 2
        const mx = tx * T + T / 2
        const sway = Math.sin(this.t * 1.6 + tx) * 1.6
        const path = () => {
          c.beginPath()
          c.moveTo(X(mx), Y(top))
          c.quadraticCurveTo(X(mx + sway * 0.4), Y((top + bot) / 2), X(mx + sway), Y(bot))
        }
        path()
        c.strokeStyle = INK
        c.lineWidth = sc * 3.4
        c.stroke()
        path()
        c.strokeStyle = '#c49a5a'
        c.lineWidth = sc * 2
        c.stroke()
        // örgü: çapraz kısa çizgiler
        c.strokeStyle = '#8a6434'
        c.lineWidth = sc * 0.7
        for (let y = top + 3; y < bot - 2; y += 4) {
          const k = (y - top) / Math.max(1, bot - top)
          const ox = mx + sway * k * k
          c.beginPath()
          c.moveTo(X(ox - 0.9), Y(y))
          c.lineTo(X(ox + 0.9), Y(y + 1.6))
          c.stroke()
        }
        // tepede bağ, uçta düğüm
        c.fillStyle = '#8a6434'
        c.strokeStyle = INK
        c.lineWidth = sc * 0.8
        for (const [px, py, r] of [
          [mx, top + 1, 2.2],
          [mx + sway, bot, 1.9],
        ] as const) {
          c.beginPath()
          c.arc(X(px), Y(py), r * sc, 0, Math.PI * 2)
          c.fill()
          c.stroke()
        }
      }
      // teleferik: yataydaki halat koşuları soldan sağa bir kez çizilir
      for (let ty = y0; ty <= y1; ty++) {
        // başı ekranın solunda kalan tel de çizilir (eskiden kamera kayınca tel yok olup geri geliyordu)
        if (w.tile(tx, ty) !== CABLE || (tx > x0 && w.tile(tx - 1, ty) === CABLE)) continue
        let start = tx
        while (start > 0 && w.tile(start - 1, ty) === CABLE) start--
        let end = tx
        while (w.tile(end + 1, ty) === CABLE) end++
        const yy = ty * T + 8
        const a = start * T
        const b = (end + 1) * T
        const sag = Math.min(4, (b - a) / 40)
        const line = () => {
          c.beginPath()
          c.moveTo(X(a), Y(yy))
          c.quadraticCurveTo(X((a + b) / 2), Y(yy + sag * 2), X(b), Y(yy))
        }
        // kalın çelik tel: mürekkep hat, gövde, üstte ince parıltı (açık gökte de seçilsin)
        line()
        c.strokeStyle = INK
        c.lineWidth = sc * 3.6
        c.stroke()
        line()
        c.strokeStyle = '#7d8592'
        c.lineWidth = sc * 2
        c.stroke()
        c.save()
        c.translate(0, -sc * 0.5)
        line()
        c.strokeStyle = 'rgba(232,240,248,0.75)'
        c.lineWidth = sc * 0.6
        c.stroke()
        c.restore()
        // uçlarda makara
        c.fillStyle = '#5a5f6a'
        c.strokeStyle = INK
        c.lineWidth = sc * 0.8
        for (const px of [a + 2, b - 2]) {
          c.beginPath()
          c.arc(X(px), Y(yy), 2.4 * sc, 0, Math.PI * 2)
          c.fill()
          c.stroke()
        }
      }
    }
    c.restore()
  }

  /** Hayalet Zemin: zeminin üstüne sis; oyuncunun çevresi (~6 karo) açık, kenara doğru yumuşakça kapanır */
  private drawFog(w: World, cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    const p = w.player
    const x = (p.x + p.w / 2 - cx) * sc
    const y = (p.y + p.h / 2 - cy) * sc
    const r = 100 * sc
    const sky = CITY[this.city].sky[1]
    const g = c.createRadialGradient(x, y, r * 0.45, x, y, r)
    g.addColorStop(0, hexA(sky, 0))
    g.addColorStop(1, hexA(sky, 0.96))
    c.fillStyle = g
    c.fillRect(0, 0, this.viewW * sc, this.viewH * sc)
  }

  /**
   * Karanlık Yol: ekran karanlık, karakterin çevresinde yumuşak kenarlı bir ışık (yarıçap ~5 karo; nefes alır gibi hafifçe
   * büyüyüp küçülür, saate bağlı). Tek bir radyal dolgu: kare başına ek katman yok.
   */
  private drawDarkness(w: World, cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    const p = w.player
    const x = (p.x + p.w / 2 - cx) * sc
    const y = (p.y + p.h / 2 - cy) * sc
    const r = (78 + Math.sin(this.t * 1.7) * 3) * sc
    const g = c.createRadialGradient(x, y, r * 0.35, x, y, r)
    g.addColorStop(0, 'rgba(6,5,16,0)')
    g.addColorStop(0.7, 'rgba(6,5,16,0.75)')
    g.addColorStop(1, 'rgba(6,5,16,0.97)')
    c.fillStyle = g
    c.fillRect(0, 0, this.viewW * sc, this.viewH * sc)
  }

  /**
   * Gelgit suyu (ön tampon): havuzun düz su yüzü ara değerlenen saatle akıcı iner çıkar. Su gövdesi derinleştikçe koyulaşır,
   * yüzünde dalga ve köpük. Çekilen suyun bıraktığı ıslak iz kumda koyu kalır; havuzun dolacağı çizgide hep soluk bir
   * deniz izi durur. Uyarı: değişimden TIDE_CYCLE.warn sn önce, alçak suda varılacak çizgide köpük yanıp söner;
   * yüksek suda yüzey köpürür ve kenarlarda çekilme okları belirir.
   */
  /** Gelgit havuzlarının dibi (arka tampon, zeminin arkası): önbellekteki ıslak kum, görünen havuzlar için tek drawImage. */
  private drawTideBeds(b: Ctx, w: World, cx: number) {
    if (this.tideBeds?.w !== w) this.tideBeds = { w, beds: w.tidePools.map((_, id) => this.paintTideBed(w, id)) }
    for (const bed of this.tideBeds.beds) if (bed.x1 >= cx && bed.x <= cx + this.viewW) b.drawImage(bed.cv, bed.x, bed.y)
  }

  /**
   * Bir havuzun dibi: koyu ıslak kum (havuzun ağzı gölgede, dibe doğru açılır), kum dalgacıkları, benekler; tabanda açık kum
   * şeridi, çakıl, deniz kabuğu ve ara sıra deniz yıldızı. Desen karo koordinatından türer (sabit, her açılışta aynı).
   */
  private paintTideBed(w: World, id: number) {
    const q = w.tidePools[id]
    const ox = q.x0 * T
    const oy = q.top
    const cv = document.createElement('canvas')
    cv.width = (q.x1 - q.x0 + 1) * T
    cv.height = q.bottom - q.top
    const g = cv.getContext('2d')!
    const hh = q.bottom - q.top
    const solid = (tx: number, ty: number) => !w.isTide(tx, ty) && w.isSolid(tx, ty)
    for (let tx = q.x0; tx <= q.x1; tx++) {
      for (let ty = q.top / T; ty < q.bottom / T; ty++) {
        if (w.tideOf[ty * w.cols + tx] !== id) continue
        const x = tx * T - ox
        const y = ty * T - oy
        const h = tideHash(tx, ty)
        // gövde: ağızda koyu, dipte ıslak kum
        for (let r = 0; r < T; r++) rect(g, x, y + r, T, 1, mixHex('#54432f', '#8a6d48', Math.min(1, (y + r) / Math.max(T, hh - 4))))
        // kum dalgacıkları: dalgalı koyu çizgiler, karo başına kayık
        for (let r = (h % 7) + 2; r < T; r += 8)
          for (let i = 0; i < T; i++) {
            const gx = tx * T + i
            if (Math.sin(gx * 0.45 + ty * 1.7) > -0.3) rect(g, x + i, y + r + Math.round(Math.sin(gx * 0.3) * 0.8), 1, 1, 'rgba(30,20,12,0.2)')
          }
        // benekler
        for (let k = 0; k < 4; k++) {
          const v = tideHash(tx * 7 + k, ty * 13 - k)
          rect(g, x + (v % T), y + ((v >> 4) % T), 1, 1, k % 2 ? 'rgba(255,232,196,0.22)' : 'rgba(24,16,10,0.3)')
        }
        // sol duvarın gölgesi (ışık sol üstten)
        if (solid(tx - 1, ty)) rect(g, x, y, 2, T, 'rgba(16,10,6,0.28)')
        if (solid(tx, ty - 1)) rect(g, x, y, T, 2, 'rgba(16,10,6,0.25)')
        if (!solid(tx, ty + 1)) continue
        // taban: açık ıslak kum şeridi ve üstünde çakıl, kabuk, ara sıra deniz yıldızı
        rect(g, x, y + T - 4, T, 4, '#a3855a')
        for (let i = 0; i < T; i++) if (Math.sin((tx * T + i) * 0.7) > 0.2) rect(g, x + i, y + T - 5, 1, 1, '#a3855a')
        rect(g, x, y + T - 4, T, 1, 'rgba(255,236,200,0.22)')
        const px = x + 1 + (h % 9)
        if (h % 4 === 0) {
          // yassı çakıl: açık tepe, koyu alt
          rect(g, px + 1, y + T - 8, 4, 1, '#9c978c')
          rect(g, px, y + T - 7, 6, 2, '#77736b')
          rect(g, px + 1, y + T - 7, 2, 1, '#c4bfb2')
          rect(g, px, y + T - 5, 6, 1, '#3e3a34')
        } else if (h % 4 === 1) {
          rect(g, px + 2, y + T - 6, 3, 2, '#86817a')
          rect(g, px + 2, y + T - 6, 1, 1, '#c4bfb2')
          rect(g, px + 2, y + T - 4, 3, 1, '#3e3a34')
        }
        const sx = x + 2 + ((h >> 5) % 9)
        if ((h >> 3) % 3 === 0) {
          // tarak kabuğu: yelpaze, kaburgalı
          rect(g, sx + 1, y + T - 8, 3, 1, '#f6d6bc')
          rect(g, sx, y + T - 7, 5, 2, '#f2c6a6')
          rect(g, sx + 1, y + T - 7, 1, 2, '#c4876a')
          rect(g, sx + 3, y + T - 7, 1, 2, '#c4876a')
          rect(g, sx + 1, y + T - 5, 3, 1, '#8a5440')
        } else if (h % 13 === 7) {
          // deniz yıldızı
          rect(g, sx + 2, y + T - 9, 1, 2, '#e07a3e')
          rect(g, sx, y + T - 7, 5, 1, '#e07a3e')
          rect(g, sx + 1, y + T - 6, 1, 1, '#e07a3e')
          rect(g, sx + 3, y + T - 6, 1, 1, '#e07a3e')
          rect(g, sx + 2, y + T - 7, 1, 1, '#f8c08a')
        }
      }
    }
    // havuzun ağzı gökyüzüne yumuşakça açılır: üst kenar sert bir duvar çizgisi olmasın
    const fade = g.createLinearGradient(0, 0, 0, 28)
    fade.addColorStop(0, 'rgba(0,0,0,0.9)')
    fade.addColorStop(1, 'rgba(0,0,0,0)')
    g.globalCompositeOperation = 'destination-out'
    g.fillStyle = fade
    g.fillRect(0, 0, cv.width, 28)
    g.globalCompositeOperation = 'source-over'
    return { cv, x: ox, y: oy, x1: (q.x1 + 1) * T }
  }

  private drawTide(b: Ctx, w: World, cx: number) {
    const fill = tideFill(this.tideT)
    const { phase, next } = tidePhase(this.tideT)
    const warn = (phase === 'high' || phase === 'low') && next < TIDE_CYCLE.warn
    const blink = warn && Math.floor(next * 8) % 2 === 0
    // su çekilirken kum ıslak parlar; alçak suda kurudukça söner
    const wet = phase === 'ebb' ? 1 : phase === 'low' ? next / TIDE_CYCLE.hold : phase === 'flood' ? 0.45 : 0
    const x0 = Math.max(0, Math.floor(cx / T))
    const x1 = Math.min(w.cols - 1, Math.ceil((cx + this.viewW) / T))
    for (let tx = x0; tx <= x1; tx++) {
      for (let ty = 0; ty < w.rows; ty++) {
        if (!w.isTide(tx, ty)) continue
        const pool = w.tideOf[ty * w.cols + tx]
        const surf = w.tideSurface(pool, fill)
        const x = tx * T
        const y = ty * T
        const top = Math.max(y, Math.round(surf))
        const isTop = !w.isTide(tx, ty - 1)
        const floor = !w.isTide(tx, ty + 1) && w.isSolid(tx, ty + 1)
        const hv = tideHash(tx, ty)
        // yosun: tabanda, suyun içinde salınır, su çekilince kuma yatar
        if (floor && hv % 3 === 0) {
          const under = surf < y + T - 8
          for (let s = 0; s < 2; s++) {
            const bx = x + 3 + ((hv >> (2 + s * 3)) % 10)
            const len = under ? 6 + ((hv >> s) % 4) : 3
            for (let r = 0; r < len; r++) {
              const sway = Math.round(Math.sin(this.t * 1.6 + tx + s * 2 + r * 0.5) * (under ? r / 4 : 0) + (under ? 0 : r * 0.7))
              rect(b, bx + sway, y + T - 5 - r, 1, 1, r % 3 === 1 ? '#6fae5e' : '#3c7a46')
            }
          }
        }
        // ıslak iz: suyun hemen üstünde koyu ıslak kum ve yanıp sönen parıltılar
        if (wet > 0.02 && surf > y) {
          const band0 = Math.max(y, Math.round(surf) - 10)
          const band1 = Math.min(y + T, Math.round(surf))
          if (band1 > band0) {
            rect(b, x, band0, T, band1 - band0, `rgba(20,30,40,${(0.16 * wet).toFixed(2)})`)
            for (let i = 0; i < T; i++) {
              // suyun bıraktığı parlak çizgi (kesik kesik), üstünde seyrek parıltı
              const sy = Math.round(surf) - 2
              if (sy >= band0 && sy < band1 && Math.sin((x + i) * 0.5) > -0.2) rect(b, x + i, sy, 1, 1, `rgba(220,245,250,${(0.45 * wet).toFixed(2)})`)
              const v = tideHash(x + i, ty)
              if (v % 9 !== 0) continue
              const gy = Math.round(surf) - 1 - ((v >> 3) % 9)
              const a = wet * (0.35 + 0.35 * Math.sin(this.t * 5 + (v % 17)))
              if (gy >= band0 && gy < band1 && a > 0.05) rect(b, x + i, gy, 1, 1, `rgba(236,250,255,${a.toFixed(2)})`)
            }
          }
        }
        // deniz izi: havuzun en üst çizgisi (su oraya dek dolar), su çekilince soluk noktalar; alçak suda uyarıyla parlar
        if (isTop && surf > y + 2) {
          const strong = warn && phase === 'low'
          for (let i = 0; i < T; i++) if ((x + i) % 4 === 0 || (strong && (x + i + Math.floor(this.t * 12)) % 6 < 4)) rect(b, x + i, y, 1, strong ? 2 : 1, strong ? (blink ? 'rgba(255,255,255,0.95)' : 'rgba(170,236,242,0.75)') : 'rgba(210,244,248,0.35)')
          if (strong) {
            // dolacak suyun yönü: aşağıdan yukarı küçük oklar
            const ay = y + 4 + ((Math.floor(this.t * 6) + tx) % 3)
            if (tx % 3 === 0) {
              rect(b, x + 7, ay, 1, 3, 'rgba(255,255,255,0.8)')
              rect(b, x + 6, ay + 1, 3, 1, 'rgba(255,255,255,0.8)')
            }
          }
        }
        // çekilen suyun ıslak izi: suyun bir zaman kapladığı kum koyu kalır (alt kenarda, zemine değen yerde)
        if (top > y && !w.isTide(tx, ty + 1) && surf > y + T - 1) rect(b, x, y + T - 2, T, 2, 'rgba(30,60,70,0.22)')
        if (top >= y + T) continue
        const h = y + T - top
        // dibe yakın su berrak: kum, çakıl ve yosun altından görünür
        const toFloor = floor ? 0 : !w.isTide(tx, ty + 2) ? 1 : 2
        rect(b, x, top, T, h, hexA(SWIM_COLORS[ty % 2 ? 1 : 0], [0.58, 0.78, 0.9][toFloor]))
        const depth = (y + T / 2 - surf) / T
        const dk = Math.min(0.42, Math.max(0, depth - 0.5) * 0.11)
        if (dk > 0) rect(b, x, top, T, h, `rgba(8,14,36,${dk.toFixed(2)})`)
        // yüz: karonun içinde kalıyorsa dalga ve köpük çizgisi
        if (surf >= y - 0.5 && surf < y + T) {
          const churn = warn && phase === 'high'
          for (let i = 0; i < 16; i++) {
            const hh = Math.round(Math.sin(this.t * 3 + (x + i) * 0.35) * 1.2)
            rect(b, x + i, top + hh, 1, 2, SWIM_COLORS[2])
            if (hh < 0 || (churn && (i + Math.floor(this.t * 10)) % 3 === 0)) rect(b, x + i, top + hh, 1, 1, churn && blink ? '#ffffff' : 'rgba(240,250,255,0.75)')
          }
          if (churn) {
            // çekilecek: yüzeyde aşağı bakan küçük oklar
            const ay = top + 3 + ((Math.floor(this.t * 6) + tx) % 3)
            if (tx % 3 === 1 && ay + 3 < y + T) {
              rect(b, x + 7, ay, 1, 3, 'rgba(255,255,255,0.75)')
              rect(b, x + 6, ay + 2, 3, 1, 'rgba(255,255,255,0.75)')
            }
          }
          // kıyıya vuran köpük
          const shore = (dx: number) => !w.isTide(tx + dx, ty) && w.isSolid(tx + dx, ty)
          const surfw = Math.round((Math.sin(this.t * 2.2 + tx) + 1) * 1.5)
          if (shore(-1)) rect(b, x, top - 1, 2 + surfw, 2, 'rgba(240,250,255,0.7)')
          if (shore(1)) rect(b, x + T - 2 - surfw, top - 1, 2 + surfw, 2, 'rgba(240,250,255,0.7)')
        }
      }
    }
  }

  /**
   * Gelgit suyunun yarı saydam önü (ekran çözünürlüğünde): yüzen yolcu suyun içinde görünür, yüz akıcı iner çıkar.
   * Sütun başına tek dikdörtgen (havuz karo karo değil, bitişik karolar birlikte) ve bütün yüz çizgileri tek yol: büyük
   * havuzda yüzlerce yarı saydam boyama kare kaçırtıyordu.
   */
  private drawTideHD(w: World, cx: number, cy: number, x0: number, x1: number, y0: number, y1: number) {
    const c = this.ctx
    const sc = this.scale
    const fill = tideFill(this.tideT)
    c.fillStyle = 'rgba(70,180,200,0.34)'
    const wave = new Path2D()
    let waves = false
    for (let tx = x0; tx <= x1; tx++) {
      let ty = y0
      while (ty <= y1) {
        if (!w.isTide(tx, ty)) {
          ty++
          continue
        }
        const start = ty
        while (ty <= y1 && w.isTide(tx, ty)) ty++
        const surf = w.tideSurface(w.tideOf[start * w.cols + tx], fill)
        const top = Math.max(start * T, surf)
        const bottom = ty * T
        if (top >= bottom) continue
        c.fillRect((tx * T - cx) * sc, (top - cy) * sc, T * sc + 0.5, (bottom - top) * sc + 0.5)
        if (surf >= start * T - 0.5 && surf < bottom) {
          for (let i = 0; i <= 16; i += 2) {
            const yy = top + Math.sin(this.t * 3 + (tx * T + i) * 0.35) * 1.1
            if (i === 0) wave.moveTo((tx * T + i - cx) * sc, (yy - cy) * sc)
            else wave.lineTo((tx * T + i - cx) * sc, (yy - cy) * sc)
          }
          waves = true
        }
      }
    }
    if (waves) {
      c.strokeStyle = 'rgba(235,252,255,0.7)'
      c.lineWidth = sc * 0.9
      c.stroke(wave)
    }
  }

  /** Yüzülen suyun yüzü ve içi karakterin önünde yarı saydam: yüzen yolcu suyun içinde görünür. */
  private drawSwimHD(w: World, cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    const x0 = Math.max(0, Math.floor(cx / T) - 1)
    const x1 = Math.min(w.cols - 1, Math.ceil((cx + this.viewW) / T) + 1)
    const y0 = Math.max(0, Math.floor(cy / T) - 1)
    const y1 = Math.min(w.rows - 1, Math.ceil((cy + this.viewH) / T) + 1)
    let any = false
    for (let tx = x0; tx <= x1 && !any; tx++) for (let ty = y0; ty <= y1; ty++) if (w.tile(tx, ty) === SWIM) {
      any = true
      break
    }
    if (!any) return
    // yüzeydeki yüzen adanın karesine su örtüsü çizilmez: ada suyun üstünde görünsün (gömülünce örtü yine çizilir)
    let isl: Set<number> | null = null
    if (w.hasFloat)
      for (const pl of w.platforms)
        if (pl.axis === 'f' && !pl.under) for (let k = Math.floor(pl.x / T); k < Math.ceil((pl.x + pl.w) / T); k++) (isl ??= new Set()).add(Math.floor(pl.min / T) * w.cols + k)
    c.save()
    for (let tx = x0; tx <= x1; tx++) {
      for (let ty = y0; ty <= y1; ty++) {
        if (w.tile(tx, ty) !== SWIM || w.isTide(tx, ty)) continue
        if (isl?.has(ty * w.cols + tx)) continue
        const surface = w.tile(tx, ty - 1) !== SWIM
        const top = ty * T + (surface ? 6 : 0)
        c.fillStyle = 'rgba(70,180,200,0.34)'
        c.fillRect((tx * T - cx) * sc, (top - cy) * sc, T * sc + 0.5, (ty * T + T - top) * sc + 0.5)
        if (surface) {
          c.strokeStyle = 'rgba(235,252,255,0.7)'
          c.lineWidth = sc * 0.9
          c.beginPath()
          for (let i = 0; i <= 16; i += 2) {
            const yy = top + Math.sin(this.t * 3 + (tx * T + i) * 0.35) * 1.1
            if (i === 0) c.moveTo((tx * T + i - cx) * sc, (yy - cy) * sc)
            else c.lineTo((tx * T + i - cx) * sc, (yy - cy) * sc)
          }
          c.stroke()
        }
      }
    }
    if (w.hasTide) this.drawTideHD(w, cx, cy, x0, x1, y0, y1)
    // berrak su: dipten yükselen ışık huzmeleri ve kendi kendine çıkan kabarcıklar (saate bağlı, sütuna göre sabit).
    // Huzmeler üç parlaklık kademesinde, kabarcıklar tek yolda toplanır: karo başına ayrı boyama büyük suda kare kaçırtıyordu
    const beams = [new Path2D(), new Path2D(), new Path2D()]
    const used = [false, false, false]
    const bubbles = new Path2D()
    let anyBubble = false
    for (let tx = x0; tx <= x1; tx++) {
      for (let ty = y0; ty <= y1; ty++) {
        if (w.tile(tx, ty) !== SWIM) continue
        const lx = (tx * T - cx) * sc
        const ly = (ty * T - cy) * sc
        const band = Math.sin(this.t * 0.8 + tx * 0.9 + ty * 0.35)
        if (band > 0.55) {
          const k = Math.min(2, Math.floor((band - 0.55) / 0.15))
          const pth = beams[k]
          used[k] = true
          pth.moveTo(lx + 3 * sc, ly)
          pth.lineTo(lx + 9 * sc, ly)
          pth.lineTo(lx + 6 * sc, ly + T * sc)
          pth.lineTo(lx, ly + T * sc)
          pth.closePath()
        }
        if ((tx * 13 + ty * 7) % 6 === 0) {
          const ph = (this.t * 0.35 + ((tx * 31 + ty * 17) % 10) / 10) % 1
          const bx = tx * T + 4 + ((tx * 5) % 8) + Math.sin(this.t * 2 + tx) * 1.5
          const by = ty * T + T - ph * T
          if (w.tile(Math.floor(bx / T), Math.floor(by / T)) === SWIM) {
            const px = (bx - cx) * sc
            const py = (by - cy) * sc
            bubbles.moveTo(px + sc * 0.9, py)
            bubbles.arc(px, py, sc * 0.9, 0, Math.PI * 2)
            anyBubble = true
          }
        }
      }
    }
    beams.forEach((pth, k) => {
      if (!used[k]) return
      c.fillStyle = `rgba(220,252,255,${(0.012 + k * 0.024).toFixed(3)})`
      c.fill(pth)
    })
    if (anyBubble) {
      c.strokeStyle = 'rgba(235,252,255,0.55)'
      c.lineWidth = sc * 0.6
      c.stroke(bubbles)
    }
    // yüzenlerin ayak izi: ilerlerken arkada çırpınma kabarcıkları
    for (const q of [w.player, w.partner]) {
      if (!q || q.dead || !q.swim || Math.abs(q.vx) < 22) continue
      c.fillStyle = 'rgba(240,253,255,0.7)'
      for (let i = 0; i < 4; i++) {
        const age = (this.t * 2.2 + i / 4) % 1
        const bx = q.x + q.w / 2 - Math.sign(q.vx) * (8 + age * 14)
        const by = q.y + q.h * 0.6 - age * 4 + Math.sin(this.t * 9 + i) * 1.5
        if (w.tile(Math.floor(bx / T), Math.floor(by / T)) !== SWIM) continue
        c.beginPath()
        c.arc((bx - cx) * sc, (by - cy) * sc, sc * (1.1 - age * 0.6), 0, Math.PI * 2)
        c.fill()
      }
    }
    // yüzen oyuncunun kabarcıkları (saatle yükselir, rastgele değil)
    const p = w.player
    if (p.swim && !p.dead) {
      c.strokeStyle = 'rgba(235,252,255,0.8)'
      c.lineWidth = sc * 0.7
      for (let i = 0; i < 3; i++) {
        const ph = (this.t * 0.9 + i / 3) % 1
        const bx = p.x + p.w / 2 + Math.sin(this.t * 4 + i * 2) * 2 + (i - 1) * 2
        const by = p.y - ph * 14
        if (w.tile(Math.floor(bx / T), Math.floor(by / T)) !== SWIM) continue
        c.beginPath()
        c.arc((bx - cx) * sc, (by - cy) * sc, (0.8 + i * 0.3) * sc, 0, Math.PI * 2)
        c.stroke()
      }
    }
    c.restore()
  }

  /** Toplananlar, yaylar, dost hayvanlar ve düşmanlar: ekran çözünürlüğünde, vektör (enemyDraw.ts). */
  private drawThingsHD(w: World, cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    const t = this.t
    const X = (x: number) => (x - cx) * sc
    const Y = (y: number) => (y - cy) * sc
    const seen = (x: number) => x > cx - 28 && x < cx + this.viewW + 28
    const accent = CITY[this.city].accent
    for (const sp of w.springs) if (seen(sp.x)) drawThing(c, 'spring', X(sp.x + 7), Y(sp.y + 4), sc, t, { squash: sp.squash > 0 ? 1 : 0, accent, crate: this.city === 'malatya' })
    for (const p of w.pickups) if (!p.taken && seen(p.x)) drawKeepsake(c, this.city, X(p.x + 5), Y(p.y + 5 + Math.sin(t * 3 + p.index) * 2), sc, t)
    for (const f of this.friends) drawFriend(c, CITY[this.city].animal, X(f.x), Y(f.bot), sc, t, this.petTimer > 0)
    this.friends.length = 0
    const ready = !w.player.canDash
    for (const k of w.crystals)
      if (seen(k.x)) drawThing(c, 'crystal', X(k.x + 5), Y(k.y + 5 + Math.sin(t * 3 + k.x) * 1.5), sc, t, { active: k.active, ready, charge: 1 - k.timer / CRYSTAL_RECHARGE })
    for (const n of w.nitros) if (seen(n.x)) drawThing(c, 'nitro', X(n.x + 5), Y(n.y + 8), sc, t, { active: n.active, charge: 1 - n.timer / NITRO.recharge })
    if (w.keyBox && !w.hasKey) drawThing(c, 'key', X(w.keyBox.x + 5), Y(w.keyBox.y + 5 + Math.sin(t * 3) * 2), sc, t)
    if (w.stampBox && !w.stampTaken) drawThing(c, 'stamp', X(w.stampBox.x + 6), Y(w.stampBox.y + 6 + Math.sin(t * 2) * 1.5), sc, t, { accent })
    if (w.charmBox && !w.charmTaken) drawThing(c, 'charm', X(w.charmBox.x + 5), Y(w.charmBox.y + 5), sc, t)
    for (const e of w.enemies) if (e.alive && seen(e.x)) drawEnemy(c, enemySpecies(e.kind, this.city), e, X(e.x + e.w / 2), Y(e.y + e.h), sc, e.dir > 0 ? 1 : -1, t)
    // havuz teyzesi: dönmeden önce "Hı?", görünce "Aaaa!" (konuşma balonu başının üstünde)
    for (const e of w.enemies)
      if (e.kind === 'aunt' && seen(e.x) && e.state !== 'idle') {
        // söz teyzeye ve döneme göre seçilir (bir bağırış boyunca aynı kalır); Memo'ya telefon sözü daha sık
        const lines = e.state === 'charge' ? AUNT_SHOUT : AUNT_HM
        let k = (Math.floor(e.ox / T) * 7 + Math.floor(w.clock / AUNT.turn)) % lines.length
        if (e.state === 'charge' && this.character.id === 'memo' && k % 3 === 0) k = 2
        this.auntBubble(X(e.x + e.w / 2), Y(e.y) - sc * 6, lines[k][this.lang === 'en' ? 1 : 0], e.state === 'charge')
      }
  }

  /** teyzenin balonu: beyaz, mürekkep hatlı, kuyruğu aşağı; çığlıkta büyük ve titrek */
  private auntBubble(x: number, y: number, text: string, loud: boolean) {
    const c = this.ctx
    const sc = this.scale
    const size = Math.round(sc * (loud ? 6.5 : 5.5))
    c.save()
    c.font = `800 ${size}px ${this.popFont()}`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    const w = c.measureText(text).width + sc * 6
    const h = size + sc * 4
    const jx = loud ? Math.sin(this.t * 60) * sc * 0.6 : 0
    c.translate(x + jx, y - h / 2)
    c.fillStyle = '#fffaf0'
    c.strokeStyle = '#1a1424'
    c.lineWidth = Math.max(1.5, sc * 0.7)
    c.beginPath()
    c.roundRect(-w / 2, -h / 2, w, h, h / 2)
    c.moveTo(-sc * 2, h / 2)
    c.lineTo(0, h / 2 + sc * 3)
    c.lineTo(sc * 2, h / 2)
    c.fill()
    c.stroke()
    c.fillStyle = loud ? '#d8342a' : '#1a1424'
    c.fillText(text, 0, 0)
    c.restore()
  }

  private drawCratesHD(w: World, cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    for (const k of w.crates) {
      if (k.sunk > 0) continue
      const x = (k.x - cx) * sc
      const y = (k.y - cy) * sc
      if (x < -T * sc || x > this.canvas.width) continue
      const s = T * sc
      c.save()
      c.translate(x, y)
      c.lineJoin = 'round'
      c.fillStyle = '#b8824a'
      c.strokeStyle = '#22161f'
      c.lineWidth = sc * 1.1
      c.beginPath()
      c.roundRect(sc * 0.6, sc * 0.6, s - sc * 1.2, s - sc * 1.2, sc * 1.2)
      c.fill()
      c.stroke()
      // sol üstten ışık, alt sağdan gölge
      c.fillStyle = 'rgba(255,236,200,0.28)'
      c.fillRect(sc * 1.4, sc * 1.4, s - sc * 2.8, sc * 1.6)
      c.fillStyle = 'rgba(40,20,30,0.22)'
      c.fillRect(sc * 1.4, s - sc * 3.4, s - sc * 2.8, sc * 2)
      // kuşaklar
      c.strokeStyle = '#7a4e24'
      c.lineWidth = sc * 1.3
      c.beginPath()
      c.moveTo(sc * 2.6, sc * 2.6)
      c.lineTo(s - sc * 2.6, s - sc * 2.6)
      c.moveTo(s - sc * 2.6, sc * 2.6)
      c.lineTo(sc * 2.6, s - sc * 2.6)
      c.stroke()
      c.restore()
    }
  }

  /** Boss ve canları: zeminin üstünde, oyuncunun arkasında. Uyanınca adı kısa süre başının üstünde yazar. */
  private say(kind: 'wake' | 'tired' | 'ouch', hold: number) {
    this.bossSay = { text: BOSS_LINES[this.bossCity][kind][this.lang === 'en' ? 1 : 0], at: this.t, hold }
  }

  /** Konuşma balonu: beyaz kâğıt, mürekkep hat, alt ucunda kuyruk; (x, y) kuyruğun ucu. */
  private bubble(text: string, x: number, y: number, k: number) {
    const c = this.ctx
    const sc = this.scale
    const size = Math.round(sc * 5.2)
    c.font = `700 ${size}px ${this.popFont()}`
    const w = c.measureText(text).width + sc * 7
    const h = size + sc * 5
    // ekrandan taşmasın
    const bx = Math.min(this.canvas.width - w - sc * 2, Math.max(sc * 2, x - w * 0.3))
    const by = y - sc * 5 - h
    c.save()
    c.translate(x, y)
    c.scale(k, k)
    c.translate(-x, -y)
    c.lineJoin = 'round'
    c.lineWidth = Math.max(2, sc * 1.1)
    c.strokeStyle = '#22161f'
    c.fillStyle = '#fffaf0'
    c.beginPath()
    c.roundRect(bx, by, w, h, sc * 2.4)
    c.moveTo(x - sc * 2, by + h - 1)
    c.lineTo(x, y)
    c.lineTo(x + sc * 3, by + h - 1)
    c.stroke()
    c.fill()
    c.fillStyle = '#22161f'
    c.textAlign = 'left'
    c.textBaseline = 'middle'
    c.fillText(text, bx + sc * 3.5, by + h / 2 + sc * 0.3)
    c.restore()
  }

  /** Kovalamaca'nın Kangal'ı: ana tuvalde vektör; adımlar arası ara değerlenir (ışınlanmada değil) */
  private drawChaserHD(w: World, cx: number, cy: number, alpha: number) {
    const d = w.chaser!
    const jump = Math.abs(d.x - d.px) > 24 || Math.abs(d.y - d.py) > 24
    const x = jump ? d.x : d.px + (d.x - d.px) * alpha
    const y = jump ? d.y : d.py + (d.y - d.py) * alpha
    const sc = this.scale
    const sx = (x - cx) * sc
    const sy = (y - cy) * sc
    const W = this.canvas.width
    if (sx > -40 * sc && sx < W + 40 * sc) drawChaseDog(this.ctx, sx, sy, sc, this.t, d.facing < 0, d.state)
    // ekran dışındaysa kenarda işaret: yaklaştıkça kırmızılaşır ve atar (saate bağlı)
    if ((sx < 0 || sx > W) && d.state !== 'wait') {
      const c = this.ctx
      const left = sx < 0
      const near = Math.max(0, Math.min(1, 1 - (d.gap - 0.4) / 2.6))
      const r = (6 + near * 3 + (near > 0.6 ? Math.sin(this.t * 14) * 1.2 : 0)) * sc
      const ex = left ? r + 4 * sc : W - r - 4 * sc
      const ey = Math.max(r + 40 * sc, Math.min(this.canvas.height - r - 8 * sc, sy - 8 * sc))
      c.save()
      c.fillStyle = near > 0.6 ? cbc('#e5534b') : near > 0.3 ? cbc('#e8a33d') : '#f4f0e6'
      c.strokeStyle = '#1b1530'
      c.lineWidth = 1.5 * sc
      c.beginPath()
      c.arc(ex, ey, r, 0, Math.PI * 2)
      c.moveTo(ex + (left ? -r - 4 * sc : r + 4 * sc), ey)
      c.lineTo(ex + (left ? -r * 0.4 : r * 0.4), ey - r * 0.8)
      c.lineTo(ex + (left ? -r * 0.4 : r * 0.4), ey + r * 0.8)
      c.closePath()
      c.fill()
      c.stroke()
      drawChaseDog(c, ex, ey + r * 0.55, sc * 0.45, this.t, !left, 'run')
      c.restore()
    }
  }

  private drawBossHD(w: World, cx: number, cy: number) {
    this.drawOneBoss(w.boss, this.bossCity, cx, cy, true)
    // Co-op Boss Kapışması: ikinci boss kendi şehrinin çizimiyle (konuşma balonu birincinin)
    if (w.boss2) this.drawOneBoss(w.boss2, this.bossCity2, cx, cy, false)
  }

  private drawOneBoss(b: Boss | null, city: CityKey, cx: number, cy: number, main: boolean) {
    if (!b) return
    if (main) {
      if (b.state === 'tired' && this.bossWas !== 'tired') this.say('tired', 1.8)
      this.bossWas = b.state
    }
    if (b.state === 'down' && b.timer > 1.4) return
    const c = this.ctx
    const sc = this.scale
    const x = (b.x + b.w / 2 - cx) * sc
    const y = (b.y + b.h - cy) * sc
    if (x < -200 * sc || x > this.canvas.width + 200 * sc) return
    drawBoss(c, city, b, x, y, sc, this.t)
    if (b.state === 'sleep' || b.state === 'down') return
    // canlar: dolu kalp kırmızı, giden kalp boş
    const top = b.hidden ? (b.floor - 16 - cy) * sc : (b.y - 12 - cy) * sc
    const n = b.def.hp
    for (let i = 0; i < n; i++) {
      const hx = x + (i - (n - 1) / 2) * 7 * sc
      c.save()
      c.translate(hx, top)
      c.scale(sc * 0.3, sc * 0.3)
      c.beginPath()
      c.moveTo(0, 7)
      c.bezierCurveTo(-13, -2, -7, -11, 0, -4)
      c.bezierCurveTo(7, -11, 13, -2, 0, 7)
      c.closePath()
      c.fillStyle = i < b.hp ? '#e23a3a' : 'rgba(30,20,40,0.55)'
      c.fill()
      c.strokeStyle = '#22161f'
      c.lineWidth = 3
      c.lineJoin = 'round'
      c.stroke()
      c.restore()
    }
    if (this.t - this.bossWoke < 3) {
      const def = b.def
      const a = Math.min(1, (3 - (this.t - this.bossWoke)) / 0.5)
      c.globalAlpha = a
      c.font = `700 ${Math.round(sc * 6.5)}px ${this.popFont()}`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.lineJoin = 'round'
      c.lineWidth = Math.max(2, sc * 1.3)
      c.strokeStyle = '#120f1a'
      const label = this.lang === 'en' ? def.nameEn : def.name
      c.strokeText(label, x, top - sc * 9)
      c.fillStyle = '#ffd36a'
      c.fillText(label, x, top - sc * 9)
      c.globalAlpha = 1
    }
    // yorgun: basılacak an. Zıplayan ok ve tek söz; kural her boss'ta aynı okunur.
    if (b.state === 'tired' && !b.hidden) {
      const bob = Math.abs(Math.sin(this.t * 7)) * sc * 2.5
      const ay = top - sc * 11 - bob
      c.save()
      c.lineJoin = 'round'
      c.lineWidth = Math.max(2, sc * 1.2)
      c.strokeStyle = '#22161f'
      c.fillStyle = '#ffd36a'
      c.beginPath()
      c.moveTo(x, ay + sc * 5)
      c.lineTo(x - sc * 4, ay)
      c.lineTo(x - sc * 1.6, ay)
      c.lineTo(x - sc * 1.6, ay - sc * 4)
      c.lineTo(x + sc * 1.6, ay - sc * 4)
      c.lineTo(x + sc * 1.6, ay)
      c.lineTo(x + sc * 4, ay)
      c.closePath()
      c.stroke()
      c.fill()
      c.font = `700 ${Math.round(sc * 5.5)}px ${this.popFont()}`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      const now = this.lang === 'en' ? 'Stomp Now!' : 'Şimdi Bas!'
      // yazı ve geri sayım sabit durur (okunsun), yalnız ok zıplar
      const ty = top - sc * 25
      c.strokeText(now, x, ty)
      c.fillText(now, x, ty)
      // geri sayım: üstüne basabileceğin süre boşalan çubuk ve kalan saniye; azaldıkça sarıdan kırmızıya döner
      const left = Math.max(0, b.timer)
      const k = b.span ? Math.min(1, left / b.span) : 1
      const bw = sc * 24
      const bh = sc * 3.2
      const bx = x - bw / 2 - sc * 4
      const by = top - sc * 20.5
      c.fillStyle = '#22161f'
      c.fillRect(bx - sc * 0.6, by - sc * 0.6, bw + sc * 1.2, bh + sc * 1.2)
      c.fillStyle = k > 0.5 ? '#ffd36a' : k > 0.25 ? cbc('#ff9a4a') : cbc('#ff5a4a')
      c.fillRect(bx, by, bw * k, bh)
      c.font = `700 ${Math.round(sc * 6)}px ${this.popFont()}`
      c.textAlign = 'left'
      c.lineWidth = Math.max(2, sc * 1)
      const sec = left.toFixed(1)
      c.strokeText(sec, bx + bw + sc * 2, by + bh / 2)
      c.fillStyle = k > 0.25 ? '#ffd36a' : cbc('#ff5a4a')
      c.fillText(sec, bx + bw + sc * 2, by + bh / 2)
      c.restore()
    }
    const s = this.bossSay
    if (s && this.t - s.at < s.hold && !b.hidden) {
      const age = this.t - s.at
      const k = Math.min(1, age / 0.12) * Math.min(1, (s.hold - age) / 0.15)
      const up = b.state === 'tired' ? sc * 32 : this.t - this.bossWoke < 3 ? sc * 15 : sc * 6
      this.bubble(s.text, x + b.w * sc * 0.25, top - up, k)
    }
  }

  /**
   * Van Gölü'nün canavarı (süs, zararsız): her geniş su yüzeyinde ~11 sn'lik turla ortaya çıkar, üç hörgüç ve başıyla
   * yüzeyde süzülür, göz kırpar, sonra batar. Vektör, mürekkep hatlı; suyun altındaki yarısını su katmanı örter.
   */
  private drawLakeMonster(cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    // canavarın boyu: karakterden iri, gölün sahibi
    const zs = sc * 1.6
    for (const [i, r] of this.lakeRuns.entries()) {
      const span = r.x1 - r.x0
      if ((r.x1 - cx) * sc < -40 * sc || (r.x0 - cx) * sc > this.canvas.width + 40 * sc) continue
      const period = 11
      const u = ((this.t + i * 3.7) % period) / period
      // yükselip batma: turun ortasında tam yüzeyde, uçlarda su altında
      const rise = Math.max(0, Math.sin(u * Math.PI)) ** 0.6
      if (rise < 0.04) continue
      const dir = Math.floor((this.t + i * 3.7) / period) % 2 ? -1 : 1
      const len = Math.min(96, span * 0.8)
      const lead = r.x0 + 8 + (span - 16 - len) * (dir > 0 ? u : 1 - u) + (dir > 0 ? len : 0)
      const y = (r.y - cy) * sc
      const body = '#2f7a6a'
      const dark = '#1f5a4e'
      c.save()
      c.lineJoin = 'round'
      c.lineWidth = Math.max(1.5, sc * 0.9)
      c.strokeStyle = '#120f1a'
      // üç hörgüç: baştan kuyruğa küçülür, dalga gibi sırayla iner kalkar
      for (let k = 0; k < 3; k++) {
        const hx = (lead - dir * (24 + k * 22) - cx) * sc
        const h = (7 - k * 1.4) * zs * rise * (0.75 + 0.25 * Math.sin(this.t * 3 + k * 1.3))
        const rw = (6 - k) * zs
        c.beginPath()
        c.ellipse(hx, y + zs, rw, h, 0, Math.PI, 0)
        c.fillStyle = k % 2 ? dark : body
        c.fill()
        c.stroke()
        // sırt dikeni
        c.beginPath()
        c.moveTo(hx - rw * 0.3, y + zs - h * 0.9)
        c.lineTo(hx, y + zs - h - zs * 2 * rise)
        c.lineTo(hx + rw * 0.3, y + zs - h * 0.9)
        c.fillStyle = '#e0b84a'
        c.fill()
        c.stroke()
      }
      // baş: boyun yayı + yuvarlak kafa, göz ve burun deliği
      const nx = (lead - cx) * sc
      const nh = 11 * zs * rise
      c.beginPath()
      c.moveTo(nx - dir * 5 * zs, y + zs)
      c.quadraticCurveTo(nx - dir * 4 * zs, y - nh, nx + dir * 2 * zs, y - nh)
      c.lineTo(nx + dir * 2 * zs, y - nh + 4 * zs)
      c.quadraticCurveTo(nx, y - nh * 0.4, nx + dir * zs, y + zs)
      c.closePath()
      c.fillStyle = body
      c.fill()
      c.stroke()
      c.beginPath()
      c.ellipse(nx + dir * 4 * zs, y - nh + zs, 5 * zs, 3.6 * zs, 0, 0, Math.PI * 2)
      c.fillStyle = body
      c.fill()
      c.stroke()
      // göz: arada bir kırpar
      const blink = (this.t * 0.9 + i) % 3 < 0.12
      c.beginPath()
      c.ellipse(nx + dir * 4.5 * zs, y - nh, 1.7 * zs, blink ? 0.3 * zs : 1.7 * zs, 0, 0, Math.PI * 2)
      c.fillStyle = '#fff6d8'
      c.fill()
      c.stroke()
      if (!blink) {
        c.beginPath()
        c.arc(nx + dir * 5.1 * zs, y - nh, 0.8 * zs, 0, Math.PI * 2)
        c.fillStyle = '#120f1a'
        c.fill()
      }
      c.fillStyle = dark
      c.beginPath()
      c.arc(nx + dir * 8 * zs, y - nh + 1.6 * zs, 0.5 * zs, 0, Math.PI * 2)
      c.fill()
      c.restore()
    }
  }

  /** nefes uyarısında bir kez atan nabız (1 → 0) */
  private breathPulse = 0

  /**
   * Nefes göstergesi: derin suda başın üstünde kabarcık simgeli bir çubuk; nefes azaldıkça boşalır. Son 2,5 saniyede
   * kızarır, yanıp söner, kabarcığın içinde kalan saniye yazar ve ekranın kenarı koyu maviyle nabız gibi atar.
   * Altı küçük boncuk telefonda okunmuyordu: boğulma "neden öldüm" diye şaşırtıyordu.
   */
  /** Kolaylık: dash hakkı halkası: hak varken dolu turkuaz, yokken içi boş soluk; renge ek olarak biçimle de ayrışır */
  private drawDashMeter(w: World, cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    for (const p of [w.player, w.partner]) {
      if (!p || p.dead || p.dashTime > 0) continue
      const x = (p.x + p.w / 2 - cx) * sc
      const y = (p.y - 7 - cy) * sc
      const r = 2.1 * sc
      c.save()
      c.lineWidth = Math.max(1.5, sc * 0.7)
      c.strokeStyle = '#120f1a'
      c.beginPath()
      c.arc(x, y, r + c.lineWidth * 0.5, 0, Math.PI * 2)
      c.stroke()
      c.beginPath()
      c.arc(x, y, r, 0, Math.PI * 2)
      if (p.canDash) {
        c.fillStyle = '#7fe8d6'
        c.fill()
      } else {
        c.strokeStyle = 'rgba(160,172,196,0.85)'
        c.stroke()
      }
      c.restore()
    }
  }

  private drawBreath(w: World, cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    this.breathPulse = Math.max(0, this.breathPulse - this.frameDt * 2.5)
    for (const p of [w.player, w.partner]) {
      if (!p || p.dead || p.air >= AIR.max) continue
      const frac = Math.max(0, p.air / AIR.max)
      const warn = p.air < AIR.warn
      const blink = warn && Math.sin(this.t * 14) > 0
      const r = 4.2 * sc
      const bw = 20 * sc
      const bh = 4.6 * sc
      const mx = (p.x + p.w / 2 - cx) * sc
      const my = (p.y - 17 - cy) * sc
      const k = warn ? 1.08 + Math.sin(this.t * 10) * 0.05 + this.breathPulse * 0.25 : 1 + this.breathPulse * 0.15
      const lw = Math.max(1.5, sc * 0.75)
      c.save()
      c.translate(mx, my)
      c.scale(k, k)
      const x0 = -(bw + r * 2 + sc) / 2
      // çubuk: koyu yuva, içinde dolum
      c.lineWidth = lw
      c.strokeStyle = '#120f1a'
      c.fillStyle = 'rgba(18,15,26,0.78)'
      c.beginPath()
      c.roundRect(x0 + r * 1.4, -bh / 2, bw + r * 0.6, bh, bh / 2)
      c.fill()
      c.stroke()
      const inner = (bw - sc) * frac
      if (inner > 0.5) {
        c.fillStyle = warn ? (blink ? cbc('#ffb0a4') : cbc('#ff5f52')) : frac < 0.6 ? '#ffd36a' : '#8fe8ff'
        c.beginPath()
        c.roundRect(x0 + r * 2 + sc * 0.2, -bh / 2 + sc * 0.9, inner, bh - sc * 1.8, (bh - sc * 1.8) / 2)
        c.fill()
      }
      // kabarcık simgesi: son saniyelerde içinde kalan saniye
      c.beginPath()
      c.arc(x0 + r, 0, r, 0, Math.PI * 2)
      c.fillStyle = warn ? (blink ? cbc('#ffd4cc') : cbc('#ff8a7c')) : '#cdf3ff'
      c.fill()
      c.stroke()
      if (warn) {
        c.fillStyle = '#120f1a'
        c.font = `800 ${Math.round(r * 1.5)}px ${this.popFont()}`
        c.textAlign = 'center'
        c.textBaseline = 'middle'
        c.fillText(String(Math.max(1, Math.ceil(p.air))), x0 + r, r * 0.08)
      } else {
        c.fillStyle = 'rgba(255,255,255,0.9)'
        c.beginPath()
        c.arc(x0 + r * 0.7, -r * 0.35, r * 0.28, 0, Math.PI * 2)
        c.fill()
      }
      c.restore()
      // ekranın kenarı: nefes azaldıkça koyulaşan, nabız gibi atan mavi (yalnız 1. oyuncu; dört ince şerit, tam ekran katman değil)
      if (warn && p === w.player) {
        const a = (0.25 + (1 - p.air / AIR.warn) * 0.45) * (0.7 + 0.3 * Math.sin(this.t * 7)) + this.breathPulse * 0.15
        const W = this.canvas.width
        const H = this.canvas.height
        const d = Math.min(W, H) * 0.16
        const edge = (x: number, y: number, ww: number, hh: number, gx0: number, gy0: number, gx1: number, gy1: number) => {
          const g = c.createLinearGradient(gx0, gy0, gx1, gy1)
          g.addColorStop(0, `rgba(8,22,58,${a.toFixed(3)})`)
          g.addColorStop(1, 'rgba(8,22,58,0)')
          c.fillStyle = g
          c.fillRect(x, y, ww, hh)
        }
        c.save()
        c.setTransform(1, 0, 0, 1, 0, 0)
        edge(0, 0, W, d, 0, 0, 0, d)
        edge(0, H - d, W, d, 0, H, 0, H - d)
        edge(0, 0, d, H, 0, 0, d, 0)
        edge(W - d, 0, d, H, W, 0, W - d, 0)
        c.restore()
      }
    }
  }

  /** Karakterler büyütülmüş ana tuvalde, ekran çözünürlüğünde: oyun dünyası piksel, karakter elle çizilmiş */
  private drawHeroes(cx: number, cy: number) {
    for (const h of this.heroes) {
      if (h.cache !== undefined) {
        this.drawCached(h, cx, cy)
        continue
      }
      this.drawScratch(h, cx, cy)
    }
    this.heroes = []
  }

  /** karakterlerin ara tuvalleri (sırayla kullanılır) */
  private scratch: HTMLCanvasElement[] = []
  private scratchN = 0

  /**
   * Karakter önce kendi boyunda küçük bir ara tuvale çizilir, sonra tek seferde basılır. Boyalı fırça şekil başına
   * kırpma yapar; kırpma büyük ana tuval üzerinde pahalıdır (yazılımla boyayan tarayıcıda tek karakter ~8 ms tutuyordu,
   * verify-perf), küçük tuvalde ucuzdur. Dönüş (yüzme, telde salınma) ara tuvalin içinde yapılır.
   */
  private drawScratch(h: HeroDraw, cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    // dash izi kopyası: doğduğu an bir kez çizilir, ömrü boyunca hazır görüntü solup incelerek basılır
    if (h.snap) {
      const g = h.snap
      if (!g.img) {
        g.img = document.createElement('canvas')
        g.oy = this.paintHero(h, g.img)
      }
      const W = g.img.width
      const fx = (h.x - cx) * sc
      const fy = (h.y - cy) * sc
      c.globalAlpha = h.alpha
      c.setTransform(h.sx, 0, 0, h.sy, fx, fy)
      c.drawImage(g.img, -W / 2, -g.oy)
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.globalAlpha = 1
      return
    }
    let cv = this.scratch[this.scratchN % 3]
    if (!cv) cv = this.scratch[this.scratchN % 3] = document.createElement('canvas')
    this.scratchN++
    const oy = this.paintHero(h, cv)
    // hayalet koşu soluk (saydam, gri atkı): canvas filter kullanılmaz (kare kaçırtır)
    c.globalAlpha = h.alpha
    c.drawImage(cv, Math.round((h.x - cx) * sc - cv.width / 2), Math.round((h.y - cy) * sc - oy))
    c.globalAlpha = 1
  }

  /** karakteri kendi boyundaki tuvale çizer (ayak tabanı tuvalin ortasında, dönen ayak çizgisi); ayak çizgisini döndürür */
  private paintHero(h: HeroDraw, cv: HTMLCanvasElement) {
    const sc = this.scale
    const px = (h.size ?? HERO_SIZE) * sc
    const W = Math.ceil(px * 2)
    const H = Math.ceil(px * 2)
    const oy = Math.round(px * 1.45)
    if (cv.width !== W || cv.height !== H) {
      cv.width = W
      cv.height = H
    } else cv.getContext('2d')!.clearRect(0, 0, W, H)
    const g = cv.getContext('2d')!
    g.save()
    if (h.rot) {
      const py = oy - (h.pivot ?? 0) * sc
      g.translate(W / 2, py)
      g.rotate(h.flip ? -h.rot : h.rot)
      g.translate(-W / 2, -py)
    }
    // iz kopyası düz boyda çizilir (incelmesi basılırken)
    const snap = !!h.snap
    drawHero(g, h.look, h.pose, W / 2, oy, px, h.flip, this.t, { moving: h.moving, sx: (snap ? 1 : h.sx) * HERO_WIDE, sy: snap ? 1 : h.sy, scarf: h.scarf, scarfS: h.scarfS, acc: h.acc, flow: h.flow })
    g.restore()
    if (snap) {
      // dash izi: karakterin tam kopyası değil, atkı renginde yarı saydam siluet (oyunlardaki gibi; tam kopyalar art arda
      // titreşen çift görüntü gibi duruyordu). Bir kez, iz doğarken boyanır
      g.globalCompositeOperation = 'source-atop'
      g.fillStyle = hexA(this.scarf?.color ?? LOOKS[this.character.id].scarf, 0.72)
      g.fillRect(0, 0, W, H)
      g.globalCompositeOperation = 'source-over'
    }
    return oy
  }

  /** şehir insanlarının önbelleği: sıra → tuval, çizildiği an, yönü ve boyu */
  private npcCache = new Map<number, { cv: HTMLCanvasElement; at: number; flip: boolean; px: number }>()

  /**
   * Duran şehir insanı saniyede 30 (temel kademede 12) kez kendi küçük tuvaline çizilir, arada hazır görüntü basılır. Boyalı karakter
   * çizimi şekil başına birkaç kırpılmış dolgu yapar; ekranda dört beş insan varken her karede yeniden çizmek
   * yazılımla boyayan cihazda kareyi kaçırtıyordu (verify-perf, Erzurum). Nefes ve göz kırpma bu hızda da akıcı okunur.
   */
  private drawCached(h: HeroDraw, cx: number, cy: number) {
    const sc = this.scale
    const px = (h.size ?? HERO_SIZE) * sc
    const W = Math.ceil(px * 1.5)
    const H = Math.ceil(px * 1.4)
    const oy = Math.round(px * 1.28)
    let e = this.npcCache.get(h.cache!)
    if (!e || e.px !== px) {
      const cv = document.createElement('canvas')
      cv.width = W
      cv.height = H
      e = { cv, at: -1, flip: h.flip, px }
      this.npcCache.set(h.cache!, e)
    }
    // zengin kademede saniyede 30 (nefes ve göz kırpma akıcı), temelde 12 kez tazelenir
    if (this.t - e.at > (this.tier === 2 ? 1 / 30 : 1 / 12) || e.at > this.t || e.flip !== h.flip) {
      const g = e.cv.getContext('2d')!
      g.clearRect(0, 0, W, H)
      drawHero(g, h.look, h.pose, W / 2, oy, px, h.flip, this.t, { moving: false, sx: HERO_WIDE, sy: 1 })
      e.at = this.t
      e.flip = h.flip
    }
    this.ctx.drawImage(e.cv, Math.round((h.x - cx) * sc - W / 2), Math.round((h.y - cy) * sc - oy))
  }

  /** asılma ve yüzme pozlarının evresi (oyuncu başına): yalnız hareket ederken ilerler */
  private holdPhase = new WeakMap<Player, { x: number; y: number; ph: number; rot: number }>()

  /**
   * Halatta, teleferikte ve suda poz. Teleferikte eller tam tele oturur (karakter pozun el yüksekliği kadar aşağı çizilir),
   * ilerlerken eller sırayla tele uzanır, gövde ve bacaklar salınır. Halatta eller sırayla tırmanır, bacaklar halatı kavrar.
   * Suda ilerlerken gövde yatar ve serbest stil kulaç atar (kollar sırayla döner, bacaklar çırpar); dururken dik durup
   * kollarıyla suyu iter. Saate bağlı; evre yalnız hareket ederken ilerler.
   */
  private holdPose(p: Player): { pose: Pose; rot: number; pivot: number; dy: number; dx?: number; moving: boolean } | null {
    // suda: yüzerken ya da başı suyun içindeyken (dibe bassa da) yüzme pozu
    const under = p.swim && this.world?.tile(Math.floor((p.x + p.w / 2) / T), Math.floor((p.y + 1) / T)) === SWIM
    if (!p.hang && !(p.swim && (!p.grounded || under))) return null
    let st = this.holdPhase.get(p)
    if (!st) this.holdPhase.set(p, (st = { x: p.x, y: p.y, ph: 0, rot: 1.35 }))
    const moved = Math.hypot(p.x - st.x, p.y - st.y) > 0.05
    st.x = p.x
    st.y = p.y
    const dt = this.frameDt
    const size = HERO_SIZE
    if (p.hang === 2) {
      if (moved) st.ph += dt * 7.5
      const r = moved ? Math.sin(st.ph) : 0
      const sway = moved ? Math.sin(st.ph) : Math.sin(this.t * 1.7) * 0.25
      // eller başın üstünde telde, baş telin altında; kollar V: biri öne uzanırken öbürü geride tutar, yüz açıkta kalır
      const far = 158 - 8 * r
      const near = 204 + 8 * r
      const pose: Pose = { arms: [[far, far + 4], [near, near - 4]], legs: [[-4 + sway * 16, 12 + Math.abs(sway) * 8], [8 + sway * 12, 20]], hair: 0.25, lift: 0.15, reach: 2.6 }
      const top = Math.min(...handPos(pose).map((h) => h.y)) * (size / 100)
      // tel, oyuncu kutusunun 1 px üstünde: en yüksek el tam tele değer
      const dy = p.y + 1 - top - (p.y + p.h)
      return { pose, rot: sway * 0.07, pivot: -top, dy, moving: moved }
    }
    if (p.hang === 1) {
      if (moved) st.ph += dt * 5.5
      // Halat tırmanışı (yan profil): karakter halatın biraz arkasında, halat yüzünün önünden geçer. İki el de önde,
      // halatın üstünde: ikisi de başın üstünde, biri yukarı uzanırken öbürü aşağı çeker; tırmanırken sırayla yer değiştirirler.
      // Eller ters kinematikle (iki kemik) tam halata oturur; dizler öne, halatı sarar.
      const pose = climbPose(moved ? Math.sin(st.ph) : 0.6)
      // halatın tepesinde eller boşta kalmasın: en yüksek el halatın ucunun biraz altında tutulur (yalnız çizim)
      const w = this.world
      let dy = 0
      if (w) {
        const tx = Math.floor((p.x + p.w / 2) / T)
        // halatın tepesi: ayak hizasından (oyuncu halatın ucunun üstüne taşmış olabilir) yukarı doğru
        let ty = Math.floor((p.y + p.h - 2) / T)
        while (ty > 0 && w.tile(tx, ty - 1) === ROPE) ty--
        const top = Math.min(...handPos(pose).map((h) => h.y)) * (size / 100)
        dy = Math.max(0, ty * T + 3 - (p.y + p.h + top))
      }
      // karakter halatın arkasında: halat yüzünün önünden geçsin
      return { pose, rot: 0, pivot: 0, dy, dx: -p.facing * 7, moving: moved }
    }
    // su
    const speed = Math.hypot(p.vx, p.vy)
    const stroking = Math.abs(p.vx) > 22 || (speed > 50 && p.vy > 0)
    if (stroking) {
      // Kurbağalama (yan profil): çekiş → toplanma → tekme → süzülme. Kollar öne uzanır, yanlara açılıp göğse çeker;
      // dizler toplanır ve tekmeyle düzleşir. Döngü ~1,4 sn, hızlandıkça sıklaşır. Gövde gidiş yönüne yumuşakça döner
      // (yatay ~66°: yüz dibe değil ileri bakar; dalarken daha dik, yüzeye çıkarken daha yatık); kulaçla gelen ani hız gövdeyi titretmez.
      st.ph += dt * (3.6 + Math.min(1.6, Math.abs(p.vx) / 90))
      const pose = swimStroke((st.ph / (Math.PI * 2)) % 1)
      const dive = Math.atan2(p.vy, Math.max(30, Math.abs(p.vx)))
      const target = Math.max(0.62, Math.min(1.95, 1.16 + dive * 0.55))
      st.rot += (target - st.rot) * (1 - Math.pow(0.02, dt))
      const surge = Math.sin(st.ph) * 0.05
      return { pose, rot: st.rot + surge, pivot: size * 0.29, dy: -2 + Math.sin(st.ph) * 0.6, moving: true }
    }
    st.rot = 1.35
    st.ph += dt * 3.2
    const ph = st.ph
    // suda durma (yerinde kalma): dik, kollar önde yatay kürek çeker (sculling), bacaklar sırayla çırpar (eggbeater);
    // kulaçta (yükselirken) kollar aşağı iter, bacaklar birlikte vurur
    const up = p.vy < -60
    const k = Math.sin(ph)
    const k2 = Math.sin(ph + 1.4)
    const pose: Pose = up
      ? { arms: [[-38, -16], [34, 14]], legs: [[-12, 18], [14, 22]], hair: 0.5, lift: -0.7, tilt: 0.06 }
      : { arms: [[64 + k * 16, 92 + k * 26], [-58 - k * 16, -86 - k * 26]], legs: [[22 + k * 20, 62 + k2 * 22], [6 - k * 20, 56 - k2 * 22]], hair: 0.55, lift: 0.35, tilt: 0.05 }
    // su üstünde hafifçe iner kalkar (yüzüyormuş gibi)
    return { pose, rot: 0, pivot: 0, dy: 2 + Math.sin(this.t * 2.6 + p.x * 0.05) * 1.3, moving: true }
  }

  /** co-op eşinin karakteri (öbür kılık) */
  partnerLook: Look = 'memo'
  partnerScarf: { color: string; shade: string } | null = null
  /** eşin kombini (Mağaza: her yolcunun kendi kombini) */
  partnerAcc: Kit = NO_KIT

  private anims = new WeakMap<Player, HeroAnim>()

  /**
   * Oyuncunun (ve co-op eşinin) bu karedeki pozu. Her şey fizik durumundan ve saatten türer, kare hızından bağımsızdır:
   * koşu adımı katedilen yoldan ilerler (ayak kaymaz), kalkışta itiş ve kısa bir esneme, havada poz dikey hıza göre
   * akar (yükseliş → tepe → düşüş), yere yaklaşırken bacaklar inişe uzanır, iniş sönümlü yayla çöker ve hafifçe uzar.
   * Ters yöne basınca fren pozu; yön değişince gövde kâğıt gibi daralıp döner. Duvarda yüz duvara döner, el ve taban
   * duvara sürtünür; duvardan sekişte arka bacak iter, ardışık sekmelerde kollar sırayla atılır. Dash kısa bir
   * toplanmayla başlar, yöne göre ayrı pozla (yatay, çapraz yukarı, yukarı, çapraz aşağı, aşağı) uzar, bitince gövde
   * hafif bir salınımla dikilir. Kip değişince poz son çizilen pozdan yumuşakça geçer (tek karede sıçrayan poz yok).
   * Teleferikte gövde sarkaç gibi geride kalır. Atkı, saç ve savrulma hedefi gecikmeyle izler.
   */
  private heroAnim(p: Player, self: boolean) {
    let a = this.anims.get(p)
    if (!a) {
      a = {
        flow: 0, lift: 0, hair: 0, ang: 0, angV: 0, cvx: 0, px: p.x, rec: 0, recPose: POSES.dash, recRot: 0, recK: [1, 1], airMax: 0, hard: 0.5, grounded: p.grounded,
        out: newPose(), tmp: newPose(), from: newPose(), prev: newPose(), idleT: 0, landT: 9, ph: 0, mode: 'idle', xf: 1, xfDur: 0, airT: 0, jumped: false, wall: 0, pvy: p.vy,
        wjT: 9, wjN: 0, dashT: 0, vflip: p.facing < 0, turnT: 9, acc: 0, lvx: p.vx, stopT: 9,
      }
      this.anims.set(p, a)
    }
    const dt = Math.min(0.1, this.frameDt)
    const ease = (tau: number) => 1 - Math.exp(-dt / tau)
    const dashing = p.dashTime > 0
    const hold = dashing ? null : this.holdPose(p)
    // geçen karede çizilen poz: kip değişirse geçiş buradan başlar (yeni poz aynı tampona yazılmadan önce saklanır)
    copyPose(a.prev, a.out)
    // iniş sertliği: havadaki en büyük düşüş hızından
    if (!p.grounded) a.airMax = Math.max(a.airMax, p.vy)
    else if (!a.grounded) {
      a.hard = Math.max(0.45, Math.min(1, (a.airMax - 60) / 220))
      a.airMax = 0
      a.landT = 0
    }
    if (p.grounded) a.landT += dt
    // kalkış: yerden zıplayarak mı koptu (yürüyüp kenardan düşmek kalkış sayılmaz)
    if (a.grounded && !p.grounded) a.jumped = p.vy < -120
    a.airT = p.grounded ? 0 : a.airT + dt
    // duvardan sekme: önceki karede duvara yaslıydı, şimdi duvardan uzağa doğru hızla yükseliyor
    if (a.wall !== 0 && !p.grounded && a.pvy > -150 && p.vy < -200 && Math.sign(p.vx) === -a.wall) {
      a.wjT = 0
      a.wjN++
    } else a.wjT += dt
    a.wall = p.grounded || p.hang ? 0 : p.wallDir
    a.pvy = p.vy
    // ivme (yön ve hızlanma eğimi için), kısa gecikmeyle
    if (dt > 0) a.acc += ((p.vx - a.lvx) / dt - a.acc) * ease(0.05)
    a.lvx = p.vx
    // bekleme süresi: yerde, duran ve dash atmayan oyuncu için
    a.idleT = p.grounded && Math.abs(p.vx) < 5 && p.dashTime <= 0 ? a.idleT + dt : 0
    const look = (self ? this.accessory : this.partnerAcc).look
    a.grounded = p.grounded
    // teleferikte ilerleme hızı konumdan (teleferik vx yazmaz)
    a.cvx += ((dt > 0 ? (p.x - a.px) / dt : 0) - a.cvx) * ease(0.06)
    a.px = p.x
    let pose: Pose
    let mode: AnimMode
    let rot = 0
    let pivot = 0
    let dx = 0
    let dy = 0
    let flip = p.facing < 0
    let kx = 1
    let ky = 1
    let brake = false
    let flowT = Math.min(1.3, Math.hypot(p.vx, p.vy * 0.6) / PHYS.run)
    if (dashing) {
      mode = 'dash'
      a.dashT = a.mode === 'dash' ? a.dashT + dt : 0
      const [ddx, ddy] = p.dashDir
      if (ddx !== 0) flip = ddx < 0
      const fx = Math.abs(ddx)
      // kalkışta en çok gerilir, sonuna doğru toparlanır (yön boyunca uzar, hacim korunur)
      const u = Math.min(1, p.dashTime / PHYS.dashTime)
      const st = 0.08 + 0.14 * u
      let target: Pose
      if (Math.abs(ddy) < 0.35) {
        target = POSES.dash
        rot = 0.2 + 0.18 * u
        kx = 1 + st
        ky = 1 - st * 0.7
      } else {
        // yukarı: roket, çapraz yukarı: yöne uzanan kol · aşağı: ayakla, çapraz aşağı: kayan tekme
        if (ddy < 0) target = fx > 0.3 ? POSES.dashUp : POSES.rocket
        else target = fx > 0.3 ? POSES.dashDown : POSES.stomp
        rot = ddy < 0 ? Math.atan2(fx, -ddy) * (fx > 0.3 ? 0.85 : 1) : Math.atan2(-fx, ddy) * 0.8
        kx = 1 - st * 0.7
        ky = 1 + st
      }
      // ilk birkaç kare: gövde top gibi toplanır, sonra yöne fırlar (görsel; dash fizikte zaten başladı)
      const g = 1 - smooth01(a.dashT / DASH_GATHER)
      pose = g > 0 ? lerpPoseInto(a.tmp, target, POSES.gather, g * 0.85) : target
      kx += (1.08 - kx) * g
      ky += (0.9 - ky) * g
      rot *= 1 - 0.5 * g
      pivot = DASH_PIVOT
      flowT = 1.4
      a.rec = DASH_RECOVER
      a.recPose = target
      a.recRot = rot
      a.recK = [kx, ky]
    } else if (hold) {
      mode = 'hold'
      pose = hold.pose
      rot = hold.rot
      pivot = hold.pivot
      dx = hold.dx ?? 0
      dy = hold.dy
      flowT = p.hang === 1 ? 0.15 : hold.moving ? 0.7 : 0.25
      if (p.hang === 2) {
        // sarkaç: gövde ilerleme yönünün tersine geride kalır; durunca birkaç kez salınıp oturur (sabit alt adımlarla)
        const target = Math.max(-1, Math.min(1, a.cvx / PHYS.cableMove)) * 0.3
        for (let left = dt; left > 1e-6; left -= 1 / 240) {
          const h = Math.min(left, 1 / 240)
          a.angV += (-58 * (a.ang - target) - 3.2 * a.angV) * h
          a.ang += a.angV * h
        }
        rot = (p.facing < 0 ? -a.ang : a.ang) + hold.rot * 0.5
        flowT = Math.min(1, Math.abs(a.cvx) / PHYS.cableMove) * 0.8
      }
    } else if (!p.grounded) {
      if (p.wallDir !== 0 && p.vy > 0) {
        // yüz duvara döner, el ve taban duvara yaslanır (gövde duvardan biraz geri çizilir); kayarken el ve taban
        // duvara sürtünüp titrer, gövde hafifçe sarsılır (saate bağlı)
        mode = 'wall'
        pose = copyPose(a.out, POSES.wall)
        const sl = Math.min(1, p.vy / PHYS.wallSlideMax)
        const j = Math.sin(this.t * 41) * sl
        const j2 = Math.sin(this.t * 29 + 1.3) * sl
        pose.arms[1][0] += j * 3
        pose.arms[1][1] += j * 4
        pose.arms[0][1] += j2 * 3
        pose.legs[1][0] += j2 * 2.5
        pose.tilt = (pose.tilt ?? 0) - 0.03 * sl + j * 0.01
        flip = p.wallDir < 0
        dx = -p.wallDir * (2.5 + j2 * 0.15)
        flowT = 0.35
      } else {
        mode = 'air'
        pose = airPoseInto(a.out, p.vy, this.t)
        // ileri giderken gövde gidiş yönüne yatar, geri giderken dikleşir
        const fwd = Math.max(-1, Math.min(1.5, (p.vx * p.facing) / PHYS.run))
        pose.tilt = (pose.tilt ?? 0) + 0.07 * fwd
        // kalkış: arka bacak iter, kollar yukarı savrulur; ilk anlar sonra yükseliş pozuna akar
        if (a.jumped && a.airT < AIR_LAUNCH) lerpPoseInto(pose, pose, POSES.launch, 1 - smooth01(a.airT / AIR_LAUNCH))
        // duvardan sekme: itiş pozu kısa tutulur, sonra havaya akar; ardışık sekmelerde kollar sırayla atılır
        if (a.wjT < 0.32) lerpPoseInto(pose, pose, a.wjN % 2 ? POSES.kick2 : POSES.kick, 1 - smooth01((a.wjT - 0.09) / 0.23))
        // yere yaklaşırken (düşüşte) bacaklar inişe uzanır, kollar öne açılır
        if (p.vy > 60) {
          const reach = 8 + p.vy * 0.1
          const g = this.groundBelow(p)
          if (g < reach) lerpPoseInto(pose, pose, POSES.preland, smooth01(1 - g / reach) * Math.min(1, (p.vy - 60) / 120))
        }
        // yükselişte incelip uzar (kalkışta en çok), hızlı düşüşte hafifçe uzar; tepede (asılı an) yuvarlaklaşır
        const up = Math.max(0, Math.min(1, -p.vy / PHYS.jumpV)) * 0.14
        const down = Math.max(0, Math.min(1, (p.vy - 150) / 150)) * 0.07
        const apex = Math.max(0, 1 - Math.abs(p.vy) / 110)
        kx = 1 - (up + down) * 0.75 + 0.05 * apex
        ky = 1 + up + down - 0.04 * apex
        // kalkışın ilk iki karesi: çömelmeden fırlıyormuş gibi kısa bir basılma (sonra esneme)
        if (a.jumped && a.airT < 0.045) {
          const q = 1 - a.airT / 0.045
          kx += 0.1 * q
          ky -= 0.16 * q
        }
      }
    } else {
      const speed = Math.abs(p.vx)
      if (speed > 35 && Math.sign(p.vx) !== p.facing && !p.swim) {
        // fren: eski yöne bakar, geriye yaslanıp kayar
        mode = 'brake'
        pose = POSES.brake
        flip = p.vx < 0
        brake = true
      } else if (speed > 8) {
        mode = 'run'
        const k = Math.min(1.6, speed / PHYS.run)
        // ilk adım: dururken yakın bacak yerden kalkar; inişte öne uzanan yakın bacağın topuğu değer
        if (a.mode !== 'run') a.ph = a.mode === 'air' || a.mode === 'wall' ? 0.02 : 0.36
        a.ph = (a.ph + (speed * dt) / ((strideLength(k, look?.rs) * HERO_SIZE) / 100)) % 1
        pose = gaitInto(a.out, a.ph, k, look?.rs)
        // hızlanırken gövde öne eğilir
        pose.tilt = (pose.tilt ?? 0) + 0.1 * Math.max(0, Math.min(1, (a.acc * p.facing) / PHYS.accelGround))
      } else {
        mode = 'idle'
        // bekleme: seçili duruş, nefes, göz kırpma ve bir süre kıpırdamayınca küçük hareketler (bakınma, ayak oynatma, esneme, el sallama)
        pose = idlePose(a.out, look?.st, a.idleT, this.t + (self ? 0 : 1.9))
        // durunca gövde biraz öne gider, hafifçe geri gelip oturur (denge)
        if (a.mode === 'run') a.stopT = 0
        if (a.stopT < 0.6) pose.tilt = (pose.tilt ?? 0) + 0.11 * Math.exp(-a.stopT / 0.13) * Math.cos((a.stopT * Math.PI * 2) / 0.42)
      }
      if (a.landT < 0.5 && !brake) {
        // iniş: sönümlü yay; yere değdiği an düz başlar, ~45 ms'de en derine çöker (sertlikle derinleşir), sonra
        // hafifçe uzayıp oturur (squash ve stretch; hacim korunur). Koşarak inişte çöküş daha sığ.
        const sq = a.hard * 1.85 * Math.exp(-11 * a.landT) * Math.sin(26 * a.landT) * (mode === 'run' ? 0.6 : 1)
        if (sq > 0) pose = landInto(a.tmp, pose, Math.min(1, sq))
        kx = 1 + 0.18 * sq
        ky = 1 - 0.15 * sq
      }
    }
    a.stopT += dt
    // dash bitti: gövde birkaç kare içinde dikilir; dönüş dikin biraz ötesine salınıp oturur, esneme söner
    if (!dashing) a.rec = Math.max(0, a.rec - dt)
    if (!dashing && !hold && a.rec > 0) {
      const r = a.rec / DASH_RECOVER
      const k = smooth01(r)
      pose = lerpPoseInto(a.tmp, pose, a.recPose, k)
      rot += a.recRot * (k - 0.2 * Math.sin(Math.PI * r) * (1 - r))
      pivot = DASH_PIVOT
      kx += (a.recK[0] - 1) * k
      ky += (a.recK[1] - 1) * k
    }
    // kip değişti: son çizilen pozdan yeni poza yumuşak geçiş (dash'ten çıkışı yukarıdaki toparlanma taşır)
    if (mode !== a.mode) {
      const d = XFADE[mode]
      a.xfDur = a.mode === 'dash' ? 0 : a.mode === 'air' && mode !== 'wall' ? Math.min(d, 0.07) : d
      a.xf = 0
      copyPose(a.from, a.prev)
      a.mode = mode
    }
    if (a.xf < a.xfDur) {
      a.xf += dt
      pose = lerpPoseInto(a.tmp, a.from, pose, smooth01(a.xf / a.xfDur))
    }
    // yön değişimi: gövde kâğıt gibi daralıp döner (önce eski yöne bakarak daralır, sonra yeni yönde açılır);
    // dash anında döner, yalnız açılması görünür
    if (flip !== a.vflip && a.turnT >= TURN_IN) {
      a.turnT = dashing ? TURN_IN : 0
      if (dashing) a.vflip = flip
    }
    if (a.turnT < TURN_IN + TURN_OUT) {
      a.turnT += dt
      if (a.turnT < TURN_IN) kx *= 1 - TURN_K * smooth01(a.turnT / TURN_IN)
      else {
        a.vflip = flip
        kx *= 1 - TURN_K + TURN_K * smooth01((a.turnT - TURN_IN) / TURN_OUT)
      }
    } else a.vflip = flip
    flip = a.vflip
    // gecikmeli izleme: atkı hızla açılır, yavaş söner; saç ve savrulma kısa gecikmeyle
    a.flow += (flowT - a.flow) * ease(flowT > a.flow ? 0.05 : 0.22)
    a.lift += ((pose.lift ?? 0) - a.lift) * ease(0.09)
    a.hair += ((pose.hair ?? 0) - a.hair) * ease(0.07)
    // sonuç, bu oyuncuya ait tampona yazılır (kare başına nesne ayrılmaz; dash izi kendi kopyasını alır)
    if (pose !== a.out) copyPose(a.out, pose)
    a.out.lift = a.lift
    a.out.hair = a.hair
    pose = a.out
    const moving = hold ? hold.moving : Math.abs(p.vx) > 40 || !p.grounded
    return { pose, rot, pivot, dx, dy, flip, kx, ky, moving, flow: a.flow, brake }
  }

  /** ayak tabanından aşağıdaki ilk katı zemine (ya da tek yönlü tahtaya) uzaklık, dünya pikseli; üç karoda yoksa 99 */
  private groundBelow(p: Player): number {
    const w = this.world
    if (!w) return 99
    const foot = p.y + p.h
    const tx0 = Math.floor((p.x + 1) / T)
    const tx1 = Math.floor((p.x + p.w - 1) / T)
    const ty0 = Math.floor(foot / T)
    for (let ty = ty0; ty <= ty0 + 2; ty++)
      for (let tx = tx0; tx <= tx1; tx++) if (w.isSolid(tx, ty) || w.tile(tx, ty) === ONEWAY) return Math.max(0, ty * T - foot)
    return 99
  }

  /** Co-op eşi: oyuncuyla aynı pozlar (iz ve toz yok); dash hakkı bitince atkısı soluklaşır */
  private drawPartner(w: World) {
    const q = w.partner
    if (!q || q.dead) return
    const m = this.heroAnim(q, false)
    if ((this.t + 1.7) % 3.4 < 0.12) m.pose.blink = true
    const spent = !q.canDash
    this.heroes.push({ look: this.partnerLook, pose: m.pose, x: q.x + q.w / 2 + m.dx, y: q.y + q.h + m.dy, flip: m.flip, alpha: 1, ghost: false, moving: m.moving, sx: m.kx, sy: m.ky, rot: m.rot, pivot: m.pivot, flow: m.flow, scarf: spent ? '#7f8ca8' : this.partnerScarf?.color, scarfS: spent ? '#5a6680' : this.partnerScarf?.shade, acc: this.partnerAcc })
  }

  private drawPlayer(w: World, dt: number) {
    const p = w.player
    const look = this.character.id
    // dash izi: yol boyunca aralıklı birkaç soluk kopya. Kare başına değil mesafeye göre bırakılır:
    // 60 Hz'de de 120 Hz'de de aynı iz, üst üste yığılmaz ve çizim yükü sabit kalır
    for (const g of this.ghosts) g.life -= dt
    this.ghosts = this.ghosts.filter((g) => g.life > 0)
    // sert iniş için düşüş hızı izlenir (bekleme süresi heroAnim'de: duruşun canlı hareketleri onunla başlar)
    if (!p.grounded) this.airVy = Math.max(this.airVy, p.vy)
    // poz bir kez, iz bırakılmadan önce hesaplanır: iz kopyası karakterle aynı pozda ve dönüşte kalır
    const m = p.dead ? null : this.heroAnim(p, true)
    if (m && p.dashTime > 0) {
      const last = this.ghosts[this.ghosts.length - 1]
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= GHOST_GAP) {
        this.ghosts.push({ x: p.x, y: p.y, life: GHOST_LIFE, flip: m.flip, pose: copyPose(newPose(), m.pose), rot: m.rot, img: null, oy: 0 })
        if (this.ghosts.length > GHOST_MAX) this.ghosts.shift()
      }
    }
    for (const g of this.ghosts) {
      // kopyalar karakterin arkasında kalır: karaktere çok yakın olan çizilmez
      if (Math.hypot(p.x - g.x, p.y - g.y) < GHOST_GAP * 0.6) continue
      // iz eskidikçe hem solar hem incelir: hız hissi kuyruğa doğru sivrilir
      const k = g.life / GHOST_LIFE
      this.heroes.push({ look, pose: g.pose, x: g.x + p.w / 2, y: g.y + p.h, flip: g.flip, alpha: 0.38 * k * k, ghost: false, moving: true, sx: 0.9 + 0.2 * k, sy: 0.82 + 0.14 * k, acc: this.accessory, rot: g.rot, pivot: DASH_PIVOT, flow: 1.4, snap: g })
    }
    // hız çizgileri: dash boyunca gövdenin arkasında kısa, parlak çizgiler (mesafeye göre; kare hızından bağımsız)
    if (p.dashTime > 0 && !p.dead) {
      const at = this.streakAt
      if (!at || Math.hypot(p.x - at[0], p.y - at[1]) >= STREAK_GAP) {
        const n = (this.streakN = (this.streakN + 1) % 6)
        const [dx, dy] = p.dashDir
        // çizgi gövde boyunca üç şeritte sırayla çıkar (rastgele değil: her koşuda aynı desen)
        const off = (n % 3) - 1
        const tint = this.scarf?.color ?? LOOKS[this.character.id].scarf
        this.particles.push({ x: p.x + p.w / 2 - dx * 6 - dy * off * 5, y: p.y + p.h / 2 - dy * 6 + dx * off * 6, vx: -dx * 60, vy: -dy * 60, life: 0.16, max: 0.16, color: n % 2 ? '#fff6e0' : tint, size: n % 3 === 0 ? 2 : 1, grav: 0 })
        this.streakAt = [p.x, p.y]
      }
    } else if (this.streakAt) {
      // dash bitti: küçük bir fren tozu
      if (!p.dead && p.grounded) for (let i = 0; i < 3; i++) this.particles.push({ x: p.x + p.w / 2 + p.facing * 4, y: p.y + p.h - 1, vx: p.facing * (18 + i * 10), vy: -14 - i * 6, life: 0.26, max: 0.26, color: 'rgba(230,220,200,0.7)', size: 1, grav: 80 })
      this.streakAt = null
    }
    // nitro alev izi: koştukça ayakların arkasından turuncu kıvılcım (mesafeye göre, kare hızından bağımsız)
    if (p.nitro > 0 && !p.dead && Math.abs(p.vx) > 20) {
      const at = this.nitroAt
      if (!at || Math.hypot(p.x - at[0], p.y - at[1]) >= 5) {
        const n = (this.streakN = (this.streakN + 1) % 6)
        const back = -Math.sign(p.vx)
        this.particles.push({ x: p.x + p.w / 2 + back * 5, y: p.y + p.h - 4 - (n % 3) * 3, vx: back * 40, vy: -18 - (n % 2) * 14, life: 0.3, max: 0.3, color: n % 3 === 0 ? '#ffe27a' : '#ff9a3c', size: n % 2 ? 1 : 2, grav: -40 })
        this.nitroAt = [p.x, p.y]
      }
    } else this.nitroAt = null
    if (!m) return

    // göz kırpma: oyuncunun kendi saati (bekleme pozu zaten kırpar; koşarken de ara sıra)
    const pose = m.pose
    if (this.t % 3.4 < 0.12) pose.blink = true
    const footX = p.x + p.w / 2
    const footY = p.y + p.h
    // dash hakkı bitince atkı soluklaşır: ne zaman yeniden dash atabileceğin görünür
    const spent = !p.canDash
    this.heroes.push({ look, pose, x: footX + m.dx, y: footY + m.dy, flip: m.flip, alpha: 1, ghost: false, moving: m.moving, sx: m.kx, sy: m.ky, scarf: spent ? '#7f8ca8' : this.scarf?.color, scarfS: spent ? '#5a6680' : this.scarf?.shade, acc: this.accessory, rot: m.rot, pivot: m.pivot, flow: m.flow })

    this.petTimer = Math.max(0, this.petTimer - dt)
    // koşu tozu ve duvar kayma kıvılcımı
    this.dustTimer -= dt
    if (this.dustTimer <= 0) {
      if (m.brake) {
        // fren tozu: kayan ayağın önünden, kayış yönüne savrulur
        const d = Math.sign(p.vx)
        this.particles.push({ x: footX + d * 5, y: footY - 1, vx: d * (30 + (this.streakN = (this.streakN + 1) % 6) * 6), vy: -22, life: 0.3, max: 0.3, color: 'rgba(230,220,200,0.75)', size: this.streakN % 2 ? 1 : 2, grav: 60 })
        this.dustTimer = 0.035
      } else if (p.grounded && Math.abs(p.vx) > 60) {
        this.particles.push({ x: footX - p.facing * 5, y: footY - 1, vx: -p.facing * 20, vy: -18, life: 0.35, max: 0.35, color: 'rgba(230,220,200,0.7)', size: 1, grav: 40 })
        this.dustTimer = 0.09
      } else if (!p.grounded && p.wallDir !== 0 && p.vy > 20) {
        this.particles.push({ x: p.wallDir > 0 ? p.x + p.w : p.x, y: p.y + 4, vx: -p.wallDir * 15, vy: 10, life: 0.3, max: 0.3, color: 'rgba(255,240,200,0.8)', size: 1, grav: 60 })
        this.dustTimer = 0.06
      }
    }
  }

  private dustTimer = 0
  private petTimer = 0
  private drawParticles(b: Ctx, dt: number) {
    for (const pt of this.particles) {
      pt.life -= dt
      pt.vy += pt.grav * dt
      pt.x += pt.vx * dt
      pt.y += pt.vy * dt
      if (pt.life <= 0) continue
      b.globalAlpha = Math.min(1, pt.life / 0.4)
      rect(b, pt.x, pt.y, pt.size, pt.size, pt.color)
    }
    b.globalAlpha = 1
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const pp of this.pops) pp.life -= dt
    this.pops = this.pops.filter((p) => p.life > 0)
  }

  private popFamily: string | null = null
  /** sayfanın başlık fontu (next/font değişkeni); bulunamazsa sistem yazısı */
  private popFont() {
    if (this.popFamily === null) {
      const v = typeof document !== 'undefined' ? getComputedStyle(document.body).getPropertyValue('--font-title').trim() : ''
      this.popFamily = v ? `${v}, system-ui, sans-serif` : 'system-ui, sans-serif'
    }
    return this.popFamily
  }

  /** Kombo ve +1 yazıları: büyüyerek belirir, süzülerek kaybolur; ana tuvalde net çizilir */
  private drawPops(c: Ctx, cx: number, cy: number, sc: number) {
    if (!this.pops.length) return
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.lineJoin = 'round'
    for (const pp of this.pops) {
      const age = 0.9 - pp.life
      const grow = Math.min(1, age / 0.12)
      const size = Math.round(sc * (pp.big ? 6 : 4.5) * (0.6 + 0.4 * grow + (age < 0.18 ? 0.15 * Math.sin((age / 0.18) * Math.PI) : 0)))
      const x = (pp.x - cx) * sc
      const y = (pp.y - cy - age * 16) * sc
      c.globalAlpha = Math.min(1, pp.life / 0.3)
      c.font = `700 ${size}px ${this.popFont()}`
      c.lineWidth = Math.max(2, sc * 1.1)
      c.strokeStyle = '#120f1a'
      c.strokeText(pp.text, x, y)
      c.fillStyle = pp.color
      c.fillText(pp.text, x, y)
    }
    c.globalAlpha = 1
  }

  /** Dünya koordinatındaki etiketler net görünsün diye ana tuvalde çizilir */
  private drawLabels(w: World, cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    const e = w.exit
    const next = NEXT_CITY[w.level.city]
    const ex = (e.x + T / 2 - cx) * sc
    const ey = (e.y + e.h - 46 - cy) * sc
    this.drawPops(c, cx, cy, sc)
    if (w.warp) this.sign(c, (w.warp.x + T / 2 - cx) * sc, (w.warp.y + w.warp.h - 48 - cy) * sc, sc, this.lang === 'en' ? 'TOWN SQUARE →' : 'MEYDAN →', '#8e2630')
    this.sign(c, ex, ey, sc, next ? `${next} →` : this.lang === 'en' ? 'LAST STOP' : 'SON DURAK', '#1d4f91')
    this.drawDialog(w, cx, cy)
  }

  /** Konuşma baloncuğu: kişinin (ya da tabelanın) üstünde, kuyruğu ona dönük; yazı daktilo gibi akar. */
  private drawDialog(w: World, cx: number, cy: number) {
    const d = this.dialog
    if (!d) return
    const sc = this.scale
    // çapa: konuşan kişinin başı ya da tabelanın tepesi; yanından ayrılınca baloncuk kalkar
    let ax: number
    let ay: number
    let look: Look | null = null
    if (d.kind === 'npc') {
      const n = w.npcs.find((q) => q.index === w.nearNpc)
      if (!n) return
      look = w.level.npcs[w.nearNpc]?.look ?? 'amca'
      ax = n.x + T / 2
      ay = n.y + T - NPC_SIZE - 3
    } else {
      const s = w.signs.find((q) => q.index === w.nearSign)
      if (!s) return
      ax = s.x + T / 2
      ay = s.y - 1
    }
    // baloncuk karakterin başına da binmesin: ikisinin de üstünde açılır
    const heroTop = w.player.y + w.player.h - HERO_SIZE - 3
    const lift = Math.max(0, ay - heroTop)
    ay = Math.min(ay, heroTop)
    const key = `${d.kind}:${d.text}`
    if (key !== this.dlgKey) {
      this.dlgKey = key
      this.dlgAt = this.t
    }
    const c = this.ctx
    const u = this.dpr
    const W = this.canvas.width
    const small = this.canvas.height / u < 520 || this.canvas.width / u < 500
    // okunaklı: gövde 13/15 px, satır aralığı geniş, satır en çok ~42 harf
    const size = Math.round((small ? 14 : 16) * u)
    const nameSize = Math.round((small ? 11.5 : 13) * u)
    const pad = Math.round((small ? 10 : 13) * u)
    const lh = Math.round(size * 1.4)
    const maxW = Math.min(W - 24 * u, (small ? 290 : 400) * u)
    const body = `500 ${size}px ${this.textFont()}`
    const bold = `700 ${size}px ${this.textFont()}`
    const sign = d.kind === 'sign'
    // tabela: cümle cümle maddeler; yapılacak eylem (iki noktadan sonrası, ünlemle biten cümle) kalın ve renkli.
    // Uzun boss tabelası tek paragraf hâlinde okunmuyordu (25 Kasım 2026)
    const loc = this.lang === 'en' ? 'en' : 'tr'
    // noktalı virgülle ayrılan adım kendi cümlesi olur: büyük harfle başlar, noktayla biter
    const paras = sign
      ? d.text
          .split(/(?<=[.;!?])\s+/)
          .filter(Boolean)
          .map((q) => q.charAt(0).toLocaleUpperCase(loc) + q.slice(1).replace(/;$/, '.'))
      : [d.text]
    const bullets = sign && paras.length > 1
    const indent = bullets ? Math.round(size * 1.35) : 0
    // şehir insanının balonunda solda küçük vesikalık: kimin konuştuğu ilk bakışta belli (26 Kasım 2026)
    const pw = look ? Math.round((small ? 40 : 50) * u) : 0
    const ox = pw ? pw + Math.round(10 * u) : 0
    type Line = { words: { w: string; hi: boolean }[]; first: boolean; gap: boolean; n: number }
    const lines: Line[] = []
    paras.forEach((para, pi) => {
      const colon = para.lastIndexOf(':')
      const loud = sign && para.endsWith('!')
      let pos = 0
      let cur: Line = { words: [], first: true, gap: pi > 0, n: 0 }
      let curW = 0
      for (const word of para.split(' ')) {
        const hi = sign && (loud || (colon >= 0 && pos > colon))
        pos += word.length + 1
        c.font = hi ? bold : body
        const ww = c.measureText(word + ' ').width
        if (curW + ww > maxW - pad * 2 - indent - ox && cur.words.length) {
          lines.push(cur)
          cur = { words: [], first: false, gap: false, n: 0 }
          curW = 0
        }
        cur.words.push({ w: word, hi })
        cur.n += word.length + 1
        curW += ww
      }
      if (cur.words.length) lines.push(cur)
    })
    // tabelanın başlığı (simgeyle): balon ne olduğunu ilk bakışta söyler
    const title = d.name ?? (sign ? (this.lang === 'en' ? 'Signpost' : 'Tabela') : undefined)
    const iconW = sign ? Math.round(nameSize * 1.5) : 0
    const lineW = (l: Line) => l.words.reduce((a, q) => ((c.font = q.hi ? bold : body), a + c.measureText(q.w + ' ').width), 0) + indent
    const paraGap = bullets ? Math.round(size * 0.35) : 0
    let tw = Math.max(...lines.map(lineW))
    if (title) {
      c.font = `700 ${nameSize}px ${this.popFont()}`
      tw = Math.max(tw, c.measureText(title).width + iconW + (sign ? 0 : nameSize))
    }
    const bw = Math.ceil(tw + pad * 2 + ox)
    const head = title ? Math.round(nameSize * 2) : 0
    const gaps = lines.filter((l) => l.gap).length * paraGap
    const bh = Math.max(pw + pad * 2, Math.ceil(pad * 2 + head + lines.length * lh - (lh - size) + gaps))
    const tail = Math.round(8 * u)
    const tipX = (ax - cx) * sc
    const tipY = (ay - cy) * sc
    // kuyruk konuşana dek uzar (tabela alçaksa karakterin yanından iner)
    const reach = lift * sc
    // karakterin ekrandaki kutusu (baş dahil): baloncuk buna hiçbir durumda binmez
    const pl = w.player
    const hero = { x0: (pl.x - 4 - cx) * sc, x1: (pl.x + pl.w + 4 - cx) * sc, y0: (pl.y + pl.h - HERO_SIZE - 4 - cy) * sc, y1: (pl.y + pl.h - cy) * sc }
    const [bx, by] = placeBubble({ tipX, tipY, bw, bh, tail, W, H: this.canvas.height, top: 64 * u, edge: 12 * u, gap: 8 * u }, hero)
    const k = Math.min(1, (this.t - this.dlgAt) / 0.16)
    // daktilo: saniyede ~130 harf; kutu yazılan satır kadar büyür (genişlik baştan tam: titremez, boş kâğıt kalmaz)
    const typed = Math.floor((this.t - this.dlgAt) * 130)
    let started = 0
    let startedGaps = 0
    for (let i = 0, at = 0; i < lines.length; i++) {
      if (typed > at) {
        started = i + 1
        if (lines[i].gap) startedGaps += paraGap
      }
      at += lines[i].n
    }
    const shownH = Math.max(pw + pad * 2, Math.ceil(pad * 2 + head + Math.max(1, started) * lh - (lh - size) + startedGaps))
    // balon konuşanın üstündeyse alt kenarı sabit kalır (yukarı büyür), altındaysa üst kenarı
    const above = tipY - tail > by + bh - 1
    const top = above ? by + bh - shownH : by
    c.save()
    c.globalAlpha = k
    c.translate(0, (1 - k) * 6 * u)
    const r = 10 * u
    // yumuşak gölge
    c.fillStyle = 'rgba(10,6,20,0.3)'
    c.beginPath()
    c.roundRect(bx + 3 * u, top + 5 * u, bw, shownH, r)
    c.fill()
    c.lineJoin = 'round'
    c.lineWidth = Math.max(2, 2.5 * u)
    const tx = Math.max(bx + 16 * u, Math.min(bx + bw - 16 * u, tipX))
    const shape = () => {
      c.beginPath()
      c.roundRect(bx, top, bw, shownH, r)
      if (above && tipX > bx && tipX < bx + bw) {
        c.moveTo(tx - 7 * u, top + shownH - 1)
        c.lineTo(tipX, tipY + Math.min(reach, 4 * u))
        c.lineTo(tx + 7 * u, top + shownH - 1)
      }
    }
    if (sign) {
      // ahşap tabela: sıcak tahta geçişi, açık kenar, köşelerde çivi, tahta damarı
      const g = c.createLinearGradient(0, top, 0, top + shownH)
      g.addColorStop(0, '#5a3e28')
      g.addColorStop(1, '#3a281b')
      shape()
      c.strokeStyle = '#1e140e'
      c.lineWidth = Math.max(3, 4 * u)
      c.stroke()
      c.fillStyle = g
      c.fill()
      c.lineWidth = Math.max(1, 1.5 * u)
      c.strokeStyle = 'rgba(240,200,130,0.55)'
      c.beginPath()
      c.roundRect(bx + 3 * u, top + 3 * u, bw - 6 * u, shownH - 6 * u, r - 3 * u)
      c.stroke()
      c.strokeStyle = 'rgba(20,12,8,0.18)'
      for (let gy = top + 14 * u; gy < top + shownH - 8 * u; gy += 11 * u) {
        c.beginPath()
        c.moveTo(bx + 10 * u, gy)
        c.bezierCurveTo(bx + bw * 0.35, gy + 2 * u, bx + bw * 0.65, gy - 2 * u, bx + bw - 10 * u, gy)
        c.stroke()
      }
      c.fillStyle = '#c9a46a'
      for (const [nx, ny] of [[bx + 8 * u, top + 8 * u], [bx + bw - 8 * u, top + 8 * u], [bx + 8 * u, top + shownH - 8 * u], [bx + bw - 8 * u, top + shownH - 8 * u]]) {
        c.beginPath()
        c.arc(nx, ny, 1.8 * u, 0, Math.PI * 2)
        c.fill()
      }
    } else {
      // krem kâğıt: üstte ılık açık, altta bir ton koyu; ince sıcak koyu hat
      const g = c.createLinearGradient(0, top, 0, top + shownH)
      g.addColorStop(0, '#fffcf4')
      g.addColorStop(1, '#f4ead8')
      shape()
      c.strokeStyle = '#3a2430'
      c.stroke()
      c.fillStyle = g
      c.fill()
      // konuşanın vesikalığı (konuşma başına bir kez çizilir, önbellekten basılır)
      if (look && pw) {
        const pk = `${look}:${pw}`
        if (this.dlgFace?.key !== pk) {
          const cv = document.createElement('canvas')
          cv.width = cv.height = pw
          drawPortrait(cv.getContext('2d')!, look, pw, pw, 0, { face: true, still: true })
          this.dlgFace = { key: pk, cv }
        }
        const px0 = bx + pad
        const py0 = top + pad
        c.fillStyle = '#d9a441'
        c.beginPath()
        c.roundRect(px0 - 2 * u, py0 - 2 * u, pw + 4 * u, pw + 4 * u, 8 * u)
        c.fill()
        c.drawImage(this.dlgFace.cv, px0, py0)
      }
    }
    c.textAlign = 'left'
    c.textBaseline = 'top'
    let y = top + pad
    if (title) {
      c.font = `700 ${nameSize}px ${this.popFont()}`
      if (sign) {
        // küçük tabela simgesi: direk ve levha
        const ix = bx + pad
        const iy = y - 1 * u
        c.fillStyle = '#c79a62'
        c.fillRect(ix + nameSize * 0.45, iy + nameSize * 0.55, nameSize * 0.16, nameSize * 0.65)
        c.beginPath()
        c.roundRect(ix, iy, nameSize * 1.05, nameSize * 0.7, 2 * u)
        c.fill()
        c.fillStyle = '#3a281b'
        c.fillRect(ix + nameSize * 0.2, iy + nameSize * 0.3, nameSize * 0.65, Math.max(1, 1.2 * u))
        c.fillStyle = '#f0d49a'
        c.fillText(title, ix + iconW, y)
      } else {
        // ad etiketi: renkli şerit içinde
        const tw2 = c.measureText(title).width
        c.fillStyle = '#9a3e22'
        c.beginPath()
        c.roundRect(bx + pad + ox - 5 * u, y - 3 * u, tw2 + 10 * u, nameSize + 6 * u, 5 * u)
        c.fill()
        c.fillStyle = '#fffaf0'
        c.fillText(title, bx + pad + ox, y)
      }
      y += head
    }
    let left = typed
    let step = 0
    for (const l of lines) {
      if (left <= 0) break
      if (l.gap) y += paraGap
      let x = bx + pad + indent + ox
      if (bullets && l.first) {
        // adım numarası: altın daire
        const rr = size * 0.52
        const ccx = bx + pad + rr
        const ccy = y + size * 0.5
        c.fillStyle = '#f0b84a'
        c.beginPath()
        c.arc(ccx, ccy, rr, 0, Math.PI * 2)
        c.fill()
        c.fillStyle = '#3a281b'
        c.font = `800 ${Math.round(size * 0.7)}px ${this.textFont()}`
        c.textAlign = 'center'
        c.fillText(String(++step), ccx, ccy - size * 0.36)
        c.textAlign = 'left'
      }
      for (const q of l.words) {
        if (left <= 0) break
        const part = q.w.slice(0, left)
        c.font = q.hi ? bold : body
        c.fillStyle = q.hi ? (sign ? '#ffd36a' : '#9a3e22') : sign ? '#fbf3e4' : '#221a28'
        c.fillText(part, x, y)
        this.caretX = x + c.measureText(part).width + 1
        x += c.measureText(q.w + ' ').width
        left -= q.w.length + 1
      }
      y += lh
    }
    // yazı akarken satır sonunda yanıp sönen imleç (söz bitince kalkar)
    const total = lines.reduce((a, l) => a + l.n, 0)
    if (typed < total && Math.floor(this.t * 4) % 2 === 0) {
      c.fillStyle = sign ? '#ffd36a' : '#9a3e22'
      c.fillRect(this.caretX, y - lh + size * 0.1, Math.max(1.5, 2 * u), size * 0.9)
    }
    c.restore()
  }

  /** konuşma balonundaki vesikalığın önbelleği ve imlecin son yeri */
  private dlgFace: { key: string; cv: HTMLCanvasElement } | null = null
  private caretX = 0

  private textFamily: string | null = null

  /** gövde yazısı: arayüzle aynı (Figtree) */
  private textFont() {
    if (this.textFamily === null) {
      const v = typeof document !== 'undefined' ? getComputedStyle(document.body).getPropertyValue('--font-body').trim() : ''
      this.textFamily = v ? `${v}, system-ui, sans-serif` : 'system-ui, sans-serif'
    }
    return this.textFamily
  }

  /** Yol tabelası: renkli levha, beyaz çerçeve, ortalanmış yazı. */
  private sign(c: Ctx, x: number, y: number, sc: number, label: string, color: string) {
    if (x < -200 || x > this.canvas.width + 200) return
    c.font = `700 ${Math.round(sc * 5)}px ui-monospace, monospace`
    const tw = c.measureText(label).width
    const pad = sc * 3
    c.fillStyle = color
    c.fillRect(x - tw / 2 - pad, y - sc * 6, tw + pad * 2, sc * 9)
    c.strokeStyle = '#f4f4f4'
    c.lineWidth = Math.max(1, sc * 0.6)
    c.strokeRect(x - tw / 2 - pad + sc, y - sc * 5, tw + pad * 2 - sc * 2, sc * 7)
    c.fillStyle = '#ffffff'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText(label, x, y - sc * 1.5)
  }
}

/**
 * Konuşma baloncuğunun yeri (ekran pikseli): önce konuşanın üstüne (kuyruğu ona dönük), ekrandan ve üstteki HUD'dan
 * taşmadan. Böyle yerleşince karakterin kutusuyla çakışıyorsa (yukarıda yer yok) karakterin yanına, boş tarafa geçer.
 */
/** iç mekân bölümünde gök (ve bulut) görünmez */
function w0Indoor(w: World) {
  return !!w.level.indoor
}

export function placeBubble(
  o: { tipX: number; tipY: number; bw: number; bh: number; tail: number; W: number; H: number; top: number; edge: number; gap: number },
  hero: { x0: number; y0: number; x1: number; y1: number },
): [number, number] {
  const clampX = (x: number) => Math.max(o.edge, Math.min(o.W - o.bw - o.edge, x))
  let bx = clampX(o.tipX - o.bw * 0.4)
  let by = Math.max(o.top, o.tipY - o.tail - o.bh)
  const hits = (x: number, y: number) => x < hero.x1 && x + o.bw > hero.x0 && y < hero.y1 && y + o.bh > hero.y0
  if (hits(bx, by)) {
    // yanına: sağda yer varsa sağa, yoksa sola; baş hizasında
    const right = o.W - o.edge - (hero.x1 + o.gap)
    bx = right >= o.bw ? hero.x1 + o.gap : clampX(hero.x0 - o.gap - o.bw)
    by = Math.max(o.top, Math.min(o.H - o.bh - o.edge, hero.y0))
    // iki yanda da yer yoksa (çok dar ekran) karakterin altına
    if (hits(bx, by)) by = Math.min(o.H - o.bh - o.edge, hero.y1 + o.gap)
  }
  return [bx, by]
}

/** kare başına çizilecek en çok piksel (tuvalin arka çözünürlüğü): aşağı yukarı 1080p */
export const PIXEL_BUDGET = 2_600_000

/**
 * Tuvalin arka çözünürlük oranı: ekranın yoğunluğu (deviceDpr) ama kare başına PIXEL_BUDGET'ı aşmadan, en az 1.
 * Retina, 4K ve DPR 3 telefonlarda tam yoğunlukta çizmek boyama yükünü 2-3 katına çıkarıp kare kaçırtıyordu.
 * Kanıt: tests/perf.test.ts (bilinen ekranlar) ve scripts/verify-perf.cjs (üretim derlemesinde kare kaçırma).
 */
export function backingDpr(cssW: number, cssH: number, deviceDpr: number) {
  return Math.max(1, Math.min(deviceDpr, Math.sqrt(PIXEL_BUDGET / Math.max(1, cssW * cssH))))
}

/**
 * karakterin dünya pikseli cinsinden boyu (çarpışma kutusu 12x14; kafa kutunun üstüne taşar). 25 Kasım 2026: karakter
 * küçük başlı, uzun bacaklı orana geçti (boyun ~1/4,7'si baş); telefonda okunsun diye 29'dan 32'ye (tam iki karo:
 * yürünen en alçak aralığa sığar)
 */
const HERO_SIZE = 32

/** karakter yatayda bir tık dolgun çizilir: ince görünüyordu, uzaktan kolay seçilsin (25 Kasım 2026) */
const HERO_WIDE = 1.14

/** şehir insanları oyuncudan bir tık kısa */
const NPC_SIZE = 30

interface HeroDraw {
  look: Look
  size?: number
  pose: Pose
  /** ayak tabanı orta noktası (dünya) */
  x: number
  y: number
  flip: boolean
  alpha: number
  ghost: boolean
  moving: boolean
  sx: number
  sy: number
  scarf?: string
  scarfS?: string
  acc?: Kit
  /** bütün gövdenin dönüşü (radyan, ileri +): yüzerken yatar, telde salınır; `pivot` ayak tabanından yukarı (dünya px) */
  rot?: number
  pivot?: number
  /** atkının savrulması (0 sarkık .. 1,4 dash), gecikmeli izler */
  flow?: number
  /** şehir insanının sırası: duran insan önbellekten basılır (`drawCached`) */
  cache?: number
  /** dash izi kopyası: bir kez çizilir, sonra hazır görüntüsü basılır */
  snap?: Ghost
}

/** oyuncu başına çizim durumu (render.ts heroAnim): gecikmeler, sarkaç, dash toparlanması, iniş sertliği */
interface HeroAnim {
  flow: number
  lift: number
  hair: number
  /** teleferikte sarkaç açısı (dünya, saat yönü +) ve açısal hızı */
  ang: number
  angV: number
  /** teleferikte ilerleme hızı (konumdan; teleferik vx yazmaz) */
  cvx: number
  px: number
  /** dash bitince toparlanma süresi, dash'in son pozu ve dönüşü */
  rec: number
  recPose: Pose
  recRot: number
  recK: [number, number]
  airMax: number
  hard: number
  grounded: boolean
  /** kare başına ayırmamak için poz tamponları: sonuç ve ara karışım */
  out: Pose
  tmp: Pose
  /** kıpırdamadan geçen süre (bekleme duruşunun canlı hareketleri) ve inişten beri geçen süre (sönümlü yay) */
  idleT: number
  landT: number
  /** koşu döngüsünün evresi (katedilen yoldan ilerler) */
  ph: number
  /** poz kipi ve kip değişince geçişin başladığı poz, geçen süre ve geçiş süresi */
  mode: AnimMode
  from: Pose
  prev: Pose
  xf: number
  xfDur: number
  /** havada geçen süre, zıplayarak mı kalktı, önceki karede yaslandığı duvar ve dikey hız */
  airT: number
  jumped: boolean
  wall: number
  pvy: number
  /** son duvar sekmesinden beri geçen süre ve sekme sayısı (ardışık sekmelerde poz sırayla değişir) */
  wjT: number
  wjN: number
  /** dash başladığından beri geçen süre */
  dashT: number
  /** çizilen yön ve dönüşün başından beri geçen süre */
  vflip: boolean
  turnT: number
  /** yatay ivme (yumuşatılmış) ve önceki yatay hız */
  acc: number
  lvx: number
  /** koşudan durmaya geçtiğinden beri geçen süre (denge salınımı) */
  stopT: number
}

/** poz kipleri: kip değişince poz son çizilen pozdan yumuşakça geçer */
type AnimMode = 'idle' | 'run' | 'brake' | 'air' | 'wall' | 'dash' | 'hold'
/** kipe girerken geçiş süresi (sn) */
const XFADE: Record<AnimMode, number> = { idle: 0.16, run: 0.1, brake: 0.07, air: 0.08, wall: 0.09, dash: 0.03, hold: 0.1 }
const smooth01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u))
/** dash'in başındaki görsel toplanma süresi (sn) */
const DASH_GATHER = 0.035
/** zıplamada kalkış pozunun süresi (sn) */
const AIR_LAUNCH = 0.13
/** yön değişiminde daralma ve açılma süreleri (sn) */
const TURN_IN = 0.03
const TURN_OUT = 0.065
/** dönüşte gövdenin en çok daralma oranı (çok daralırsa çubuk gibi görünüp hata sanılır) */
const TURN_K = 0.4
/** dash'in ardından gövdenin toparlanma süresi (sn) */
const DASH_RECOVER = 0.2
/** dash ve toparlanmada gövdenin döndüğü nokta: ayak tabanından yukarı (dünya px) */
const DASH_PIVOT = 14

interface Pop {
  x: number
  y: number
  text: string
  color: string
  life: number
  big: boolean
}

/** Renkli blokların şehre özgü kılığı: mantık aynı (plaka rengi değiştirir), görüntü şehre göre */
const SWITCH_SKIN: Partial<Record<CityKey, 'shadow' | 'daynight'>> = { bursa: 'shadow', van: 'daynight' }

/** hayalet atkısı: soluk, gri-mavi (filtre yerine) */
const GHOST_SCARF = '#aab6cc'
const GHOST_SCARF_SHADE = '#7f8ca8'

const NEXT_CITY: Record<CityKey, string | null> = {
  istanbul: 'EDİRNE',
  edirne: 'KOCAELİ',
  kocaeli: 'BURSA',
  bursa: 'ESKİŞEHİR',
  eskisehir: 'ÇANAKKALE',
  canakkale: 'İZMİR',
  izmir: 'ANTALYA',
  antalya: 'ANKARA',
  ankara: 'KONYA',
  konya: 'NEVŞEHİR',
  nevsehir: 'KAYSERİ',
  kayseri: 'ADANA',
  adana: 'HATAY',
  hatay: 'GAZİANTEP',
  gaziantep: 'ŞANLIURFA',
  sanliurfa: 'DİYARBAKIR',
  diyarbakir: 'MARDİN',
  mardin: 'MALATYA',
  malatya: 'ÇORUM',
  corum: 'SİNOP',
  sinop: 'ORDU',
  ordu: 'TRABZON',
  trabzon: 'SİVAS',
  sivas: 'VAN',
  van: 'ERZURUM',
  erzurum: 'ARDAHAN',
  ardahan: 'AMASYA',
  amasya: 'MUĞLA',
  mugla: 'BAYBURT',
  bayburt: 'RİZE',
  rize: 'ARTVİN',
  artvin: 'KARS',
  kars: 'BİTLİS',
  bitlis: 'AĞRI',
  agri: 'GİRESUN',
  giresun: 'TOKAT',
  tokat: 'DENİZLİ',
  denizli: 'ZONGULDAK',
  zonguldak: 'MERSİN',
  mersin: 'KARABÜK',
  karabuk: 'AYDIN',
  aydin: 'BALIKESİR',
  balikesir: 'ELAZIĞ',
  elazig: 'AFYON',
  afyon: 'BİNGÖL',
  bingol: null,
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

function mixHex(hex: string, to: string, t: number) {
  if (hex[0] !== '#' || hex.length !== 7) return hex
  const a = parseInt(hex.slice(1), 16)
  const b = parseInt(to.slice(1), 16)
  const ch = (sh: number) => Math.round(((a >> sh) & 255) + ((((b >> sh) & 255) - ((a >> sh) & 255)) * t))
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`
}

function lighten(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((n >> 16) & 255) + 40)
  const g = Math.min(255, ((n >> 8) & 255) + 40)
  const b = Math.min(255, (n & 255) + 40)
  return `rgb(${r},${g},${b})`
}

/** karo koordinatından sabit desen sayısı (gelgit dibinin çakılı, kabuğu, yosunu) */
function tideHash(a: number, b: number) {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}

/** tabela yazısı için 3×7 piksel harfler (üstte iki satır nokta/şapka payı) */
const PIX_FONT: Record<string, string[]> = {
  A: ['...', '...', '###', '#.#', '###', '#.#', '#.#'],
  Ç: ['...', '...', '###', '#..', '#..', '###', '.#.'],
  I: ['...', '...', '###', '.#.', '.#.', '.#.', '###'],
  K: ['...', '...', '#.#', '##.', '#..', '##.', '#.#'],
  B: ['...', '...', '##.', '#.#', '##.', '#.#', '##.'],
  Ü: ['...', '#.#', '...', '#.#', '#.#', '#.#', '###'],
  F: ['...', '...', '###', '#..', '##.', '#..', '#..'],
  E: ['...', '...', '###', '#..', '##.', '#..', '###'],
}

/** havuz teyzesinin çığlık sözleri [TR, EN]: görünce bağırıp havlu fırlatırken (komik, kısa; balonda okunur) */
const AUNT_SHOUT: [string, string][] = [
  ['Aaaa! Bakma!', 'Eeek! Don’t look!'],
  ['Bizi dikizleme!', 'Stop peeking at us!'],
  ['Telefonu bırak!', 'Put that phone down!'],
  ['Çek o kamerayı!', 'Get that camera away!'],
  ['Utanmaz! Al sana havlu!', 'Shameless! Have a towel!'],
  ['Bone tak, bone!', 'Swim cap, please!'],
  ['Terliksiz mi girdin?!', 'No slippers?! Really?!'],
  ['Story mi atıyorsun?!', 'Are you posting a story?!'],
  ['Kaymağımı mı yedin?!', 'Did you eat my kaymak?!'],
  ['Saat dokuz, bizim saat!', 'It’s nine, it’s our hour!'],
  ['Annen biliyor mu?!', 'Does your mother know?!'],
  ['Havlu geliyor, eğil!', 'Towel incoming, duck!'],
]
/** dönmeden önceki şüphe sözleri [TR, EN] */
const AUNT_HM: [string, string][] = [
  ['Hı?', 'Hm?'],
  ['Kim var orada?', 'Who’s there?'],
  ['Bir ses mi geldi?', 'Did I hear something?'],
  ['Kim o?', 'Who is it?'],
  ['Terlik sesi mi o?', 'Was that a slipper?'],
  ['Çay demlendi mi?', 'Is the tea ready?'],
  ['Biri mi dikiziyor?', 'Is someone peeking?'],
]
