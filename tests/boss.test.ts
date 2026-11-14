import { describe, expect, it } from 'vitest'
import { BOSS, BOSSES, burrowHoles, makeBoss, touchBoss, updateBoss, type Boss, type BossDef, type BossHost } from '../game/boss'
import { LEVELS } from '../game/levels'
import type { Projectile } from '../game/sim'
import type { CityKey } from '../game/types'
import { fightBoss } from '../scripts/bossbot'

const DT = 1 / 120
const FLOOR = 320
const hostAt = (x: number, y: number, vx = 0): BossHost => ({ player: { x, y, w: 12, h: 14, vx, vy: 0, dead: false, dashTime: 0 }, projectiles: [], events: [] })

describe('boss kuralları', () => {
  const host = hostAt

  it('uyur; oyuncu meydana girince uyanır, işaret vermeden saldırmaz', () => {
    const b = makeBoss(BOSSES.kocaeli, 300, 320, 100, 400)
    const far = host(-200, 306)
    for (let i = 0; i < 240; i++) updateBoss(b, far, 1 / 120)
    expect(b.state).toBe('sleep')
    const h = host(120, 306)
    updateBoss(b, h, 1 / 120)
    expect(b.state).toBe('intro')
    const seen: string[] = []
    for (let i = 0; i < 120 * 6 && b.state !== 'tired'; i++) {
      updateBoss(b, h, 1 / 120)
      if (seen[seen.length - 1] !== b.state) seen.push(b.state)
    }
    expect(seen.indexOf('warn')).toBeGreaterThanOrEqual(0)
    expect(seen.indexOf('warn')).toBeLessThan(seen.indexOf('attack'))
    expect(b.state).toBe('tired')
  })

  it('saldırırken dokunmak yakar; yorgunken yandan zararsız, üstüne basış can götürür', () => {
    const b = makeBoss(BOSSES.kocaeli, 300, 320, 100, 400)
    b.state = 'attack'
    expect(touchBoss(b, host(b.x + 4, b.y + 6))).toBe('kill')
    b.state = 'tired'
    expect(touchBoss(b, host(b.x + 4, b.y + 6))).toBeNull()
    const h = host(b.x + 4, b.y - 10)
    h.player.vy = 120
    expect(touchBoss(b, h)).toBe('hit')
    expect(b.hp).toBe(BOSSES.kocaeli.hp - 1)
    expect(b.state).toBe('hurt')
  })

  it('her şehrin boss’u tanımlı: en az 3 can, her can için bir hareket sırası', () => {
    for (const l of LEVELS) {
      const d = BOSSES[l.city]
      expect(d.hp).toBeGreaterThanOrEqual(3)
      expect(d.moves.length).toBeGreaterThan(0)
      expect(d.taunt.length).toBeGreaterThan(20)
      expect(d.tauntEn.length).toBeGreaterThan(20)
    }
  })
})

/**
 * Senaryolu dövüş: oyuncu arenada sabit bir salınımla gezer (ya da `still` ile yerinde durur), boss 0,6 sn yorgun kalınca
 * basılır. Mermiler dünyadaki gibi ilerler. Her adımın özeti tek bir sayıya karılır: aynı girdi aynı izi verir.
 */
function duel(def: BossDef, opts: { secs?: number; still?: number; see?: (b: Boss, host: BossHost, t: number) => void } = {}) {
  const b = makeBoss(def, 300, FLOOR, 100, 420)
  const host = hostAt(opts.still ?? 0, FLOOR - 14)
  let hash = 0x811c9dc5
  const mix = (v: number) => {
    hash = Math.imul(hash ^ (Math.round(v * 64) | 0), 0x01000193)
  }
  let tired = 0
  for (let i = 0; i < (opts.secs ?? 90) * 120 && b.state !== 'down'; i++) {
    const t = i * DT
    if (opts.still === undefined) {
      host.player.x = 266 + 150 * Math.sin(t * 0.9)
      host.player.vx = 135 * Math.cos(t * 0.9)
    }
    updateBoss(b, host, DT)
    for (const q of host.projectiles) {
      q.x += q.vx * DT
      if (q.g !== undefined) {
        q.vy = (q.vy ?? 0) + q.g * DT
        q.y += q.vy * DT
      }
    }
    host.projectiles = host.projectiles.filter((q) => q.y < FLOOR && q.x > 60 && q.x < 480)
    tired = b.state === 'tired' ? tired + DT : 0
    if (tired > 0.6) touchBoss(b, { ...host, player: { ...host.player, x: b.x + 4, y: b.y - 10, vy: 120 } })
    for (const v of [b.x, b.y, b.state.length * 7 + b.move.length, b.hidden ? 1 : 0, b.hp]) mix(v)
    for (const q of host.projectiles) {
      mix(q.x)
      mix(q.y)
    }
    opts.see?.(b, host, t)
  }
  return { hash: hash >>> 0, state: b.state }
}

/** tek hareketli deneme boss'u: kademe davranışını yalın görmek için */
const solo = (move: BossDef['moves'][number], tier: 1 | 2 | 3): BossDef => ({ ...BOSSES.bayburt, hp: 3, moves: [move], speed: 1.1, tier })

describe('boss kademeleri', () => {
  it('kademe şehrin zorluğuna uyar: Kolay ve Orta 1, Zor 2, Çok Zor 3', () => {
    const want: Record<string, number> = { Kolay: 1, Orta: 1, Zor: 2, 'Çok Zor': 3 }
    for (const l of LEVELS) expect(BOSSES[l.city].tier, l.name).toBe(want[l.difficulty])
  })

  it('kademe 1 boss’ların davranışı değişmedi: senaryolu dövüşün izi kademelerden önceki kodla aynı', () => {
    // sayılar kademeler eklenmeden önceki game/boss.ts ile aynı senaryoda üretildi (beş hareketin hepsi geçer)
    const golden: Partial<Record<CityKey, number>> = { istanbul: 3689980124, kocaeli: 1766769506, ankara: 46508536, adana: 2948322251, izmir: 2448761843, diyarbakir: 1998513001, sanliurfa: 879600497, mardin: 3287625213 }
    for (const [city, hash] of Object.entries(golden)) {
      expect(BOSSES[city as CityKey].tier).toBe(1)
      expect(duel(BOSSES[city as CityKey]).hash, city).toBe(hash)
    }
  })

  it('rastgelelik yok: aynı girdi iki kez aynı izi verir (kademe 2 ve 3)', () => {
    for (const city of ['sinop', 'van', 'erzurum', 'amasya', 'mugla', 'bayburt'] as const) {
      const a = duel(BOSSES[city])
      expect(a.state, city).toBe('down')
      expect(duel(BOSSES[city]).hash, city).toBe(a.hash)
    }
  })

  it('işaret ve yorgunluk alt sınırların altına inmez', () => {
    for (const l of LEVELS) {
      const def = BOSSES[l.city]
      let was = ''
      let since = 0
      let chained = false
      let warns = 0
      const see = (b: Boss) => {
        if (b.state !== was) {
          if (was === 'warn') {
            warns++
            // ilk işaret herkeste en az 0,6 sn; zincirin sonraki işareti kademe 2-3'te en az 0,45 sn
            // (kademe 1'de zincir içi işaret eskisi gibi hızla kısalır: 0,3 sn'nin altına inmez)
            const min = !chained ? BOSS.warnMin : def.tier > 1 ? BOSS.chainMin : 0.3
            expect(since, `${l.name} ${b.move} işaret ${since.toFixed(3)} sn`).toBeGreaterThanOrEqual(min - 1e-6)
          }
          if (was === 'attack') chained = true
          if (b.state === 'tired' || b.state === 'hurt') chained = false
          if (b.state === 'tired' && def.tier > 1) expect(b.span, l.name).toBeGreaterThanOrEqual(BOSS.tiredMin)
          was = b.state
          since = 0
        }
        since += DT
      }
      // iki senaryo: arenada gezen oyuncu ve yerinde duran oyuncu
      for (const still of [undefined, 150]) {
        was = ''
        duel(def, { still, see })
      }
      expect(warns, l.name).toBeGreaterThan(2)
    }
  })

  it('öngörülü nişan: duran oyuncuda atış eski yere düşer, koşanda varacağı yere', () => {
    const first = (tier: 1 | 2, vx: number) => {
      const b = makeBoss(solo('throw', tier), 300, FLOOR, 100, 420)
      const host = hostAt(280, FLOOR - 14, vx)
      for (let i = 0; i < 120 * 12 && !host.projectiles.length; i++) updateBoss(b, host, DT)
      const q = host.projectiles[0]
      // yere değdiği andaki orta noktası
      return q.x + 4 + q.vx * BOSS.lobAir
    }
    expect(first(2, 0)).toBeCloseTo(first(1, 0), 6)
    expect(first(1, 0)).toBeCloseTo(286, 6)
    expect(first(1, -100)).toBeCloseTo(286, 6)
    expect(first(2, -100) - first(2, 0)).toBeCloseTo(-100 * BOSS.lobAir, 6)
    // dash hızı sayılmaz: en çok koşu hızı kadar öne nişan alır
    expect(first(2, -285)).toBeCloseTo(first(2, -100), 6)
  })

  it('kademe 3 fırlatma: dört salvo, sırayla yüksek ve alçak; koşana iki mermi, durana tek', () => {
    const salvos: number[][] = []
    let n = 0
    const see = (b: Boss, host: BossHost) => {
      if (b.hp === 3 && host.projectiles.length > n) salvos.push(host.projectiles.slice(n).map((q) => q.g ?? 0))
      n = host.projectiles.length
    }
    duel(solo('throw', 3), { secs: 12, still: 150, see })
    expect(salvos).toEqual([[BOSS.lobG], [BOSS.lowG], [BOSS.lobG], [BOSS.lowG]])
    const b = makeBoss(solo('throw', 3), 300, FLOOR, 100, 420)
    const host = hostAt(280, FLOOR - 14, -100)
    for (let i = 0; i < 120 * 12 && !host.projectiles.length; i++) updateBoss(b, host, DT)
    expect(host.projectiles.length).toBe(2)
  })

  it('kademe 3 toslama duvardan seker: iki çarpış, arada işaret, sonra yorulur; kademe 2 tek çarpışta yorulur', () => {
    const run = (tier: 2 | 3) => {
      const seen: string[] = []
      const b = makeBoss(solo('charge', tier), 300, FLOOR, 100, 420)
      const host = hostAt(120, FLOOR - 60)
      for (let i = 0; i < 120 * 10 && b.state !== 'tired'; i++) {
        updateBoss(b, host, DT)
        if (seen[seen.length - 1] !== b.state) seen.push(b.state)
      }
      return { seen: seen.join(' '), slams: host.events.filter((e) => e.type === 'bossSlam').length }
    }
    expect(run(2)).toEqual({ seen: 'intro move warn attack tired', slams: 1 })
    expect(run(3)).toEqual({ seen: 'intro move warn attack warn attack tired', slams: 2 })
  })

  it('kademe 3 sıçrama: dört iniş, her inişte iki yana kısa ömürlü şok dalgası', () => {
    const born = new Map<Projectile, number>()
    let longest = 0
    let landings = 0
    let was = ''
    const see = (b: Boss, host: BossHost, t: number) => {
      if (b.hp < 3) return
      if (was === 'attack' && b.state !== 'attack') landings++
      was = b.state
      for (const q of host.projectiles) {
        if (!born.has(q)) {
          born.set(q, t)
          expect(q.g).toBe(BOSS.waveG)
          expect(q.y + q.h).toBeGreaterThan(FLOOR - 4)
        }
        // dünyada mermi, ortası yere girince söner
        if (q.y + q.h / 2 < FLOOR) longest = Math.max(longest, t - born.get(q)!)
      }
    }
    duel(solo('hop', 3), { secs: 9, see })
    expect(landings).toBe(4)
    expect(born.size).toBe(8)
    // bir sonraki inişten (işaret 0,5 sn + havada 0,95 sn) çok önce söner: aynı anda hem dalgadan atlayıp hem inişten kaçmak gerekmez
    expect(longest).toBeLessThan(0.7)
  })

  it('kademe 3 dalış: iki kez dalar (ikincisinden önce yine işaret), sonra yorulur', () => {
    const seen: string[] = []
    duel(solo('dive', 3), { secs: 9, still: 150, see: (b) => void (b.hp === 3 && seen[seen.length - 1] !== b.state && seen.push(b.state)) })
    expect(seen.join(' ')).toBe('intro move warn attack move warn attack tired')
  })

  it('kademe 2 dalış işaret sırasında oyuncuya hafifçe kayar, dalarken yeri sabittir; kademe 1 kaymaz', () => {
    const drift = (tier: 1 | 2) => {
      const b = makeBoss(solo('dive', tier), 300, FLOOR, 100, 420)
      const host = hostAt(150, FLOOR - 14)
      let x0 = NaN
      let x1 = NaN
      for (let i = 0; i < 120 * 12 && b.state !== 'tired'; i++) {
        const before = b.state
        updateBoss(b, host, DT)
        if (before !== 'warn' && b.state === 'warn') {
          x0 = b.x
          host.player.x += 120
        }
        if (before === 'warn' && b.state === 'attack') x1 = b.x
        if (b.state === 'attack') expect(b.x).toBe(x1)
      }
      return x1 - x0
    }
    expect(drift(1)).toBe(0)
    expect(drift(2)).toBeGreaterThan(8)
    expect(drift(2)).toBeLessThan(30)
  })

  it('yerden çıkma: kademe 2 iki yana savurur; kademe 3 önce sahte kabarır, başka delikten çıkar', () => {
    const run = (tier: 1 | 2 | 3) => {
      const b = makeBoss(solo('burrow', tier), 300, FLOOR, 100, 420)
      const host = hostAt(150, FLOOR - 14)
      const mounds: number[] = []
      let warn = 0
      for (let i = 0; i < 120 * 10 && b.state !== 'attack'; i++) {
        updateBoss(b, host, DT)
        if (b.state === 'warn') {
          warn += DT
          if (mounds[mounds.length - 1] !== b.x) mounds.push(b.x)
        }
      }
      expect(b.hidden).toBe(false)
      for (const m of mounds) expect(burrowHoles(b)).toContain(m)
      return { mounds: mounds.length, out: b.x === mounds[mounds.length - 1], flings: host.projectiles.length, warn }
    }
    expect(run(1)).toMatchObject({ mounds: 1, out: true, flings: 1 })
    expect(run(2)).toMatchObject({ mounds: 1, out: true, flings: 2 })
    const three = run(3)
    expect(three).toMatchObject({ mounds: 2, out: true, flings: 2 })
    // sahte kabarma da gerçek işaret de kendi alt sınırını tutar
    expect(three.warn).toBeGreaterThanOrEqual(BOSS.warnMin * 2)
  })

  it('son can öfkesi (kademe 2-3): hamleler arası bekleme kısalır, işaret kısalmaz', () => {
    const phases = (hp: number) => {
      const b = makeBoss(solo('charge', 2), 300, FLOOR, 100, 420)
      const host = hostAt(120, FLOOR - 60)
      const secs: Record<string, number> = {}
      for (let i = 0; i < 120 * 10 && b.state !== 'attack'; i++) {
        // can, uyanış bittikten sonra düşürülür: hareket sırası aynı kalsın diye yalnız bekleme ölçülür
        if (b.state === 'move') b.hp = hp
        updateBoss(b, host, DT)
        secs[b.state] = (secs[b.state] ?? 0) + DT
      }
      return secs
    }
    const calm = phases(3)
    const rage = phases(1)
    expect(rage.move).toBeLessThan(calm.move * 0.85)
    expect(rage.warn).toBeCloseTo(calm.warn, 2)
    expect(rage.warn).toBeGreaterThanOrEqual(BOSS.warnMin)
  })
})

describe('boss’lar yenilebilir (bot gerçek fizikle dövüşür)', () => {
  it.each(LEVELS.map((l) => [l.name, l]))('%s: bot da zayıf oyuncu botu da yener', (_n, l) => {
    const r = fightBoss(l)
    expect(r.won, `kalan can ${r.hpLeft}`).toBe(true)
    expect(r.deaths).toBeLessThanOrEqual(2)
    const weak = fightBoss(l, { weak: true })
    expect(weak.won, `zayıf oyuncu: kalan can ${weak.hpLeft}`).toBe(true)
  }, 60_000)

  // insan payı: bot yalnız gösterilmiş işaretin sonucunu öngörür ve bir dilim geç tepki verir (scripts/bossbot.ts)
  it.each(LEVELS.map((l) => [l.name, l]))('%s: yalnız işarete tepki veren bot da (tam ve zayıf) yener', (_n, l) => {
    const r = fightBoss(l, { sight: 'telegraph', limit: 240 })
    expect(r.won, `kalan can ${r.hpLeft}`).toBe(true)
    const weak = fightBoss(l, { sight: 'telegraph', weak: true, limit: 240 })
    expect(weak.won, `zayıf oyuncu: kalan can ${weak.hpLeft}`).toBe(true)
    // Kolay ve Orta şehirlerde boss her yaştan oyuncu içindir: işarete tepki veren oyuncu en çok iki kez düşer
    if (BOSSES[l.city].tier === 1) expect(Math.max(r.deaths, weak.deaths)).toBeLessThanOrEqual(2)
  }, 120_000)
})
