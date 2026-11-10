/**
 * Düşman denetimi: düşmanlar ve ok tuzakları AÇIKKEN her bölüm baştan çıkışa adil oynanabiliyor mu?
 * (verify-levels düşmansız çözer; boss'u bossbot kanıtlar: burada boss yok, meydan kapısı açık sayılır.)
 *
 * Yöntem: çözücünün düşmansız bulduğu yol (solve trace) bir kez oynatılıp iz olarak kaydedilir. Bot gerçek dünyada
 * yere her bastığında çözücünün bütün makrolarını düşmanlarla birlikte ileri oynatır, izde en ileriye götüren ve
 * sağ bırakanı seçer; hiçbiri güvenli değilse bekler ya da geri çekilir.
 * İnsan payı: her hamle 0–0,12 sn geç başlar (tohumlu rastgele); bot bir hamleyi ancak 0 / 0,06 / 0,12 sn gecikmenin
 * üçünde de sağ kalıyorsa seçer, yani 120 ms'den dar zamanlama penceresine girmez. Uzun süre pencere bulamazsa
 * önce 60 ms'ye, sonra tam zamanlamaya razı olur; bunlar "dar pencere" diye sayılır.
 * İki tur: tam oyuncu ve zayıf oyuncu (audit-difficulty'deki gibi: zıplama %5 alçak, koşu %8 yavaş).
 *
 * Ölçüt: bölüm biter · bayraklar arası bir parçada en çok MAX_SEG ölüm · aynı yerde en çok MAX_SPOT ölüm.
 * Kullanım: npx tsx scripts/verify-enemies.ts [şehir] [--ayrinti] [--dusmansiz]
 *   --ayrinti: her koşunun ölümleri, dar pencereleri · --dusmansiz: karşılaştırma koşusu (düşman ve ok yok)
 *   TOHUM=3 tek tohumla koşar · YOL_ONBELLEK=0 çözücü yolunu yeniden arar (yoksa $OUT/yol altında saklanır)
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LEVELS } from '../game/levels'
import { PHYS, SPIKE_DOWN, SPIKE_UP, WATER, World, hammerState, restore, snapshot, type Enemy, type Snapshot } from '../game/sim'
import { T, emptyInput, type LevelDef } from '../game/types'
import { holdPlates, macros, runMacro, solve, type Macro } from './solver'

const DT = 1 / 120
/** hamle başına en çok gecikme (sn): insanın tuşa geç basma payı */
const LATE = 0.12
/** bir parçada (iki doğuş noktası arası) kabul edilen en çok ölüm: tam / zayıf oyuncu */
const MAX_SEG = { full: 3, weak: 5 }
/** aynı yerde (3 karo içinde) kabul edilen en çok ölüm */
const MAX_SPOT = 3
/** sabır (sn, ilerlemeden geçen süre): 120 ms pencere beklenir → 60 ms'ye razı olur → tam zamanlamaya razı olur; sonuncusundan sonra yol yeniden aranır.
 * Düşman devriyesi bir uçtan öbürüne 6–7 sn sürer: bot da bir insan gibi o kadar bekleyebilmeli. */
const PATIENCE = [7, 10, 13]
/** çevre durgunsa sabır bu oranda kısalır: beklenecek bir şey yoktur */
const STILL = 0.15
/** her tur bu tohumlarla ayrı ayrı oynanır (gecikmeler değişir) */
const SEEDS = [7, 19, 31]
/** bir parçada bu kadar ölümden sonra bot bırakır */
const GIVE_UP = 9

/** çözücünün makroları + kısa bekleme: ok gibi dar aralıklı tehlikede karar anları 0,5 sn'den sık olmalı */
const MACROS: Macro[] = [...macros('all'), { dir: 0, hold: 0, jump: 0, jump2: 0, dashAt: 0, dashDir: [0, 0], wait: 0.2 }]
/** kaçış denemesi: hamleden sonra en az biriyle sağ kalınabilmeli (varılan yer tuzak olmasın) */
const ESCAPES = MACROS.filter((m) => m.wait > 0 || (m.wait === 0 && m.dashAt === 0 && m.jump2 === 0 && !m.repeat && (m.jump === 0 ? m.hold > 0 && m.hold <= 0.35 : m.jump === 0.14)))

/** karşılaştırma koşusu: aynı bot, düşmansız ve oksuz. Burada da görülen dar pencere ya da ölüm düşmandan değil zeminden gelir. */
const BASELINE = process.argv.includes('--dusmansiz')
const WAIT = MACROS.find((m) => m.wait === 0.5)!
/** çıkışa kadar yeniden aranan yoldan harfiyen oynanan en çok makro (ize kavuşan kısa yol baştan sona oynanır) */
const EXACT = 8

const KIND: Record<Enemy['kind'], string> = { ground: 'yürüyen', fly: 'uçan', hopper: 'zıplayan', charger: 'koşan', bat: 'yarasa', spiky: 'dikenli', magpie: 'saksağan' }

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/* ── Düşmanları da kapsayan anlık görüntü (sim'in görüntüsü düşman, ok tuzağı ve plaka durumunu saklamaz) ── */
interface Full {
  s: Snapshot
  enemies: Enemy[]
  turrets: number[]
  plates: boolean[]
}
const save = (w: World): Full => ({ s: snapshot(w), enemies: w.enemies.map((e) => ({ ...e })), turrets: w.turrets.map((t) => t.timer), plates: w.plates.map((p) => p.pressed) })
function load(w: World, f: Full) {
  restore(w, f.s)
  f.enemies.forEach((e, i) => Object.assign(w.enemies[i], e))
  f.turrets.forEach((t, i) => (w.turrets[i].timer = t))
  f.plates.forEach((p, i) => (w.plates[i].pressed = p))
}

/* ── İz: çözücü yolunun sık örneklenmiş hali ── */
interface Sample {
  x: number
  y: number
  grounded: boolean
  /** hareketli platformdaysa numarası ve platforma göre konumu */
  plat: number
  rel: number
  switchOn: boolean
  hasKey: boolean
}

function bare(level: LevelDef): World {
  const w = new World(level)
  w.enemies.length = 0
  w.turrets.length = 0
  w.boss = null
  return w
}

interface Plan {
  samples: Sample[]
  /** çözücünün makroları ve her birinin başladığı örnek */
  path: Macro[]
  marks: number[]
}

/** Yolu düşmansız dünyada çözücünün yaptığı gibi (makro aralarında restore ile) oynatır; çıkışa (ya da `until` koşuluna) varmazsa null. */
function trace(level: LevelDef, path: Macro[], start?: Snapshot, until?: (w: World) => boolean): Plan | null {
  const w = bare(level)
  if (start) restore(w, start)
  const out: Sample[] = []
  let n = 0
  const take = () => {
    const p = w.player
    const plat = p.onPlatform ? w.platforms.indexOf(p.onPlatform) : -1
    out.push({ x: p.x, y: p.y, grounded: p.grounded, plat, rel: plat >= 0 ? p.x - w.platforms[plat].x : 0, switchOn: w.switchOn, hasKey: w.hasKey })
  }
  take()
  const marks: number[] = []
  for (const m of path) {
    marks.push(out.length - 1)
    restore(w, snapshot(w))
    holdPlates(w)
    const deaths = w.deaths
    runMacro(w, m, () => {
      w.events.length = 0
      if (++n % 6 === 0) take()
    })
    if (w.deaths > deaths) return null
    take()
  }
  return (until ? path.length > 0 && until(w) : w.complete) ? { samples: out, path, marks } : null
}

/** Çözücüden yol ister ve iz çıkarır. rejoin: çıkışa değil, eldeki ize yeniden kavuşulan ilk yere kadar (kısa ve ucuz arama). */
function plan(level: LevelDef, tag: string, start?: Snapshot, rejoin?: { x: number; y: number; reached: (w: World) => boolean }): Plan | null {
  const dir = join(process.env.OUT ?? join(tmpdir(), 'seksek-verify'), 'yol')
  const hash = createHash('sha1').update(JSON.stringify([2, level.map, PHYS, macros('all'), start ?? null, rejoin ? [rejoin.x, rejoin.y] : null])).digest('hex').slice(0, 16)
  const file = join(dir, `${level.id}-${tag}-${hash}.json`)
  const cache = process.env.YOL_ONBELLEK !== '0'
  if (cache && existsSync(file)) {
    // yol bulunamadığı da saklanır (null): aynı haritada pahalı arama yinelenmesin
    const saved = JSON.parse(readFileSync(file, 'utf8')) as Macro[] | null
    const got = saved && trace(level, saved, start, rejoin?.reached)
    if (got || !saved) return got
  }
  const r = solve(level, { exitOnly: true, budget: rejoin ? 400 : 12000, trace: true, start, goal: rejoin })
  const found = r.won && (!rejoin || r.path.length > 0)
  if (cache) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(file, JSON.stringify(found ? r.path : null))
  }
  return found ? trace(level, r.path, start, rejoin?.reached) : null
}

/** İzde [from, to] aralığında dünyanın şimdiki durumuna uyan en ileri örnek (yoksa -1). ground: yalnız yere basılan örnekler · path: + havadan geçilen yerin altı · loose: kabaca yakın */
function matchOf(samples: Sample[], w: World, from: number, to: number, mode: 'ground' | 'path' | 'loose'): number {
  const p = w.player
  const plat = p.onPlatform ? w.platforms.indexOf(p.onPlatform) : -1
  for (let k = Math.min(samples.length - 1, to); k >= Math.max(0, from); k--) {
    const s = samples[k]
    if (s.switchOn !== w.switchOn || s.hasKey !== w.hasKey) continue
    if (mode === 'loose') {
      if (Math.abs(s.x - p.x) < 20 && Math.abs(s.y - p.y) < 20) return k
    } else if (s.grounded) {
      if (plat >= 0 ? s.plat === plat && Math.abs(s.rel - (p.x - w.platforms[plat].x)) < 10 : s.plat < 0 && Math.abs(s.x - p.x) < 10 && Math.abs(s.y - p.y) < 4) return k
    } else if (mode === 'path' && plat < 0 && Math.abs(s.x - p.x) < 8 && p.y >= s.y && p.y - s.y <= 64) {
      // çözücü buradan havada geçmiş (uzun atlayış, dash): hemen altındaki zeminde yürümek de aynı yolu izlemektir
      return k
    }
  }
  return -1
}

/* ── Bot ── */
interface Death {
  tx: number
  ty: number
  why: string
  seg: number
  /** ölümle biten hamle seçilirken aranan zamanlama penceresi (ms) */
  window: number
}

function cause(w: World): string {
  const p = w.player
  const box = { x: p.x + 1, y: p.y + 1, w: p.w - 2, h: p.h - 2 }
  const hit = (b: { x: number; y: number; w: number; h: number }) => box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y
  for (const e of w.enemies) if (e.alive && hit(e)) return KIND[e.kind]
  for (const q of w.projectiles) if (hit(q)) return 'ok'
  for (const h of w.hammers) if (hit({ x: h.x, y: hammerState(h, w.clock).y, w: T, h: T })) return 'tokmak'
  if (p.y > w.rows * T - 4) return 'boşluk'
  for (let ty = Math.floor(p.y / T); ty <= Math.floor((p.y + p.h) / T); ty++)
    for (let tx = Math.floor(p.x / T); tx <= Math.floor((p.x + p.w) / T); tx++) {
      const t = w.tile(tx, ty)
      if (t === SPIKE_UP || t === SPIKE_DOWN) return 'diken'
      if (t === WATER) return 'su'
    }
  return 'düşme'
}

/** Hamle: önce `late` sn makronun yönünü tutar (geç basış), sonra makroyu oynatır. Havada biterse yere inene dek bekler. */
function act(w: World, m: Macro, late: number, settle: boolean, each: () => void) {
  const deaths = w.deaths
  if (m.wait === 0)
    for (let i = Math.round(late / DT); i > 0 && w.deaths === deaths && !w.complete; i--) {
      const inp = emptyInput()
      inp.left = m.dir < 0
      inp.right = m.dir > 0
      w.step(DT, inp)
      each()
    }
  if (w.deaths === deaths && !w.complete) runMacro(w, m, each)
  if (settle)
    for (let i = 0; i < 480 && w.deaths === deaths && !w.complete && !w.player.grounded; i++) {
      w.step(DT, emptyInput())
      each()
    }
}

interface RunResult {
  done: boolean
  segs: number
  segTotal: number
  deaths: Death[]
  /** 120 ms'lik pencere bulunamayıp daha dar zamanlamayla geçilen yerler */
  tight: Array<{ tx: number; ty: number }>
  /** takılıp yeniden aranan yoldan harfiyen oynanan hamle sayısı */
  exact: number
  stuck: string
  seconds: number
  replans: number
}

function play(level: LevelDef, tag: 'full' | 'weak', seed: number, log: (s: string) => void): RunResult {
  const res: RunResult = { done: false, segs: 0, segTotal: 0, deaths: [], tight: [], exact: 0, stuck: '', seconds: 0, replans: 0 }
  const first = plan(level, tag)
  const w = new World(level)
  w.boss = null
  if (BASELINE) {
    w.enemies.length = 0
    w.turrets.length = 0
  }
  res.segTotal = w.checkpoints.length + (w.warp ? 1 : 0) + 1
  if (!first) {
    res.stuck = 'çözücü yol bulamadı'
    return res
  }
  let samples = first.samples
  /** takılınca: yeniden aranan yolun ilk makroları, bulunduğu durumdan harfiyen (gecikmesiz) oynanır */
  let exact = null as { plan: Plan; i: number; waits: number; rejoin: boolean } | null
  const rand = rng(seed)
  const p = w.player
  let cur = 0
  const quiet = () => {
    w.events.length = 0
  }
  const progress = () => (w.complete ? samples.length + 50 : matchOf(samples, w, cur - 60, cur + 90, 'path'))
  const clearance = () => {
    let d = 24
    const far = (b: { x: number; y: number; w: number; h: number }) => Math.max(0, Math.max(b.x - (p.x + p.w), p.x - (b.x + b.w)), Math.max(b.y - (p.y + p.h), p.y - (b.y + b.h)))
    for (const e of w.enemies) if (e.alive) d = Math.min(d, far(e))
    for (const q of w.projectiles) d = Math.min(d, far(q))
    return d
  }

  /** çevrede kıpırdayan bir şey yok (düşman, ok, platform, tokmak, çöken taş): beklemek bir şeyi değiştirmez */
  const still = () => {
    const near = (x: number) => Math.abs(x - p.x) < 240
    return w.crumbles.size === 0 && !w.enemies.some((e) => e.alive && near(e.x)) && !w.projectiles.some((q) => near(q.x)) && !w.turrets.some((t) => near(t.tx * T)) && !w.platforms.some((pl) => near(pl.x)) && !w.hammers.some((h) => near(h.x))
  }

  let seg = 0
  let segDeaths = 0
  let spawn = { ...w.spawn }
  /** izde son kez ilerlenen an (adım): sabır buradan sayılır */
  let since = 0
  /** bu canla izde varılan en ileri örnek */
  let reach = 0
  let segReplans = 0
  let steps = 0
  const real = () => {
    w.events.length = 0
    steps++
  }
  const replan = (): boolean => {
    res.replans++
    segReplans++
    since = steps
    // önce kısa arama: izde şimdiki yerden sonra yere basılan ilk örneğe kavuşan yol (çıkışa kadar yeniden aramak pahalı)
    const from = samples.findIndex((s, k) => k > cur + 4 && s.grounded && s.switchOn === w.switchOn && s.hasKey === w.hasKey && Math.hypot(s.x - p.x, s.y - p.y) > 24)
    const local = from < 0 ? null : plan(level, tag, snapshot(w), { x: samples[from].x, y: samples[from].y, reached: (x) => matchOf(samples, x, from, from + 600, 'ground') >= 0 })
    if (local) {
      exact = { plan: local, i: 0, waits: 0, rejoin: true }
      return true
    }
    const again = plan(level, tag, snapshot(w))
    if (!again) return false
    samples = again.samples
    exact = { plan: again, i: 0, waits: 0, rejoin: false }
    cur = 0
    reach = 0
    return true
  }

  /** bu parçada ölüme götüren hamleler (yer + makro): insan aynı hatayı aynı yerde yinelemez */
  const banned = new Set<string>()
  const ban = (m: Macro) => `${Math.round(p.x / 8)},${Math.round(p.y / 8)},${MACROS.indexOf(m)}`
  let lastBan = ''
  const passed = () => {
    banned.clear()
    spawn = { ...w.spawn }
    seg++
    segDeaths = 0
    segReplans = 0
    log(`  parça ${seg} geçildi @${Math.floor(p.x / T)},${Math.floor(p.y / T)} · ${(steps * DT).toFixed(0)} sn`)
  }

  while (!w.complete) {
    if (steps * DT > 1500) {
      res.stuck = 'süre doldu'
      break
    }
    const f0 = save(w)
    const d0 = w.deaths
    if (exact) {
      const m = exact.plan.path[exact.i]
      act(w, m, 0, false, quiet)
      const fine = w.deaths === d0
      load(w, f0)
      if (fine) {
        res.exact++
        act(w, m, 0, true, real)
        exact.i++
        exact.waits = 0
        since = steps
        if (exact.rejoin) {
          // kısa yol bitince asıl ize dönülür
          if (exact.i >= exact.plan.path.length) {
            const k = matchOf(samples, w, cur, cur + 640, 'path')
            if (k >= 0) cur = reach = k
            exact = null
          }
        } else {
          cur = reach = exact.plan.marks[exact.i] ?? cur
          if (exact.i >= Math.min(EXACT, exact.plan.path.length)) exact = null
        }
        if (w.spawn.x !== spawn.x || w.spawn.y !== spawn.y) passed()
        continue
      }
      // düşman yolda: biraz bekleyip yeniden dener, olmuyorsa olağan oynayışa döner
      if (++exact.waits > 6) exact = null
      else {
        act(w, WAIT, 0, true, real)
        if (w.deaths === d0) continue
        load(w, f0)
        exact = null
      }
    }
    // sabır azaldıkça zamanlama penceresi daralır: 120 ms → 60 ms → tam
    const idle = ((steps - since) * DT) / (still() ? STILL : 1)
    const lates = idle < PATIENCE[0] ? [0, LATE] : idle < PATIENCE[1] ? [0] : []
    const top = lates.length === 2 ? LATE : lates.length === 1 ? LATE / 2 : 0
    // 1. her makroyu ortalama gecikmeyle dene
    const cands: Array<{ m: Macro; score: number; k: number }> = []
    for (const m of MACROS) {
      load(w, f0)
      let n = 0
      let near = 24
      act(w, m, top / 2, false, () => {
        w.events.length = 0
        if (++n % 6 === 0) near = Math.min(near, clearance())
      })
      if (w.deaths > d0 || (!w.complete && !p.grounded)) continue
      const k = progress()
      const gain = k - cur
      let score: number
      // dash ve duvar sekmesi ancak belirgin kazanç sağlıyorsa: bot önce yürüyüp zıplayarak dener
      const fancy = (m.dashAt > 0 ? 8 : 0) + (m.jump2 > 0 || m.repeat ? 5 : 0)
      if (k >= 0 && gain > 0) score = 1000 + gain - fancy + Math.min(near, clearance()) * 0.5
      else if (m.wait > 0) score = -m.wait
      else if (k >= 0) score = -5 + gain * 0.1
      else score = -50
      cands.push({ m, score, k })
    }
    // 1b. doğrudan ilerleten hamle yoksa: yerini düzelten kısa bir yürüyüşün ardından ilerlenebiliyor mu (iki adım)
    if (!cands.some((c) => c.score > 0))
      for (const c of cands) {
        if (c.m.wait > 0 || c.m.jump > 0 || c.m.dashAt > 0) continue
        load(w, f0)
        act(w, c.m, top / 2, false, quiet)
        const f1 = save(w)
        let best = 0
        for (const m of MACROS) {
          if (m.wait > 0) continue
          load(w, f1)
          act(w, m, top / 2, false, quiet)
          if (w.deaths === d0 && (w.complete || p.grounded)) best = Math.max(best, progress() - cur)
        }
        if (best > 0) c.score = 500 + best
      }
    cands.sort((a, b) => b.score - a.score)
    // 2. en iyiden başlayarak sağlamlık (geç/erken basış) ve kaçış payını doğrula
    let pick: { m: Macro; score: number; k: number } | null = null
    for (const c of cands.slice(0, 40)) {
      if (banned.has(ban(c.m))) continue
      // geç, erken ve ortalama basışın üçünde de: sağ kalmalı, ilerletmeli ve varılan yerden bir kaçış olmalı
      const ok = (c.m.wait > 0 ? [0] : [...lates, top / 2]).every((late) => {
        load(w, f0)
        act(w, c.m, late, false, quiet)
        if (w.complete) return true
        if (w.deaths > d0 || !p.grounded || (c.score >= 1000 && progress() <= cur)) return false
        const f1 = save(w)
        // kaçış da geç basışa dayanmalı: "son anda zıplarım" diye beklenmez
        return ESCAPES.some((e) =>
          (e.wait > 0 ? [0] : [0, LATE]).every((l) => {
            load(w, f1)
            act(w, e, l, false, quiet)
            return w.deaths === d0
          }),
        )
      })
      if (ok) {
        pick = c
        break
      }
    }
    pick ??= cands.find((c) => !banned.has(ban(c.m))) ?? cands[0] ?? null
    load(w, f0)
    const prevBan = lastBan
    lastBan = pick ? ban(pick.m) : ''
    if (!pick) {
      // hiçbir hamle sağ bırakmıyor: olduğu yerde bekler (ölür ve sayılır)
      act(w, WAIT, 0, true, real)
    } else {
      const late = pick.m.wait > 0 ? 0 : rand() * top
      if (pick.score >= 1000 && lates.length < 2) res.tight.push({ tx: Math.floor(p.x / T), ty: Math.floor(p.y / T) })
      if (process.env.DEBUG) console.log(`    @${(p.x / T).toFixed(1)},${(p.y / T).toFixed(1)} cur ${cur} sab ${idle.toFixed(1)} → ${JSON.stringify(pick.m)} skor ${pick.score.toFixed(1)} k ${pick.k} geç ${late.toFixed(2)}`)
      act(w, pick.m, late, true, real)
    }

    if (w.deaths > d0) {
      const d: Death = { tx: Math.floor((p.x + p.w / 2) / T), ty: Math.floor((p.y + p.h / 2) / T), why: cause(w), seg, window: Math.round(top * 1000) }
      res.deaths.push(d)
      // ölüme götüren hamle ve bir önceki (çoğu kez asıl hata odur) bu parçada bir daha seçilmez
      banned.add(lastBan).add(prevBan)
      segDeaths++
      log(`  ölüm: parça ${seg + 1} @${d.tx},${d.ty} ${d.why} (pencere ${d.window} ms)`)
      if (process.env.DEBUG) console.log(`    ÖLÜM @${d.tx},${d.ty} ${d.why}`)
      while (p.dead) {
        w.step(DT, emptyInput())
        real()
      }
      if (segDeaths >= GIVE_UP) {
        res.stuck = `parça ${seg + 1}: ${segDeaths} ölüm`
        break
      }
      since = steps
      exact = null
      const k = matchOf(samples, w, 0, cur + 90, 'path')
      const k2 = k >= 0 ? k : matchOf(samples, w, 0, cur + 90, 'loose')
      if (k2 >= 0) cur = reach = k2
      else if (!replan()) {
        res.stuck = `parça ${seg + 1}: doğuş noktasından yol yok`
        break
      }
      continue
    }
    if (w.spawn.x !== spawn.x || w.spawn.y !== spawn.y) passed()
    if (w.complete) break
    const k = progress()
    if (k >= 0) cur = k
    // sabır yalnız gerçekten yeni bir yere varınca sıfırlanır: ileri geri dönüp durmak ilerleme değildir
    if (k > reach) {
      reach = k
      since = steps
    } else if ((steps - since) * DT >= PATIENCE[2] * (still() ? STILL : 1)) {
      if (segReplans >= 3 || !replan()) {
        res.stuck = `parça ${seg + 1}: takıldı @${Math.floor(p.x / T)},${Math.floor(p.y / T)}`
        break
      }
      log(`  yeniden yol arandı @${Math.floor(p.x / T)},${Math.floor(p.y / T)}`)
    }
  }
  res.done = w.complete
  res.segs = w.complete ? seg + 1 : seg
  if (w.complete) res.segTotal = seg + 1
  res.seconds = steps * DT
  return res
}

/** aynı yerde tekrar eden ölümler: 3 karo içindekiler bir öbek */
function hotspot(deaths: Death[]): { tx: number; ty: number; why: string; n: number } | null {
  let best: { tx: number; ty: number; why: string; n: number } | null = null
  for (const d of deaths) {
    const near = deaths.filter((o) => o.seg === d.seg && Math.abs(o.tx - d.tx) <= 3 && Math.abs(o.ty - d.ty) <= 3)
    if (!best || near.length > best.n) {
      const whys = new Map<string, number>()
      for (const o of near) whys.set(o.why, (whys.get(o.why) ?? 0) + 1)
      best = { tx: d.tx, ty: d.ty, n: near.length, why: [...whys].sort((a, b) => b[1] - a[1])[0][0] }
    }
  }
  return best
}

const phys = PHYS as unknown as Record<string, number>
const base = { ...phys }
const only = process.argv.slice(2).find((a) => !a.startsWith('--'))
const detail = process.argv.includes('--ayrinti')
const seeds = process.env.TOHUM ? [Number(process.env.TOHUM)] : SEEDS
let failed = false
for (const level of LEVELS.filter((l) => !only || l.id === only)) {
  const t0 = Date.now()
  const parts: string[] = []
  let ok = true
  for (const tag of ['full', 'weak'] as const) {
    if (tag === 'weak') Object.assign(phys, { jumpV: base.jumpV * 0.95, wallJumpVY: base.wallJumpVY * 0.95, run: base.run * 0.92, dashSpeed: base.dashSpeed * 0.92 })
    // her tohum ayrı bir koşu: ölçüt en kötü koşuya uygulanır
    let segs = Infinity
    let segTotal = 0
    let deaths = 0
    let worstSeg = 0
    let tight = 0
    let exact = 0
    let hot: ReturnType<typeof hotspot> = null
    const stuck: string[] = []
    for (const seed of seeds) {
      const lines: string[] = []
      const r = play(level, tag, seed, (s) => lines.push(s))
      const perSeg = new Map<number, number>()
      for (const d of r.deaths) perSeg.set(d.seg, (perSeg.get(d.seg) ?? 0) + 1)
      worstSeg = Math.max(worstSeg, ...perSeg.values())
      const h = hotspot(r.deaths)
      if (h && (!hot || h.n > hot.n)) hot = h
      if (r.segs < segs) [segs, segTotal] = [r.segs, r.segTotal]
      deaths += r.deaths.length
      tight += r.tight.length
      exact += r.exact
      if (r.stuck) stuck.push(r.stuck)
      if (detail) {
        console.log(`${level.name} · ${tag} · tohum ${seed} · ${r.seconds.toFixed(0)} sn oyun · yeniden yol ${r.replans}`)
        for (const l of lines) console.log(l)
        for (const t of r.tight) console.log(`  dar pencere @${t.tx},${t.ty}`)
      }
    }
    Object.assign(phys, base)
    const pass = stuck.length === 0 && worstSeg <= MAX_SEG[tag] && (hot?.n ?? 0) <= MAX_SPOT
    if (!pass) ok = false
    parts.push(
      `${tag === 'full' ? 'tam' : 'zayıf'}: parça ${segs}/${segTotal} · ölüm ${deaths}` +
        (deaths ? ` (bir parçada en çok ${worstSeg})` : '') +
        (hot ? ` · en zor: ${hot.tx},${hot.ty} ${hot.why} ×${hot.n}` : '') +
        (tight ? ` · dar pencere ${tight}` : '') +
        (exact ? ` · harfiyen ${exact}` : '') +
        (stuck.length ? ` · ${stuck[0]}` : '') +
        (pass ? '' : ' ✗'),
    )
  }
  if (!ok) failed = true
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${level.name.padEnd(10)} ${BASELINE ? '(düşmansız) ' : ''}${parts.join('  |  ')} · ${seeds.length} koşu · ${Date.now() - t0} ms`)
}
process.exit(failed ? 1 : 0)
