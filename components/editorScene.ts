/**
 * Bölüm Düzenleyici'nin ızgara çizimi. İki görünüş:
 *  - Oyun: harita oyundaki gibi. Arkada şehrin gökyüzü ve parallax katmanları (art.ts buildLayers), zemin ve duvarlar oyunun
 *    elle çizilmiş zemini (terrainDraw.ts TerrainHD), canlılar ve toplananlar oyunun vektör çizimleri (enemyDraw, heroDraw,
 *    bossDraw). Su, renkli blok, raylı platform gibi hareketli karolar sade çizimle kalır (oyunda kendileri hareket eder).
 *  - Şema: her karo okunsun diye sade renkli kare + simge (seçilen şehrin paletinden).
 * Akıcılık: yalnız görünen sütunlar çizilir; zemin hücre hücre önbellektedir ve düzenlemeden sonra yalnız değişen karoların
 * çevresi yeniden çizilir (TerrainHD.adopt). Sürükleyerek boyarken zemin yenilenmez, değişen karolar sade çizimle gösterilir;
 * bırakınca bir kez yenilenir. Nesneler ölçek başına bir kez küçük tuvale çizilip oradan basılır.
 */
import { BOSSES, makeBoss } from '@/game/boss'
import { drawBoss } from '@/game/bossDraw'
import { CITY, LAYER_H, LAYER_W, buildLayers, enemySpecies, type CityStyle, type Layers } from '@/game/art'
import { drawEnemy, drawKeepsake, drawThing } from '@/game/enemyDraw'
import { INK, POSES, drawHero, type Look as HeroLook } from '@/game/heroDraw'
import { World, type EnemyKind } from '@/game/sim'
import { TerrainHD } from '@/game/terrainDraw'
import type { CityKey } from '@/game/types'
import { ROWS, customLevel, type CustomTexts } from '@/lib/customLevel'
import { KEEP } from '@/lib/editorKit'

export type ViewMode = 'oyun' | 'sema'
type Ctx = CanvasRenderingContext2D
const T = 16
/** zeminin (TerrainHD) çizdiği karolar */
const TERRAIN = new Set('#=^vIi><%'.split(''))
const HERO_SIZE = 29
const NPC_SIZE = 27

interface Art {
  /** kutu (dünya pikseli) ve çizim noktasının karonun sol üstüne göre yeri */
  box: [number, number]
  at: [number, number]
  /** çizim noktasının kutunun altına uzaklığı (ortalanmış nesnelerde parıltı payı) */
  pad?: number
  paint: (c: Ctx, x: number, y: number, sc: number, city: CityKey, v: string) => void
}

const ENEMY: Record<string, { kind: EnemyKind; w: number; h: number; foot: number }> = {
  e: { kind: 'ground', w: 12, h: 10, foot: 16 },
  f: { kind: 'fly', w: 12, h: 8, foot: 12 },
  h: { kind: 'hopper', w: 12, h: 10, foot: 16 },
  c: { kind: 'charger', w: 14, h: 12, foot: 16 },
  u: { kind: 'bat', w: 12, h: 8, foot: 12 },
  x: { kind: 'spiky', w: 12, h: 9, foot: 16 },
  j: { kind: 'magpie', w: 12, h: 9, foot: 15 },
}

const enemyArt = (ch: string): Art => {
  const d = ENEMY[ch]
  return {
    box: [40, 34],
    at: [8, d.foot],
    paint: (c, x, y, sc, city) => drawEnemy(c, enemySpecies(d.kind, city), { kind: d.kind, state: 'idle', w: d.w, h: d.h, phase: 0, timer: 0 }, x, y, sc, -1, 0),
  }
}

/** Mürekkep hatlı dolu yol */
function inked(c: Ctx, sc: number, fill: string, build: () => void) {
  c.beginPath()
  build()
  c.fillStyle = fill
  c.fill()
  c.lineWidth = Math.max(1, 1.1 * sc)
  c.strokeStyle = INK
  c.lineJoin = 'round'
  c.stroke()
}

/** Bayrak: direk ve ay yıldızlı kırmızı flama (sim: bayrak karosu ve üstündeki karo) */
function paintFlag(c: Ctx, x: number, y: number, sc: number) {
  // (x, y): direğin dibi
  inked(c, sc, '#ece6da', () => c.rect(x - 1 * sc, y - 28 * sc, 2 * sc, 28 * sc))
  inked(c, sc, '#e30a17', () => {
    c.moveTo(x + 1 * sc, y - 28 * sc)
    c.lineTo(x + 13 * sc, y - 27 * sc)
    c.quadraticCurveTo(x + 11 * sc, y - 23.5 * sc, x + 13 * sc, y - 20 * sc)
    c.lineTo(x + 1 * sc, y - 19 * sc)
    c.closePath()
  })
  c.fillStyle = '#fff'
  c.beginPath()
  c.arc(x + 5.6 * sc, y - 23.6 * sc, 2.6 * sc, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#e30a17'
  c.beginPath()
  c.arc(x + 6.4 * sc, y - 23.6 * sc, 2.1 * sc, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#fff'
  c.beginPath()
  c.arc(x + 9.4 * sc, y - 23.6 * sc, 0.9 * sc, 0, Math.PI * 2)
  c.fill()
  inked(c, sc, '#8a6a4a', () => c.ellipse(x, y - 0.5 * sc, 3 * sc, 1.2 * sc, 0, 0, Math.PI * 2))
}

/** Çıkış kapısı: kemerli ahşap kapı, altın pervaz (sim: karonun kendisi ve üstündeki) */
function paintExit(c: Ctx, x: number, y: number, sc: number) {
  // (x, y): kapının sol alt köşesi
  const arch = (inset: number) => {
    c.moveTo(x + inset * sc, y)
    c.lineTo(x + inset * sc, y - 24 * sc)
    c.arc(x + 8 * sc, y - 24 * sc, (8 - inset) * sc, Math.PI, 0)
    c.lineTo(x + (16 - inset) * sc, y)
    c.closePath()
  }
  inked(c, sc, '#ffcc66', () => arch(0))
  inked(c, sc, '#6b4226', () => arch(2.4))
  c.strokeStyle = '#4a2c18'
  c.lineWidth = 0.8 * sc
  c.beginPath()
  for (const dx of [5.5, 8, 10.5]) {
    c.moveTo(x + dx * sc, y - 1 * sc)
    c.lineTo(x + dx * sc, y - 26 * sc)
  }
  c.stroke()
  c.fillStyle = '#ffcc66'
  c.beginPath()
  c.arc(x + 11.6 * sc, y - 12 * sc, 1.1 * sc, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = 'rgba(255,214,120,0.9)'
  c.beginPath()
  c.arc(x + 8 * sc, y - 33.5 * sc, 1.6 * sc, 0, Math.PI * 2)
  c.fill()
}

/** Tabela: direk üstünde tahta, ortasında üç nokta */
function paintSign(c: Ctx, x: number, y: number, sc: number) {
  // (x, y): direğin dibi
  inked(c, sc, '#5a3c26', () => c.rect(x - 1 * sc, y - 9 * sc, 2 * sc, 9 * sc))
  inked(c, sc, '#c79a62', () => c.roundRect(x - 7 * sc, y - 16 * sc, 14 * sc, 9 * sc, 1.5 * sc))
  c.fillStyle = '#3a2a1e'
  for (const dx of [-3, 0, 3]) {
    c.beginPath()
    c.arc(x + dx * sc, y - 11.5 * sc, 0.9 * sc, 0, Math.PI * 2)
    c.fill()
  }
}

const ART: Record<string, Art> = {
  P: { box: [36, 44], at: [8, 16], paint: (c, x, y, sc) => drawHero(c, 'uktun', POSES.idle, x, y, HERO_SIZE * sc, false, 0, {}) },
  n: { box: [36, 42], at: [8, 16], paint: (c, x, y, sc, _city, v) => drawHero(c, (v || 'amca') as HeroLook, POSES.idle, x, y, NPC_SIZE * sc, true, 0, {}) },
  C: { box: [32, 32], at: [8, 8], pad: 16, paint: (c, x, y, sc, city) => drawKeepsake(c, city, x, y, sc, 0) },
  K: { box: [32, 32], at: [8, 8], pad: 16, paint: (c, x, y, sc) => drawThing(c, 'key', x, y, sc, 0) },
  $: { box: [32, 32], at: [8, 8], pad: 16, paint: (c, x, y, sc, city) => drawThing(c, 'stamp', x, y, sc, 0, { accent: CITY[city].accent }) },
  '!': { box: [32, 32], at: [8, 8], pad: 16, paint: (c, x, y, sc) => drawThing(c, 'charm', x, y, sc, 0) },
  '*': { box: [32, 32], at: [8, 8], pad: 16, paint: (c, x, y, sc) => drawThing(c, 'crystal', x, y, sc, 0, { active: true, ready: true, charge: 1 }) },
  T: { box: [32, 34], at: [8, 10], pad: 16, paint: (c, x, y, sc) => drawThing(c, 'nitro', x, y, sc, 0, { active: true, charge: 1 }) },
  S: { box: [28, 26], at: [8, 12], paint: (c, x, y, sc, city) => drawThing(c, 'spring', x, y, sc, 0, { squash: 0, accent: CITY[city].accent, crate: city === 'malatya' }) },
  F: { box: [24, 40], at: [4, 16], paint: (c, x, y, sc) => paintFlag(c, x, y, sc) },
  E: { box: [24, 44], at: [0, 16], paint: (c, x, y, sc) => paintExit(c, x, y, sc) },
  '?': { box: [24, 24], at: [8, 16], paint: (c, x, y, sc) => paintSign(c, x, y, sc) },
  ...Object.fromEntries(Object.keys(ENEMY).map((ch) => [ch, enemyArt(ch)])),
}

/** Boss'un çizim kutusu (dünya pikseli): gövdesinden geniş, iner kalkar diye payı bol */
function bossArt(city: CityKey, flip: boolean): Art {
  const def = BOSSES[city]
  const bw = Math.ceil(def.w * 1.7 + 24)
  const bh = Math.ceil(def.h * 1.6 + 24)
  return {
    box: [bw, bh],
    at: [def.w / 2, 16],
    paint: (c, x, y, sc) => {
      const b = makeBoss(def, 0, 0, 0, 100)
      b.state = 'move'
      b.hidden = false
      b.dir = flip ? 1 : -1
      drawBoss(c, city, b, x, y, sc, 0.4)
    },
  }
}

/** Gerçek çizimi olan karolar (palet de bunları oyunun çizimiyle gösterir) */
const HAS_ART = new Set([...Object.keys(ART), 'Q'])

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

const layerCache = new Map<CityKey, Layers>()
const layersOf = (city: CityKey) => {
  let l = layerCache.get(city)
  if (!l) layerCache.set(city, (l = buildLayers(city)))
  return l
}

/** Küçük tuvale çizilmiş nesne: ölçek, şehir ve türe göre bir kez */
const spriteCache = new Map<string, HTMLCanvasElement>()
function spriteOf(art: Art, key: string, scDev: number, city: CityKey, v: string): HTMLCanvasElement {
  const k = `${key}|${v}|${city}|${scDev.toFixed(3)}`
  let cv = spriteCache.get(k)
  if (cv) return cv
  if (spriteCache.size > 600) spriteCache.clear()
  cv = document.createElement('canvas')
  const [bw, bh] = art.box
  // kutunun ortası x'te çizim noktası; dikeyde çizim noktası kutunun altından pad kadar yukarıda
  cv.width = Math.max(1, Math.ceil(bw * scDev))
  cv.height = Math.max(1, Math.ceil(bh * scDev))
  const c = cv.getContext('2d')!
  art.paint(c, (bw / 2) * scDev, (bh - (art.pad ?? 6)) * scDev, scDev, city, v)
  spriteCache.set(k, cv)
  return cv
}

/** Bir nesneyi karosuna basar (c dünya pikseli dönüşümünde) */
function stampArt(c: Ctx, art: Art, key: string, tx: number, ty: number, scDev: number, city: CityKey, v = '') {
  const cv = spriteOf(art, key, scDev, city, v)
  const [bw, bh] = art.box
  c.drawImage(cv, tx * T + art.at[0] - bw / 2, ty * T + art.at[1] - (bh - (art.pad ?? 6)), bw, bh)
}

/**
 * Palet simgesi: oyunun çizimiyle (nesne, canlı, boss) ya da sade karo. size: tuvalin cihaz pikseli kenarı.
 */
export function paintSwatch(c: Ctx, sym: string, size: number, look: Look, city: CityKey, mode: ViewMode) {
  if (mode === 'oyun' && TERRAIN.has(sym)) {
    c.drawImage(terrainSwatch(sym, city, size), 0, 0, size, size)
    return
  }
  const art = sym === 'Q' ? bossArt(city, false) : ART[sym]
  if (mode === 'oyun' && art) {
    const [bw, bh] = art.box
    // görünen boy: kutu bol paylı, ölçek çizilen gövdeye göre
    const fit = sym === 'Q' ? Math.min(size / (BOSSES[city].w * 1.2), size / (BOSSES[city].h * 1.15)) : sym === 'P' || sym === 'n' ? size / 31 : sym === 'F' || sym === 'E' ? size / 36 : size / 19
    const cv = spriteOf(art, sym, fit, city, sym === 'n' ? 'amca' : '')
    // karonun sol üstü kutuda: çizim noktasından geri
    const tx = bw / 2 - art.at[0]
    const ty = bh - (art.pad ?? 6) - art.at[1]
    const small = ['C', 'K', '$', '!', '*', 'T', 'f', 'u'].includes(sym)
    const dx = size / 2 - (tx + 8) * fit
    const dy = small ? size / 2 - (ty + 8) * fit : size * 0.95 - (ty + 16) * fit
    c.drawImage(cv, dx, dy, bw * fit, bh * fit)
    return
  }
  const s = size * 0.84
  drawTile(c, sym, (size - s) / 2, (size - s) / 2, s, look)
}

/** Zemin karosunun palet simgesi: küçük bir haritada oyunun kendi zemin çizimiyle (şehir ve boy başına bir kez) */
const SWATCH_MAPS: Record<string, string[]> = {
  '=': ['    ', '    ', ' == ', '    '],
  '^': ['    ', '    ', ' ^^ ', '####'],
  v: ['####', ' vv ', '    ', '    '],
  '%': ['####', '#%%#', '#%%#', '####'],
}
const terrainCache = new Map<string, HTMLCanvasElement>()
function terrainSwatch(sym: string, city: CityKey, size: number): HTMLCanvasElement {
  const key = `${sym}|${city}|${size}`
  let cv = terrainCache.get(key)
  if (cv) return cv
  cv = document.createElement('canvas')
  cv.width = cv.height = size
  const rows = SWATCH_MAPS[sym] ?? ['    ', ` ${sym}${sym} `, ` ${sym}${sym} `, '    ']
  // dört karo genişlik; harita altı TerrainHD'de son satır gibi sürer, kadraj üst dört satırda kalır
  const w = new World(customLevel(rows, city))
  const sc = size / (4 * T)
  new TerrainHD(w, city, sc).draw(cv.getContext('2d')!, 0, 0, size, size)
  terrainCache.set(key, cv)
  return cv
}

/** Oyun görünüşünde ızgaranın çizimi; Editor her değişiklikte draw() çağırır. */
export class EditorScene {
  private built: { map: string[]; key: string; world: World; terrain: TerrainHD | null } | null = null
  private bg: HTMLCanvasElement | null = null
  /** zemin hücrelerini ısıtmak için çizimden sonra birkaç kare daha */
  private warm = 0
  private warming = false
  private raf = 0

  constructor(private readonly redraw: () => void) {}

  dispose() {
    cancelAnimationFrame(this.raf)
  }

  /**
   * Izgarayı çizer. c: tuvalin bağlamı (dönüşüm sıfır), sx: kaydırma (css piksel), viewW/H: görünen alan (css piksel),
   * cell: karonun css boyu, dpr: tuvalin yoğunluğu, busy: sürükleyerek boyanıyor (zemin bırakınca yenilenir).
   */
  draw(c: Ctx, o: { map: string[]; city: CityKey; texts: CustomTexts; look: Look; mode: ViewMode; sx: number; viewW: number; cell: number; dpr: number; busy: boolean }) {
    const { map, city, look, sx, viewW, cell, dpr } = o
    const H = ROWS * cell
    const devW = Math.round(viewW * dpr)
    const devH = Math.round(H * dpr)
    const cols = map[0].length
    const k = cell / T
    const scDev = k * dpr
    const x0 = Math.max(0, Math.floor(sx / cell) - 2)
    const x1 = Math.min(cols, Math.ceil((sx + viewW) / cell) + 2)
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.clearRect(0, 0, devW, devH)
    if (o.mode === 'sema') {
      this.drawPlan(c, map, look, sx, viewW, cell, dpr, x0, x1)
      return
    }

    // zemin: haritası, şehri ya da ölçeği değişince yenilenir (sürüklerken değil, bırakınca)
    const key = `${city}|${scDev.toFixed(3)}|${o.texts.boss ?? ''}|${o.texts.boss2 ?? ''}`
    const stale = !this.built || this.built.map !== map || this.built.key !== key
    if (stale && (!o.busy || !this.built || this.built.key !== key)) this.rebuild(map, city, o.texts, key, scDev)
    const built = this.built!

    // arka: gökyüzü, uzak-orta-yakın katmanlar (oyundaki gibi; dikeyde bütün harita görünür, katmanlar zemin çizgisine oturur)
    if (!this.bg || this.bg.width !== devW || this.bg.height !== devH) {
      this.bg = document.createElement('canvas')
      this.bg.width = devW
      this.bg.height = devH
    }
    const b = this.bg.getContext('2d')!
    const p = CITY[city]
    b.setTransform(1, 0, 0, 1, 0, 0)
    const sky = b.createLinearGradient(0, 0, 0, devH)
    sky.addColorStop(0, p.sky[0])
    sky.addColorStop(0.6, p.sky[1])
    sky.addColorStop(1, p.sky[2])
    b.fillStyle = sky
    b.fillRect(0, 0, devW, devH)
    const L = layersOf(city)
    b.imageSmoothingEnabled = false
    const cx = sx / k
    const base = (20 * T + 22 - LAYER_H) * scDev
    for (const [cv, f, fill, tint] of [
      [L.far, 0.12, p.far, 0.22],
      [L.mid, 0.25, p.mid, 0.16],
      [L.near, 0.45, p.near, 0.12],
    ] as const) {
      let x = -((cx * f) % LAYER_W)
      if (x > 0) x -= LAYER_W
      for (; x * scDev < devW; x += LAYER_W) b.drawImage(cv, Math.round(x * scDev), Math.round(base), Math.ceil(LAYER_W * scDev), Math.ceil(LAYER_H * scDev))
      const bottom = base + LAYER_H * scDev
      if (bottom < devH) {
        b.fillStyle = fill
        b.fillRect(0, bottom, devW, devH - bottom)
      }
      b.fillStyle = hexA(p.sky[2], tint)
      b.fillRect(0, 0, devW, devH)
    }
    // düzenlerken ızgara ve nesneler öne çıksın: arka biraz geri çekilir
    b.fillStyle = 'rgba(14,13,34,0.18)'
    b.fillRect(0, 0, devW, devH)
    c.drawImage(this.bg, 0, 0)

    // zemin ve duvarlar: oyunun elle çizilmiş zemini
    built.terrain?.draw(c, sx / k, 0, devW, devH)
    // ardından birkaç kare daha çizilir: TerrainHD görünenin çevresini her çizimde küçük bir bütçeyle önceden hazırlar
    if (!this.warming) this.warm = 12

    c.setTransform(scDev, 0, 0, scDev, -sx * dpr, 0)
    // yeni zemin çizilene dek değişen zemin karoları: arkayı geri koy, sade çiz
    const old = built.map
    if (old !== map)
      for (let y = 0; y < ROWS; y++)
        for (let x = x0; x < x1; x++) {
          const a = old[y][x]
          const n = map[y][x]
          if (a === n || (!TERRAIN.has(a) && !TERRAIN.has(n))) continue
          if (TERRAIN.has(a)) {
            c.save()
            c.setTransform(1, 0, 0, 1, 0, 0)
            const px = Math.floor((x * cell - sx) * dpr)
            const py = Math.floor(y * cell * dpr)
            const pw = Math.ceil(cell * dpr) + 1
            c.drawImage(this.bg, px, py, pw, pw, px, py, pw, pw)
            c.restore()
          }
          if (TERRAIN.has(n)) drawTile(c, n, x * T, y * T, T, look, y > 0 ? map[y - 1][x] : ' ')
        }

    // hareketli karolar (su, blok, platform, halat…): sade çizim; nesneler ve canlılar: oyunun çizimi
    const late: Array<[string, number, number]> = []
    const npcLook = npcLooks(map, o.texts)
    for (let y = 0; y < ROWS; y++)
      for (let x = x0; x < x1; x++) {
        const ch = map[y][x]
        if (ch === ' ' || TERRAIN.has(ch)) continue
        if (HAS_ART.has(ch)) late.push([ch, x, y])
        else drawTile(c, ch, x * T, y * T, T, look, y > 0 ? map[y - 1][x] : ' ')
      }
    // çizim sırası: kapı ve bayrak arkada, canlılar önde
    const order = (ch: string) => (ch === 'E' || ch === 'F' || ch === '?' ? 0 : ch === 'Q' ? 1 : ch === 'P' ? 3 : 2)
    late.sort((a, b2) => order(a[0]) - order(b2[0]))
    for (const [ch, x, y] of late) {
      if (ch === 'Q') {
        const boss = o.texts.boss ?? city
        stampArt(c, bossArt(boss, false), 'Q', x, y, scDev, boss)
        // ikinci boss arenanın öbür ucundan (sim: birinin aynası)
        if (o.texts.boss2) {
          const row = map[y]
          const stop = (s: string | undefined) => s === undefined || s === '|' || s === '#' || s === 'G'
          let l = x - 1
          while (l >= 0 && !stop(row[l])) l--
          let r = x + 1
          while (r < cols && !stop(row[r])) r++
          const def2 = BOSSES[o.texts.boss2]
          const bx = (l + 1) * T + (r * T - def2.w) - x * T
          stampArt(c, bossArt(o.texts.boss2, true), 'Q2', bx / T, y, scDev, o.texts.boss2)
        }
        continue
      }
      stampArt(c, ART[ch], ch, x, y, scDev, city, ch === 'n' ? (npcLook.get(y * cols + x) ?? 'amca') : '')
    }
    c.setTransform(1, 0, 0, 1, 0, 0)

    if (this.warm > 0) {
      this.warm--
      cancelAnimationFrame(this.raf)
      this.raf = requestAnimationFrame(() => {
        this.warming = true
        this.redraw()
        this.warming = false
      })
    }
  }

  private rebuild(map: string[], city: CityKey, texts: CustomTexts, key: string, scDev: number) {
    const prev = this.built
    const world = new World(customLevel(map, city, texts))
    const terrain = new TerrainHD(world, city, scDev)
    if (prev?.terrain && prev.key === key && prev.map[0].length === map[0].length) {
      // değişen karolar: sütun başına iki boyutlu önek toplamı, aralık sorgusu sabit sürede
      const cols = map[0].length
      const W = cols + 1
      const sum = new Uint32Array(W * (ROWS + 1))
      for (let y = 0; y < ROWS; y++) {
        const a = prev.map[y]
        const n = map[y]
        for (let x = 0; x < cols; x++) {
          const d = a[x] !== n[x] && (TERRAIN.has(a[x]) || TERRAIN.has(n[x]) || a[x] === 'P' || n[x] === 'P') ? 1 : 0
          sum[(y + 1) * W + x + 1] = d + sum[y * W + x + 1] + sum[(y + 1) * W + x] - sum[y * W + x]
        }
      }
      const clamp = (v: number, hi: number) => Math.max(0, Math.min(hi, v))
      terrain.adopt(prev.terrain, (tx0, tx1, ty0, ty1) => {
        const a0 = clamp(tx0, cols)
        const a1 = clamp(tx1 + 1, cols)
        const b0 = clamp(ty0, ROWS)
        const b1 = clamp(ty1 + 1, ROWS)
        if (a1 <= a0 || b1 <= b0) return false
        return sum[b1 * W + a1] - sum[b0 * W + a1] - sum[b1 * W + a0] + sum[b0 * W + a0] > 0
      })
    }
    this.built = { map, key, world, terrain }
  }

  /** Şema görünüşü: gök + koyu örtü, sade karolar */
  private drawPlan(c: Ctx, map: string[], look: Look, sx: number, viewW: number, cell: number, dpr: number, x0: number, x1: number) {
    const H = ROWS * cell
    c.setTransform(dpr, 0, 0, dpr, -sx * dpr, 0)
    const sky = c.createLinearGradient(0, 0, 0, H)
    look.city.sky.forEach((col, i) => sky.addColorStop(i / (look.city.sky.length - 1), col))
    c.fillStyle = sky
    c.fillRect(sx, 0, viewW, H)
    c.globalAlpha = 0.45
    c.fillStyle = look.ink
    c.fillRect(sx, 0, viewW, H)
    c.globalAlpha = 1
    const late: Array<[string, number, number]> = []
    for (let y = 0; y < ROWS; y++)
      for (let x = x0; x < x1; x++) {
        const ch = map[y][x]
        if (ch === ' ') continue
        if (ch === 'E' || ch === 'P') late.push([ch, x, y])
        else drawTile(c, ch, x * cell, y * cell, cell, look, y > 0 ? map[y - 1][x] : ' ')
      }
    for (const [ch, x, y] of late) drawTile(c, ch, x * cell, y * cell, cell, look)
    c.setTransform(1, 0, 0, 1, 0, 0)
  }
}

/** Şehir insanlarının kılığı: oyun onları soldan sağa (aynı sütunda yukarıdan aşağı) sıralar */
function npcLooks(map: string[], texts: CustomTexts): Map<number, string> {
  const cols = map[0].length
  const at: Array<[number, number]> = []
  map.forEach((row, y) => {
    for (let x = row.indexOf('n'); x >= 0; x = row.indexOf('n', x + 1)) at.push([x, y])
  })
  at.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  return new Map(at.map(([x, y], k) => [y * cols + x, texts.npcs[k]?.look ?? 'amca']))
}

/** Çizim renkleri: şehrin paleti + tema değişkenleri (globals.css @theme). */
export interface Look {
  city: CityStyle
  gold: string
  flag: string
  cream: string
  ink: string
  sign: string
  accent: string
}

function tri(c: CanvasRenderingContext2D, pts: number[], fill: string, stroke?: string) {
  c.beginPath()
  c.moveTo(pts[0], pts[1])
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1])
  c.closePath()
  c.fillStyle = fill
  c.fill()
  if (stroke) {
    c.strokeStyle = stroke
    c.lineWidth = 1
    c.stroke()
  }
}

function disc(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  c.fillStyle = fill
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fill()
}

/** Düşman: kırmızı gövde + iki göz; türü süsüyle ayrılır */
function creature(c: CanvasRenderingContext2D, ch: string, x: number, y: number, u: number, look: Look) {
  const cx = x + 8 * u
  const cy = ch === 'f' || ch === 'u' || ch === 'j' ? y + 7 * u : y + 10 * u
  const body = ch === 'u' ? '#7a4aa8' : ch === 'j' ? '#1c1c28' : look.flag
  if (ch === 'f') {
    tri(c, [cx, cy, x + u, cy - 5 * u, x + 3 * u, cy + 2 * u], look.flag)
    tri(c, [cx, cy, x + 15 * u, cy - 5 * u, x + 13 * u, cy + 2 * u], look.flag)
  } else if (ch === 'u') {
    tri(c, [cx, cy, x, cy - 4 * u, x + 3 * u, cy + 4 * u], look.ink)
    tri(c, [cx, cy, x + 16 * u, cy - 4 * u, x + 13 * u, cy + 4 * u], look.ink)
  } else if (ch === 'x') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2
      tri(c, [cx + Math.cos(a - 0.4) * 4 * u, cy + Math.sin(a - 0.4) * 4 * u, cx + Math.cos(a) * 7.5 * u, cy + Math.sin(a) * 7.5 * u, cx + Math.cos(a + 0.4) * 4 * u, cy + Math.sin(a + 0.4) * 4 * u], look.cream)
    }
  } else if (ch === 'c') {
    tri(c, [cx - 5 * u, cy - 3 * u, cx - 6 * u, cy - 8 * u, cx - 2 * u, cy - 4 * u], look.cream)
    tri(c, [cx + 5 * u, cy - 3 * u, cx + 6 * u, cy - 8 * u, cx + 2 * u, cy - 4 * u], look.cream)
  } else if (ch === 'h') {
    c.strokeStyle = look.cream
    c.lineWidth = u
    c.beginPath()
    c.moveTo(cx - 3 * u, cy + 4 * u)
    c.lineTo(cx - 5 * u, cy + 6 * u)
    c.moveTo(cx + 3 * u, cy + 4 * u)
    c.lineTo(cx + 5 * u, cy + 6 * u)
    c.stroke()
  }
  disc(c, cx, cy, 5 * u, body)
  if (ch === 'j') {
    c.fillStyle = look.cream
    c.fillRect(cx - 5 * u, cy + u, 10 * u, 3 * u)
    tri(c, [cx + 4 * u, cy - 2 * u, cx + 9 * u, cy, cx + 4 * u, cy + u], look.gold)
  }
  c.fillStyle = look.cream
  c.fillRect(cx - 2.5 * u, cy - 2 * u, 2 * u, 2 * u)
  c.fillRect(cx + 0.5 * u, cy - 2 * u, 2 * u, 2 * u)
}

/** İki yönlü ok (raylı platformların yönü) */
function arrows(c: CanvasRenderingContext2D, x: number, y: number, u: number, axis: 'x' | 'y', color: string) {
  const cx = x + 8 * u
  const cy = y + 10 * u
  if (axis === 'x') {
    tri(c, [cx - 7 * u, cy, cx - 3 * u, cy - 3 * u, cx - 3 * u, cy + 3 * u], color)
    tri(c, [cx + 7 * u, cy, cx + 3 * u, cy - 3 * u, cx + 3 * u, cy + 3 * u], color)
  } else {
    tri(c, [cx, y + 6 * u, cx - 3 * u, y + 9.5 * u, cx + 3 * u, y + 9.5 * u], color)
    tri(c, [cx, y + 15.5 * u, cx - 3 * u, y + 12 * u, cx + 3 * u, y + 12 * u], color)
  }
}

/** Tek karo; above: üstteki karo (zeminin üst örtüsü ve suyun dalgası için). */
export function drawTile(c: CanvasRenderingContext2D, ch: string, x: number, y: number, s: number, look: Look, above = ' ') {
  const p = look.city
  const u = s / 16
  switch (ch) {
    case '#':
      c.fillStyle = p.tile
      c.fillRect(x, y, s, s)
      c.fillStyle = p.tileDark
      c.fillRect(x, y + s - 2 * u, s, 2 * u)
      if (above !== '#') {
        c.fillStyle = p.tileTop
        c.fillRect(x, y, s, 4 * u)
      }
      break
    case '%':
      c.globalAlpha = 0.55
      c.fillStyle = p.tile
      c.fillRect(x, y, s, s)
      c.globalAlpha = 1
      c.setLineDash([2 * u, 2 * u])
      c.strokeStyle = look.cream
      c.lineWidth = u
      c.strokeRect(x + u / 2, y + u / 2, s - u, s - u)
      c.setLineDash([])
      break
    case '=':
      c.fillStyle = p.plank
      c.fillRect(x, y, s, 5 * u)
      c.fillStyle = p.tileDark
      c.fillRect(x, y + 5 * u, s, u)
      break
    case '^':
      tri(c, [x + u, y + s, x + s / 2, y + 3 * u, x + s - u, y + s], p.spike[0], p.spike[1])
      break
    case 'v':
      tri(c, [x + u, y, x + s / 2, y + s - 3 * u, x + s - u, y], p.spike[0], p.spike[1])
      break
    case 'I':
      c.fillStyle = p.water[2]
      c.fillRect(x, y, s, s)
      c.fillStyle = look.cream
      c.fillRect(x + 3 * u, y + 3 * u, 4 * u, 2 * u)
      c.strokeStyle = p.water[0]
      c.lineWidth = u
      c.strokeRect(x + u / 2, y + u / 2, s - u, s - u)
      break
    case 'i':
      c.fillStyle = p.tileLight
      c.fillRect(x, y, s, s)
      c.fillStyle = p.water[0]
      for (const [dx, dy] of [[4, 4], [10, 7], [5, 11]]) c.fillRect(x + dx * u, y + dy * u, 2 * u, 3 * u)
      break
    case 'X':
      c.fillStyle = p.tileDark
      c.fillRect(x, y, s, s)
      c.strokeStyle = look.cream
      c.lineWidth = u
      c.beginPath()
      c.moveTo(x + 3 * u, y + 2 * u)
      c.lineTo(x + 8 * u, y + 8 * u)
      c.lineTo(x + 6 * u, y + 14 * u)
      c.moveTo(x + 8 * u, y + 8 * u)
      c.lineTo(x + 13 * u, y + 6 * u)
      c.stroke()
      break
    case '~':
      c.fillStyle = p.water[0]
      c.fillRect(x, y, s, s)
      if (above !== '~') {
        c.fillStyle = p.water[2]
        c.fillRect(x, y, s, 2 * u)
      }
      break
    case 'S':
      c.fillStyle = p.accent
      c.fillRect(x + 2 * u, y + 13 * u, 12 * u, 3 * u)
      c.strokeStyle = look.cream
      c.lineWidth = 1.5 * u
      c.beginPath()
      c.moveTo(x + 4 * u, y + 13 * u)
      for (let i = 0; i < 3; i++) c.lineTo(x + (i % 2 ? 4 : 12) * u, y + (11 - i * 2.5) * u)
      c.stroke()
      c.fillStyle = p.accent
      c.fillRect(x + 2 * u, y + 4 * u, 12 * u, 2 * u)
      break
    case '>':
    case '<': {
      c.fillStyle = p.tileDark
      c.fillRect(x, y, s, s)
      const d = ch === '>' ? 1 : -1
      const cx = x + s / 2
      tri(c, [cx - 4 * u * d, y + 4 * u, cx + 5 * u * d, y + 8 * u, cx - 4 * u * d, y + 12 * u], look.cream)
      break
    }
    case 'F':
      c.fillStyle = look.cream
      c.fillRect(x + 3 * u, y + u, 1.5 * u, 15 * u)
      tri(c, [x + 4.5 * u, y + u, x + 14 * u, y + 4.5 * u, x + 4.5 * u, y + 8 * u], look.flag)
      break
    case 'C':
      tri(c, [x + s / 2, y + 2 * u, x + 13 * u, y + 8 * u, x + s / 2, y + 14 * u, x + 3 * u, y + 8 * u], look.gold, look.ink)
      break
    case '$':
      // pul: tırtıklı kenarlı küçük kâğıt, ortasında kırmızı damga
      c.fillStyle = look.cream
      c.fillRect(x + 3 * u, y + 2 * u, 10 * u, 12 * u)
      c.fillStyle = look.gold
      for (let i = 0; i < 4; i++) {
        c.fillRect(x + (3.5 + i * 2.6) * u, y + 1.5 * u, 1.4 * u, 1.4 * u)
        c.fillRect(x + (3.5 + i * 2.6) * u, y + 13.2 * u, 1.4 * u, 1.4 * u)
      }
      disc(c, x + 8 * u, y + 8 * u, 2.8 * u, look.flag)
      break
    case '!':
      disc(c, x + 8 * u, y + 8 * u, 6 * u, '#1f5fd0')
      disc(c, x + 8 * u, y + 8 * u, 4 * u, look.cream)
      disc(c, x + 8 * u, y + 8 * u, 2.6 * u, '#62b6ff')
      disc(c, x + 8 * u, y + 8 * u, 1.3 * u, look.ink)
      break
    case '?': {
      // tabela: direk ve tahta, üstünde soru işareti
      c.fillStyle = p.plank
      c.fillRect(x + 7 * u, y + 8 * u, 2 * u, 8 * u)
      c.fillRect(x + 2 * u, y + 2 * u, 12 * u, 7 * u)
      c.fillStyle = look.cream
      c.font = `700 ${Math.round(7 * u)}px system-ui, sans-serif`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillText('?', x + 8 * u, y + 5.8 * u)
      c.textAlign = 'start'
      break
    }
    case 'n':
      // şehir insanı: baş, gövde, konuşma noktası
      disc(c, x + 8 * u, y + 4.5 * u, 3 * u, '#e8b48a')
      c.fillStyle = p.accent
      c.fillRect(x + 4.5 * u, y + 8 * u, 7 * u, 8 * u)
      disc(c, x + 13.5 * u, y + 2.5 * u, 1.6 * u, look.cream)
      break
    case '{':
    case '}': {
      // ritim bloğu: kiremit (önce) / turkuaz (sonra), ortada vuruş karesi
      const col = ch === '{' ? '#ff9a7a' : '#5ad6c6'
      c.fillStyle = ch === '{' ? '#b8503a' : '#2a8a7e'
      c.fillRect(x, y, s, s)
      c.fillStyle = col
      c.fillRect(x + u, y + u, s - 2 * u, s - 2 * u)
      c.fillStyle = 'rgba(255,255,255,0.55)'
      c.fillRect(x + 6 * u, y + 6 * u, 4 * u, 4 * u)
      break
    }
    case 'O':
      // sema halkası: merkez ve dönen tepsi
      c.strokeStyle = '#7ad8cc'
      c.lineWidth = 1.2 * u
      c.setLineDash([2 * u, 1.5 * u])
      c.beginPath()
      c.arc(x + 8 * u, y + 8 * u, 6.5 * u, 0, Math.PI * 2)
      c.stroke()
      c.setLineDash([])
      disc(c, x + 8 * u, y + 8 * u, 1.8 * u, '#f2c14e')
      c.fillStyle = '#2f9a94'
      c.fillRect(x + 11 * u, y + 2 * u, 5 * u, 2 * u)
      break
    case 'Q':
      // boss: iri, öfkeli kaşlı gövde ve taç
      disc(c, x + 8 * u, y + 9 * u, 6.5 * u, '#d6403a')
      c.fillStyle = '#f2c14e'
      c.fillRect(x + 4 * u, y + 0.5 * u, 8 * u, 3 * u)
      disc(c, x + 5.5 * u, y + 8 * u, 1.6 * u, look.cream)
      disc(c, x + 10.5 * u, y + 8 * u, 1.6 * u, look.cream)
      break
    case 'G':
      c.fillStyle = '#4a4654'
      for (let i = 1; i < 16; i += 5) c.fillRect(x + i * u, y, 3 * u, s)
      c.fillRect(x, y + 6 * u, s, 2 * u)
      break
    case 'K':
      c.strokeStyle = look.gold
      c.lineWidth = 2 * u
      c.beginPath()
      c.arc(x + 5 * u, y + 8 * u, 3 * u, 0, Math.PI * 2)
      c.moveTo(x + 8 * u, y + 8 * u)
      c.lineTo(x + 14 * u, y + 8 * u)
      c.moveTo(x + 12 * u, y + 8 * u)
      c.lineTo(x + 12 * u, y + 11 * u)
      c.stroke()
      break
    case 'D':
      c.fillStyle = p.plank
      c.fillRect(x + u, y, 14 * u, s)
      c.strokeStyle = p.tileDark
      c.lineWidth = u
      c.strokeRect(x + 1.5 * u, y + 0.5 * u, 13 * u, s - u)
      disc(c, x + 8 * u, y + 6.5 * u, 1.8 * u, look.ink)
      c.fillStyle = look.ink
      c.fillRect(x + 7.3 * u, y + 7 * u, 1.4 * u, 4 * u)
      break
    case '*':
      c.strokeStyle = '#9fd8ff'
      c.lineWidth = 2 * u
      c.beginPath()
      c.arc(x + 8 * u, y + 8 * u, 5 * u, 0, Math.PI * 2)
      c.stroke()
      disc(c, x + 8 * u, y + 8 * u, 1.5 * u, look.cream)
      break
    case 'T':
      // nitro tüpü: kırmızı gövde, beyaz bant, turuncu alev
      c.fillStyle = '#ff9a3c'
      c.beginPath()
      c.moveTo(x + 5.5 * u, y + 4 * u)
      c.lineTo(x + 8 * u, y + 0.5 * u)
      c.lineTo(x + 10.5 * u, y + 4 * u)
      c.fill()
      c.fillStyle = '#d6403a'
      c.fillRect(x + 4.5 * u, y + 4 * u, 7 * u, 11 * u)
      c.fillStyle = look.cream
      c.fillRect(x + 4.5 * u, y + 8 * u, 7 * u, 2.5 * u)
      break
    case 'p':
      c.fillStyle = p.plank
      c.fillRect(x + u, y + u, 14 * u, 15 * u)
      c.strokeStyle = p.tileDark
      c.lineWidth = 1.2 * u
      c.strokeRect(x + 1.5 * u, y + 1.5 * u, 13 * u, 14 * u)
      c.beginPath()
      c.moveTo(x + 2 * u, y + 2 * u)
      c.lineTo(x + 14 * u, y + 15 * u)
      c.moveTo(x + 14 * u, y + 2 * u)
      c.lineTo(x + 2 * u, y + 15 * u)
      c.stroke()
      break
    case '_':
      c.fillStyle = p.tileDark
      c.fillRect(x + u, y + 13 * u, 14 * u, 3 * u)
      c.fillStyle = look.accent
      c.fillRect(x + 2.5 * u, y + 11 * u, 11 * u, 2.5 * u)
      break
    case '[':
      c.fillStyle = '#4a7bd8'
      c.fillRect(x, y, s, s)
      c.strokeStyle = look.cream
      c.lineWidth = u
      c.strokeRect(x + 1.5 * u, y + 1.5 * u, s - 3 * u, s - 3 * u)
      break
    case ']':
      c.globalAlpha = 0.45
      c.fillStyle = '#e0b030'
      c.fillRect(x, y, s, s)
      c.globalAlpha = 1
      c.setLineDash([2 * u, 2 * u])
      c.strokeStyle = '#e0b030'
      c.lineWidth = 1.2 * u
      c.strokeRect(x + u, y + u, s - 2 * u, s - 2 * u)
      c.setLineDash([])
      break
    case 'M':
    case 'N':
      c.fillStyle = p.plank
      c.fillRect(x, y, s, 5 * u)
      c.fillStyle = p.tileDark
      c.fillRect(x, y + 5 * u, s, u)
      arrows(c, x, y, u, ch === 'M' ? 'x' : 'y', look.cream)
      break
    case '|':
      c.fillStyle = look.cream
      c.globalAlpha = 0.7
      c.fillRect(x + 7 * u, y + 2 * u, 2 * u, 12 * u)
      c.fillRect(x + 5 * u, y + 2 * u, 6 * u, 1.5 * u)
      c.fillRect(x + 5 * u, y + 12.5 * u, 6 * u, 1.5 * u)
      c.globalAlpha = 1
      break
    case ':':
      c.fillStyle = look.cream
      c.globalAlpha = 0.7
      c.fillRect(x + 2 * u, y + 7 * u, 12 * u, 2 * u)
      c.fillRect(x + 2 * u, y + 5 * u, 1.5 * u, 6 * u)
      c.fillRect(x + 12.5 * u, y + 5 * u, 1.5 * u, 6 * u)
      c.globalAlpha = 1
      break
    case 'B':
      disc(c, x + 8 * u, y + 5.5 * u, 4.5 * u, look.flag)
      c.fillStyle = look.cream
      c.fillRect(x + 6 * u, y + 3 * u, 1.5 * u, 2 * u)
      c.fillRect(x + 7.6 * u, y + 10 * u, 0.8 * u, 4 * u)
      c.fillStyle = p.plank
      c.fillRect(x + 2 * u, y + 14 * u, 12 * u, 2 * u)
      break
    case 'Y':
      c.fillStyle = p.tileDark
      c.fillRect(x + 7 * u, y, 2 * u, 7 * u)
      c.fillStyle = '#b06a3a'
      c.fillRect(x + 2 * u, y + 7 * u, 12 * u, 6 * u)
      c.strokeStyle = look.ink
      c.lineWidth = u
      c.strokeRect(x + 2.5 * u, y + 7.5 * u, 11 * u, 5 * u)
      tri(c, [x + 8 * u, y + 16 * u, x + 5.5 * u, y + 13.5 * u, x + 10.5 * u, y + 13.5 * u], look.cream)
      break
    case 'e':
    case 'f':
    case 'h':
    case 'c':
    case 'u':
    case 'x':
    case 'j':
      creature(c, ch, x, y, u, look)
      break
    case 'P':
      c.fillStyle = p.accent
      c.beginPath()
      c.arc(x + 8 * u, y + 5 * u, 3.5 * u, 0, Math.PI * 2)
      c.fill()
      c.fillRect(x + 5 * u, y + 9 * u, 6 * u, 7 * u)
      c.strokeStyle = look.ink
      c.lineWidth = u
      c.strokeRect(x + 5 * u, y + 9 * u, 6 * u, 7 * u)
      break
    case 'E':
      // çıkış kapısı karonun kendisi ve üstündeki karoyu kaplar (sim.ts: exit y - T, boy 2T)
      c.fillStyle = p.plank
      c.fillRect(x + u, y - s + 2 * u, 14 * u, 2 * s - 2 * u)
      c.strokeStyle = look.gold
      c.lineWidth = 1.5 * u
      c.strokeRect(x + u, y - s + 2 * u, 14 * u, 2 * s - 2 * u)
      c.fillStyle = look.gold
      c.fillRect(x + 11 * u, y + 3 * u, 2 * u, 2 * u)
      break
    case 't':
      // ağaç: mürekkep hatlı gövde, iki tonlu tepe (ışık sol üstten)
      c.fillStyle = '#6b4a2e'
      c.fillRect(x + 7 * u, y + 9 * u, 2 * u, 7 * u)
      disc(c, x + 8 * u, y + 7 * u, 5.6 * u, '#22161f')
      disc(c, x + 8 * u, y + 7 * u, 4.8 * u, '#3f7a4a')
      disc(c, x + 7 * u, y + 5.8 * u, 2.8 * u, '#5fa35e')
      break
    case 'l':
      // fener: direk ve sıcak ışıklı cam
      c.fillStyle = '#22161f'
      c.fillRect(x + 7 * u, y + 6 * u, 2 * u, 10 * u)
      c.fillRect(x + 4.5 * u, y + 1.5 * u, 7 * u, 6 * u)
      c.fillStyle = look.gold
      c.fillRect(x + 5.5 * u, y + 2.5 * u, 5 * u, 4 * u)
      c.globalAlpha *= 0.25
      disc(c, x + 8 * u, y + 4.5 * u, 6 * u, look.gold)
      c.globalAlpha *= 4
      break
    case 'w':
      c.fillStyle = look.sign
      c.fillRect(x + 3 * u, y + 3 * u, 10 * u, 10 * u)
      c.fillStyle = look.cream
      c.fillRect(x + 7.5 * u, y + 3 * u, u, 10 * u)
      c.fillRect(x + 3 * u, y + 7.5 * u, 10 * u, u)
      break
    case 'L':
      c.fillStyle = '#c49a5a'
      c.fillRect(x + 7 * u, y, 2 * u, s)
      c.fillStyle = '#8a6434'
      for (let i = 1; i < 16; i += 4) c.fillRect(x + 7 * u, y + i * u, 2 * u, u)
      break
    case 'R':
      c.fillStyle = '#8f96a3'
      c.fillRect(x, y + 7 * u, s, 2 * u)
      c.fillStyle = '#5a5f6a'
      c.fillRect(x + 6 * u, y + 6 * u, 4 * u, 4 * u)
      break
    case 'W':
      c.fillStyle = '#3fa9b8'
      c.fillRect(x, y + 3 * u, s, s - 3 * u)
      c.fillStyle = '#a8eef2'
      c.fillRect(x, y + 3 * u, s, u)
      break
    case 'A':
      // gelgit: yarısı su, yarısı kum (yükselip alçalır)
      c.fillStyle = '#d9c48f'
      c.fillRect(x, y, s, s)
      c.fillStyle = '#3fa9b8'
      c.fillRect(x, y + 8 * u, s, s - 8 * u)
      c.fillStyle = '#a8eef2'
      c.fillRect(x, y + 8 * u, s, u)
      c.fillRect(x + 2 * u, y + 4 * u, 4 * u, u)
      c.fillRect(x + 10 * u, y + 4 * u, 4 * u, u)
      break
    case '+':
      // yüzen ada: su üstünde çimenli turba, üstünde kamış
      c.fillStyle = '#3fa9b8'
      c.fillRect(x, y + 10 * u, s, s - 10 * u)
      c.fillStyle = '#5e4a2e'
      c.fillRect(x, y + 6 * u, s, 6 * u)
      c.fillStyle = '#6aae4a'
      c.fillRect(x, y + 5 * u, s, 2 * u)
      c.fillStyle = '#5e9a3e'
      for (const dx of [3, 9, 13]) c.fillRect(x + dx * u, y + u, u, 4 * u)
      break
    case 'Z':
      // donan su: üst yarısı buz, alt yarısı su
      c.fillStyle = '#3fa9b8'
      c.fillRect(x, y, s, s)
      c.fillStyle = '#9fd4ec'
      c.fillRect(x, y, s, 8 * u)
      c.fillStyle = '#e8f8ff'
      c.fillRect(x, y, s, 2 * u)
      c.fillRect(x + 3 * u, y + 4 * u, 2 * u, 2 * u)
      break
    case 'V':
      // yükselen hava: sıcak, yarı saydam sütun ve yukarı oklar
      c.fillStyle = 'rgba(255,224,160,0.35)'
      c.fillRect(x, y, s, s)
      c.fillStyle = '#f2c14e'
      for (const dx of [4, 11]) {
        c.fillRect(x + dx * u, y + 4 * u, u, 9 * u)
        c.fillRect(x + (dx - 1) * u, y + 5 * u, 3 * u, u)
      }
      break
    case 'b':
      c.fillStyle = look.cream
      c.fillRect(x, y + 3 * u, s, u)
      for (let i = 0; i < 3; i++) tri(c, [x + (1 + i * 5) * u, y + 4 * u, x + (6 + i * 5) * u, y + 4 * u, x + (3.5 + i * 5) * u, y + 9 * u], i % 2 ? look.gold : look.flag)
      break
  }
}

/** Desenin karoları (KEEP hariç); P ve E en son, kapı üstteki karoyu da kaplar */
export function drawRows(c: CanvasRenderingContext2D, rows: string[], ox: number, oy: number, s: number, look: Look, clear: boolean) {
  const late: Array<[string, number, number]> = []
  rows.forEach((line, dy) => {
    for (let dx = 0; dx < line.length; dx++) {
      const ch = line[dx]
      if (ch === KEEP) continue
      if (ch === ' ') {
        if (!clear) continue
        c.fillStyle = look.ink
        c.globalAlpha *= 0.5
        c.fillRect(ox + dx * s, oy + dy * s, s, s)
        c.globalAlpha *= 2
        continue
      }
      if (ch === 'E' || ch === 'P') late.push([ch, dx, dy])
      else drawTile(c, ch, ox + dx * s, oy + dy * s, s, look, dy > 0 ? rows[dy - 1][dx] : ' ')
    }
  })
  for (const [ch, dx, dy] of late) drawTile(c, ch, ox + dx * s, oy + dy * s, s, look)
}

export function lookFor(city: CityKey): Look {
  const css = typeof document === 'undefined' ? null : getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => css?.getPropertyValue(name).trim() || fallback
  const p = CITY[city]
  return {
    city: p,
    gold: v('--color-gold', p.accent),
    flag: v('--color-flag', p.accent),
    cream: v('--color-cream', p.tileTop),
    ink: v('--color-ink', p.tileDark),
    sign: v('--color-sign', p.water[1]),
    accent: v('--color-accent', p.accent),
  }
}

