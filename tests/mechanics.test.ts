import { describe, expect, it } from 'vitest'
import { LEVELS, bossLevel } from '../game/levels'
import { AIR, NITRO, PHYS, RHYTHM, World, restore, snapshot } from '../game/sim'
import { T, emptyInput, type Input } from '../game/types'

/** İkinci defterin mekanikleri: halat (L), teleferik halatı (R), derin su (W). */
const mk = (map: string[]) => new World({ ...LEVELS[0], map, wind: 0 })
const step = (w: World, secs: number, inp: Partial<Input> = {}, press = false) => {
  for (let i = 0; i < Math.round(secs * 120); i++) w.step(1 / 120, { ...emptyInput(), ...inp, jumpPressed: press && i === 0 })
}

describe('halat', () => {
  const map = ['          ', '    L     ', '    L     ', '    L     ', '    L     ', ' P  L     ', '##########']
  it('havadayken değince tutunulur, yukarı tırmanılır, zıplayınca bırakılır', () => {
    const w = mk(map)
    step(w, 0.5)
    step(w, 0.75, { right: true, jump: true }, true)
    expect(w.player.hang).toBe(1)
    // halatın ortasına çekildi
    expect(w.player.x + w.player.w / 2).toBeCloseTo(4 * T + T / 2, 0)
    const y0 = w.player.y
    step(w, 0.4, { up: true })
    expect(w.player.y).toBeLessThan(y0 - 20)
    // halatın tepesinden yukarı çıkılmaz
    step(w, 2, { up: true })
    expect(w.player.y).toBeGreaterThanOrEqual(T - 4)
    step(w, 0.05, { jump: true }, true)
    expect(w.player.hang).toBe(0)
    expect(w.player.vy).toBeLessThan(0)
    // halatın üstüne ya da yanına zıplayarak çıkılabilir
  })

  it('tutunmadan zıplayıp yeniden yakalayarak da tırmanılır (çözücü "yukarı" basmaz)', () => {
    const tall = ['          ', ...Array.from({ length: 12 }, () => '    L     '), ' P  L     ', '##########']
    const w = mk(tall)
    step(w, 0.5)
    step(w, 0.75, { right: true, jump: true }, true)
    const y0 = w.player.y
    for (let k = 0; k < 4; k++) step(w, 0.32, { jump: true }, true)
    expect(w.player.hang).toBe(1)
    expect(w.player.y).toBeLessThan(y0 - 16)
  })

  it('aşağı inerken halat biterse bırakır; dash halattan atılır', () => {
    const w = mk(map)
    step(w, 0.5)
    step(w, 0.75, { right: true, jump: true }, true)
    step(w, 2, { down: true })
    expect(w.player.hang).toBe(0)
    const w2 = mk(map)
    step(w2, 0.5)
    step(w2, 0.75, { right: true, jump: true }, true)
    w2.step(1 / 120, { ...emptyInput(), right: true, dashPressed: true })
    expect(w2.player.hang).toBe(0)
    expect(w2.player.dashTime).toBeGreaterThan(0)
  })

  it('anlık görüntüyle geri yüklenir (çözücü)', () => {
    const w = mk(map)
    step(w, 0.5)
    step(w, 0.75, { right: true, jump: true }, true)
    const s = snapshot(w)
    step(w, 1, { down: true })
    restore(w, s)
    expect(w.player.hang).toBe(1)
  })
})

describe('teleferik halatı', () => {
  const map = ['            ', '            ', '  RRRRRRRR  ', '            ', '            ', ' P          ', '############']
  it('altından zıplayınca asılınır, elle ilerlenir, zıplayınca bırakılır', () => {
    const w = mk(map)
    step(w, 0.5)
    step(w, 0.5, { right: true, jump: true }, true)
    expect(w.player.hang).toBe(2)
    const x0 = w.player.x
    step(w, 1, { right: true })
    expect(w.player.x).toBeGreaterThan(x0 + PHYS.cableMove * 0.8)
    expect(w.player.hang).toBe(2)
    // halatın bittiği yerde durur
    step(w, 3, { right: true })
    expect(w.player.x + w.player.w / 2).toBeLessThan(10 * T)
    step(w, 0.05, { jump: true }, true)
    expect(w.player.hang).toBe(0)
    step(w, 1)
    expect(w.player.grounded).toBe(true)
  })
})

describe('derin su', () => {
  const map = ['            ', ' P          ', '###WWWWW####', '###WWWWW####', '###WWWWW####', '############']
  it('suya giren boğulmaz, yavaş batar, kulaçla yükselir ve karşı kıyıya çıkar', () => {
    const w = mk(map)
    step(w, 0.3)
    step(w, 0.6, { right: true })
    step(w, 0.5)
    expect(w.player.dead).toBe(false)
    expect(w.player.swim).toBe(true)
    expect(w.player.vy).toBeLessThanOrEqual(PHYS.swimSink)
    const y = w.player.y
    step(w, 0.1, { jump: true }, true)
    expect(w.player.y).toBeLessThan(y)
    // kulaç kulaç sağa yüz, kıyıya çık
    for (let k = 0; k < 20 && !(w.player.grounded && !w.player.swim && w.player.x > 8 * T); k++) step(w, 0.25, { right: true, jump: true }, true)
    expect(w.player.dead).toBe(false)
    expect(w.player.x).toBeGreaterThan(8 * T)
    expect(w.player.swim).toBe(false)
    expect(w.deaths).toBe(0)
  })

  it('öldüren su (~) öldürmeye devam eder', () => {
    const w = mk(['            ', ' P          ', '###~~~~~####', '############'])
    step(w, 0.3)
    step(w, 1, { right: true })
    expect(w.deaths + (w.player.dead ? 1 : 0)).toBeGreaterThan(0)
  })
})

describe('co-op eşi', () => {
  const two = (w: World, secs: number, a: Partial<Input> = {}, b: Partial<Input> = {}, pressB = false) => {
    for (let i = 0; i < Math.round(secs * 120); i++) {
      w.step(1 / 120, { ...emptyInput(), ...a })
      w.stepPartner(1 / 120, { ...emptyInput(), ...b, jumpPressed: pressB && i === 0 })
    }
  }
  it('eş aynı dünyada yürür ve hatırayı toplar (ortak)', () => {
    const w = mk(['            ', ' P     C    ', '############'])
    w.enableCoop()
    w.started = true
    const x0 = w.player.x
    two(w, 1.2, {}, { right: true })
    expect(w.partner!.x).toBeGreaterThan(x0 + 60)
    expect(w.player.x).toBeCloseTo(x0, 0)
    expect(w.pickups[0].taken).toBe(true)
  })

  it('düşen eş partnerinin yanında doğar; dünya sıfırlanmaz', () => {
    const w = mk(['             ', ' P   C       ', '#####^^^#####', '#############'])
    w.enableCoop()
    w.started = true
    two(w, 0.6, { right: true })
    expect(w.pickups[0].taken).toBe(true)
    const px = w.player.x
    two(w, 1.2, {}, { right: true })
    expect(w.deaths).toBe(1)
    two(w, 1)
    const q = w.partner!
    expect(q.dead).toBe(false)
    expect(Math.abs(q.x - px)).toBeLessThan(16)
    // oyuncu düşmediği için bölüm bayraktan kurulmadı: toplanan hatıra yerinde
    expect(w.pickups[0].taken).toBe(true)
    expect(w.player.dead).toBe(false)
  })

  it('düşen oyuncu da eşinin yanında doğar; kural ikisine aynı, dünya sıfırlanmaz', () => {
    const w = mk(['             ', ' P  C        ', '######^^^####', '#############'])
    w.enableCoop()
    w.started = true
    const qx = w.partner!.x
    two(w, 1.6, { right: true })
    expect(w.pickups[0].taken).toBe(true)
    expect(w.deaths).toBe(1)
    two(w, 1)
    expect(w.player.dead).toBe(false)
    expect(w.partner!.dead).toBe(false)
    expect(Math.abs(w.player.x - qx)).toBeLessThan(16)
    // eşi ayaktaydı: bölüm bayraktan kurulmadı, alınan hatıra yerinde
    expect(w.pickups[0].taken).toBe(true)
  })

  it('ikisi birden düşerse bölüm bayraktan kurulur ve ikisi birlikte doğar', () => {
    const w = mk(['             ', ' P           ', '#^^^^^^^^^^^#', '#############'])
    w.enableCoop()
    w.started = true
    two(w, 0.8, { right: true }, { right: true })
    expect(w.player.dead || w.partner!.dead).toBe(true)
    let respawned = false
    for (let i = 0; i < 240; i++) {
      w.step(1 / 120, emptyInput())
      w.stepPartner(1 / 120, emptyInput())
      if (w.events.some((e) => e.type === 'respawn')) {
        respawned = true
        w.bringPartner()
      }
      w.events.length = 0
    }
    expect(respawned).toBe(true)
    expect(w.player.dead).toBe(false)
    expect(w.partner!.dead).toBe(false)
    expect(Math.abs(w.player.x - w.partner!.x)).toBeLessThan(16)
  })

  it('eş çıkışa varınca bölüm biter', () => {
    const w = mk(['            ', ' P      E   ', '############'])
    w.enableCoop()
    w.started = true
    two(w, 1.5, {}, { right: true })
    expect(w.complete).toBe(true)
  })
})

describe('zehirli su', () => {
  const map = ['            ', '            ', ' P      ^^  ', '###  #######', '###^^#######', '############']
  it('yalnız kapalı çukurun dibindeki diken zehirli suya döner; düz yoldaki diken kalır', () => {
    const w = new World({ ...LEVELS[0], map, wind: 0, poison: true })
    expect([...w.poison].sort((a, b) => a - b)).toEqual([4 * w.cols + 3, 4 * w.cols + 4])
    // zeminin üstündeki diken çukur değil (yanları boş): diken kalır
    expect(w.poison.has(2 * w.cols + 8)).toBe(false)
    expect(new World({ ...LEVELS[0], map, wind: 0 }).poison.size).toBe(0)
  })
  it('zehirli suya düşen ölür', () => {
    const w = new World({ ...LEVELS[0], map, wind: 0, poison: true })
    step(w, 0.3)
    step(w, 0.6, { right: true })
    expect(w.deaths).toBeGreaterThan(0)
  })
})

describe('nitro tüpü', () => {
  const map = ['                              ', '                              ', ' P  T                         ', '##############################']
  it('alınınca koşu hızlanır, süresi bitince normale döner, tüp yeniden dolar', () => {
    const w = mk(map)
    step(w, 0.3)
    step(w, 0.6, { right: true })
    expect(w.player.nitro).toBeGreaterThan(0)
    expect(w.nitros[0].active).toBe(false)
    step(w, 0.5, { right: true })
    expect(w.player.vx).toBeGreaterThan(PHYS.run * 1.3)
    step(w, NITRO.time, { right: true })
    expect(w.player.nitro).toBe(0)
    expect(Math.abs(w.player.vx)).toBeLessThanOrEqual(PHYS.run + 1)
    step(w, NITRO.recharge)
    expect(w.nitros[0].active).toBe(true)
  })
  it('anlık görüntü nitroyu ve tüpü taşır (çözücü geri sarar)', () => {
    const w = mk(map)
    step(w, 0.3)
    const s0 = snapshot(w)
    step(w, 0.6, { right: true })
    expect(w.player.nitro).toBeGreaterThan(0)
    restore(w, s0)
    expect(w.player.nitro).toBe(0)
    expect(w.nitros[0].active).toBe(true)
  })
})

describe('zor mod fiziği', () => {
  const map = ['                    ', '                    ', ' P                  ', '####################', '####################']
  it('Kaygan Dünya: bırakınca buzdaki gibi uzun kayar', () => {
    const slide = (slippery: boolean) => {
      const w = new World({ ...LEVELS[0], map, wind: 0, slippery })
      step(w, 0.3)
      step(w, 0.8, { right: true })
      const x = w.player.x
      step(w, 1)
      return w.player.x - x
    }
    expect(slide(true)).toBeGreaterThan(slide(false) + 8)
  })
  it('Çöken Dünya: yüzeyler çatlak taşa döner, başlangıcın çevresi sağlam kalır', () => {
    const w = new World({ ...LEVELS[0], map, wind: 0, crumbleAll: true })
    expect(w.tile(1, 3)).toBe(1)
    expect(w.tile(12, 3)).toBe(5)
    expect(w.tile(12, 4)).toBe(1)
  })
})

describe('zamanlama mekanikleri', () => {
  it('ritim blokları saatle sırayla katılaşır; içindeyken belirecek blok oyuncu çıkana dek boş kalır', () => {
    const map = ['            ', '            ', ' P   {}     ', '############']
    const w = mk(map)
    expect(w.isSolid(5, 2)).toBe(true)
    expect(w.isSolid(6, 2)).toBe(false)
    w.clock = RHYTHM.half + 0.01
    expect(w.isSolid(5, 2)).toBe(false)
    expect(w.isSolid(6, 2)).toBe(true)
    // oyuncu `}` karosunun içindeyken takım değişir: sıkışmaz
    const v = mk(map)
    step(v, 0.2)
    v.player.x = 6 * T + 1
    v.player.y = 2 * T + 1
    v.clock = RHYTHM.half - 0.005
    step(v, 0.02)
    expect(v.rhythmHold.size).toBeGreaterThan(0)
    expect(v.isSolid(6, 2)).toBe(false)
  })
  it('yaya inerken zıplama basılıysa daha yükseğe seker', () => {
    const map = ['          ', '          ', '          ', '          ', ' P        ', '          ', '          ', ' S        ', '##########']
    const peak = (perfect: boolean) => {
      const w = mk(map)
      let top = Infinity
      for (let i = 0; i < 240; i++) {
        const nearSpring = w.player.vy > 0 && w.player.y > 6 * T - 4
        w.step(1 / 120, { ...emptyInput(), jump: perfect && nearSpring, jumpPressed: perfect && nearSpring })
        top = Math.min(top, w.player.y)
      }
      return top
    }
    expect(peak(false) - peak(true)).toBeGreaterThan(T)
  })
})

describe('Co-op Boss Kapışması: iki boss', () => {
  const van = LEVELS.find((l) => l.id === 'van')!
  const lvl = { ...bossLevel(van), bossOf: van.city, bossOf2: 'kocaeli' as const, bossBoost: { tier: 3 as const, speed: 1.3 } }
  it('ikinci boss kurulur, zorluk kademeyi ve hızı artırır', () => {
    const w = new World(lvl)
    expect(w.boss2).not.toBeNull()
    expect(w.boss2!.def.tier).toBe(3)
    expect(w.boss!.def.speed).toBeGreaterThan(1.3)
    expect(w.boss2!.x).not.toBe(w.boss!.x)
  })
  it('kapı (G) yalnız iki boss da düşünce açılır', () => {
    const w = new World(lvl)
    let gx = -1
    let gy = -1
    w.level.map.forEach((row, y) => {
      const x = row.indexOf('G')
      if (x >= 0 && gx < 0) [gx, gy] = [x, y]
    })
    expect(w.isSolid(gx, gy)).toBe(true)
    w.boss!.state = 'down'
    expect(w.isSolid(gx, gy)).toBe(true)
    w.boss2!.state = 'down'
    expect(w.isSolid(gx, gy)).toBe(false)
  })
})

describe('derin suda nefes', () => {
  // 6 karo derin havuz: dipte durulursa nefes biter, yüzeye çıkınca dolar
  const pool = ['           ', ' P         ', '##WWWWWWW##', '##WWWWWWW##', '##WWWWWWW##', '##WWWWWWW##', '##WWWWWWW##', '###########']
  it('başı su altında kalan nefes bitince boğulur', () => {
    const w = mk(pool)
    w.started = true
    w.player.x = 5 * 16
    w.player.y = 5 * 16
    let drown = false
    for (let i = 0; i < 120 * (AIR.max + 1); i++) {
      w.step(1 / 120, emptyInput())
      if (w.events.some((e) => e.type === 'drown')) drown = true
      w.events.length = 0
      if (w.player.dead) break
    }
    expect(drown).toBe(true)
    expect(w.deaths).toBe(1)
  })
  it('yüzeye çıkan nefesini doldurur', () => {
    const w = mk(pool)
    w.started = true
    w.player.x = 5 * 16
    w.player.y = 5 * 16
    for (let i = 0; i < 120 * 3; i++) w.step(1 / 120, emptyInput())
    expect(w.player.air).toBeLessThan(AIR.max)
    // kulaç kulaç yüzeye
    for (let i = 0; i < 120 * 3; i++) w.step(1 / 120, { ...emptyInput(), jump: true, jumpPressed: i % 20 === 0 })
    expect(w.player.dead).toBe(false)
    expect(w.player.air).toBe(AIR.max)
  })
})
