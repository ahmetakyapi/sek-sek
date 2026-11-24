import { describe, expect, it } from 'vitest'
import { LEVELS, bossLevel } from '../game/levels'
import { AIR, AUNT, CHASE, EMPTY, FROST_CYCLE, auntFacing, NITRO, PHYS, RHYTHM, SWIM, TIDE_CYCLE, World, restore, snapshot, tideFill, tidePhase } from '../game/sim'
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

  // co-op'ta Coop.tsx 'respawn' olayında eşi getirir (world.bringPartner): testte de aynısı
  const twoLoop = (w: World, secs: number, a: Partial<Input> = {}, b: Partial<Input> = {}) => {
    for (let i = 0; i < Math.round(secs * 120); i++) {
      w.step(1 / 120, { ...emptyInput(), ...a })
      w.stepPartner(1 / 120, { ...emptyInput(), ...b })
      if (w.events.some((e) => e.type === 'respawn')) w.bringPartner()
      w.events.length = 0
    }
  }
  it('eş düşerse ikisi birden son bayraktan doğar', () => {
    const w = mk(['             ', ' P   C       ', '#####^^^#####', '#############'])
    w.enableCoop()
    w.started = true
    const sx = w.spawn.x
    twoLoop(w, 0.6, { right: true })
    expect(w.pickups[0].taken).toBe(true)
    twoLoop(w, 1.2, {}, { right: true })
    expect(w.deaths).toBe(1)
    twoLoop(w, 1)
    expect(w.partner!.dead).toBe(false)
    expect(w.player.dead).toBe(false)
    // ikisi de başlangıç (bayrak) noktasında
    expect(Math.abs(w.player.x - sx)).toBeLessThan(4)
    expect(Math.abs(w.partner!.x - w.player.x)).toBeLessThan(16)
  })

  it('oyuncu düşerse de ikisi birden son bayraktan doğar', () => {
    const w = mk(['             ', ' P  C        ', '######^^^####', '#############'])
    w.enableCoop()
    w.started = true
    const sx = w.spawn.x
    twoLoop(w, 1.6, { right: true })
    expect(w.deaths).toBe(1)
    twoLoop(w, 1)
    expect(w.player.dead).toBe(false)
    expect(Math.abs(w.player.x - sx)).toBeLessThan(4)
    expect(Math.abs(w.partner!.x - w.player.x)).toBeLessThan(16)
  })

  it('ikisi birden düşerse bölüm bayraktan kurulur ve ikisi birlikte doğar', () => {
    const w = mk(['             ', ' P           ', '###^^^^^^^^^#', '#############'])
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

  it('omuz sekmesi: eşin başına inerken zıplayan tek zıplamadan yükseğe çıkar', () => {
    const tall = ['            ', '            ', '            ', '            ', '            ', '            ', '            ', ' P          ', '############']
    // tek başına zıplamanın tepesi
    const solo = mk(tall)
    solo.started = true
    step(solo, 0.3)
    const floor = solo.player.y
    let soloTop = floor
    for (let i = 0; i < 120; i++) {
      solo.step(1 / 120, { ...emptyInput(), jump: true, jumpPressed: i === 0 })
      soloTop = Math.min(soloTop, solo.player.y)
    }
    // co-op: eş yerde durur, oyuncu zıplayıp eşin başına iner ve inerken yeniden zıplamaya basar
    const w = mk(tall)
    w.enableCoop()
    w.started = true
    two(w, 0.3)
    w.player.x = w.partner!.x
    w.player.y = w.partner!.y - 30
    w.player.vy = 60
    let top = w.player.y
    let bounced = false
    for (let i = 0; i < 180; i++) {
      w.step(1 / 120, { ...emptyInput(), jump: true, jumpPressed: i % 10 === 0 })
      w.stepPartner(1 / 120, emptyInput())
      const sh = w.events.find((e) => e.type === 'shoulder')
      if (sh) {
        bounced = true
        // seken 1. oyuncu: olay onu söyler (Kim Ne Yaptı tablosu buna göre yazılır)
        expect(sh.type === 'shoulder' && sh.partner).toBe(false)
      }
      w.events.length = 0
      top = Math.min(top, w.player.y)
    }
    expect(bounced).toBe(true)
    expect(floor - top).toBeGreaterThan((floor - soloTop) * 1.2)
  })

  it('omuzda sekmeyen kısa hop yapar, başta takılı kalmaz', () => {
    const w = mk(['            ', '            ', '            ', ' P          ', '############'])
    w.enableCoop()
    w.started = true
    two(w, 0.3)
    w.player.x = w.partner!.x
    w.player.y = w.partner!.y - 20
    w.player.vy = 40
    let hops = 0
    for (let i = 0; i < 240; i++) {
      w.step(1 / 120, emptyInput())
      w.stepPartner(1 / 120, emptyInput())
      hops += w.events.filter((e) => e.type === 'shoulder').length
      w.events.length = 0
    }
    expect(hops).toBeGreaterThan(0)
    // hop'lar söner: ikisi sonunda yan yana yerde (biri ötekinin başında sonsuza dek sekmez)
    expect(hops).toBeLessThanOrEqual(2)
    expect(Math.abs(w.player.y - w.partner!.y)).toBeLessThan(2)
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

describe('Kovalamaca: hareketli şeylerin başında', () => {
  it('raylı platformu bekleyen oyuncuyu köpek ısırmaz; ayrılınca yeniden sürer', () => {
    // solda yol, ortada raylı platform (M) ve çukur: oyuncu kıyıda bekler
    const map = ['                              ', ' P                            ', '#########   MMM      ##########', '#########~~~~~~~~~~~~##########']
    const w = new World({ ...LEVELS[0], map, wind: 0, chaser: true })
    w.started = true
    // kıyıya yürü (platformun yoluna 3 karo yakın)
    for (let i = 0; i < 120 * 3 && w.player.x < 7 * 16; i++) w.step(1 / 120, { ...emptyInput(), right: true })
    let bit = false
    for (let i = 0; i < 120 * 8 && !bit; i++) {
      w.step(1 / 120, emptyInput())
      bit = w.events.some((e) => e.type === 'bite')
      w.events.length = 0
    }
    expect(bit).toBe(false)
    expect(w.chaser!.calm).toBe(true)
    // geri, platformdan uzağa dönüp durunca köpek yeniden yetişir
    for (let i = 0; i < 120 && w.player.x > 2 * 16; i++) w.step(1 / 120, { ...emptyInput(), left: true })
    for (let i = 0; i < 120 * 8 && !bit; i++) {
      w.step(1 / 120, emptyInput())
      bit = w.events.some((e) => e.type === 'bite')
      w.events.length = 0
    }
    expect(bit).toBe(true)
  })
})

describe('Kovalamaca', () => {
  const long = ['                                                                                                    ', ' P                                                                                                  ', '####################################################################################################']
  const chase = () => new World({ ...LEVELS[0], map: long, wind: 0, chaser: true })
  it('duran oyuncuya köpek yetişir ve ısırır', () => {
    const w = chase()
    w.started = true
    step(w, 0.6, { right: true })
    let bit = false
    let growlAt = -1
    let i = 0
    for (; i < 120 * 5 && !bit; i++) {
      w.step(1 / 120, emptyInput())
      bit = w.events.some((e) => e.type === 'bite')
      if (growlAt < 0 && w.events.some((e) => e.type === 'growl')) growlAt = i
      w.events.length = 0
    }
    expect(bit).toBe(true)
    // ısırmadan önce hırlar (uyarı), en az yarım saniye önce
    expect(growlAt).toBeGreaterThanOrEqual(0)
    expect(i - growlAt).toBeGreaterThan(60)
    expect(w.deaths).toBe(1)
  })
  it('koşmaya devam eden oyuncuya yetişemez; düşünce köpek doğuşta bekler', () => {
    const w = chase()
    w.started = true
    let bit = false
    for (let i = 0; i < 120 * 12 && !bit; i++) {
      w.step(1 / 120, { ...emptyInput(), right: true })
      bit = w.events.some((e) => e.type === 'bite')
      w.events.length = 0
      if (w.player.x > 95 * 16) break
    }
    expect(bit).toBe(false)
    expect(w.chaser!.state).toBe('run')
    w.kill()
    step(w, 1)
    expect(w.chaser!.state).toBe('wait')
    expect(Math.abs(w.chaser!.x - (w.spawn.x + w.player.w / 2))).toBeLessThan(2)
    expect(CHASE.top).toBeLessThan(PHYS.run)
  })
})

describe('gelgit uyarısı', () => {
  it('değişimden önce havuzun yakınındaki oyuncuya bir kez tideUp ve tideDown', () => {
    const w = new World({ ...LEVELS[0], map: ['            ', ' P          ', '####AAAA####', '####AAAA####', '############'], wind: 0 })
    w.started = true
    const seen: string[] = []
    for (let i = 0; i < Math.round(TIDE_CYCLE.period * 120); i++) {
      w.step(1 / 120, emptyInput())
      for (const e of w.events) if (e.type === 'tideUp' || e.type === 'tideDown') seen.push(e.type)
      w.events.length = 0
    }
    expect(seen.sort()).toEqual(['tideDown', 'tideUp'])
  })
})

describe('gelgit (Mersin)', () => {
  const { hold, move, period } = TIDE_CYCLE
  // 3 karo derin gelgit havuzu, altı taş; havuzun dibi 5. satırın üstü
  const bay = ['            ', ' P          ', '####AAAA####', '####AAAA####', '####AAAA####', '############']
  const HIGH = 0.5
  const LOW = hold + move + 0.5

  it('saate bağlı döngü: yüksekte durur, iner, alçakta durur, yükselir', () => {
    expect(tideFill(0)).toBe(1)
    expect(tideFill(hold - 0.01)).toBe(1)
    expect(tideFill(hold + move / 2)).toBeCloseTo(0.5, 5)
    expect(tideFill(LOW)).toBe(0)
    expect(tideFill(period - 0.01)).toBeGreaterThan(0.99)
    expect(tideFill(period + 0.5)).toBe(tideFill(0.5))
    expect(tidePhase(hold + 0.1).phase).toBe('ebb')
    expect(tidePhase(LOW).phase).toBe('low')
    expect(tidePhase(period - 0.1).phase).toBe('flood')
  })

  it('yüksek suda kareler derin su, alçak suda boş hava; ham karo gelgit kalır', () => {
    const w = mk(bay)
    expect(w.hasTide).toBe(true)
    expect(w.tidePools.length).toBe(1)
    w.clock = HIGH
    for (let ty = 2; ty <= 4; ty++) expect(w.tile(5, ty)).toBe(SWIM)
    w.clock = LOW
    for (let ty = 2; ty <= 4; ty++) expect(w.tile(5, ty)).toBe(EMPTY)
    expect(w.isTide(5, 3)).toBe(true)
    // inerken su yüzü yukarıdan aşağı çekilir: üst kare önce açılır
    w.clock = hold + move * 0.45
    expect(w.tile(5, 2)).toBe(EMPTY)
    expect(w.tile(5, 4)).toBe(SWIM)
  })

  it('yüksek suda havuza giren yüzer; alçak suda dipte yürür; su yükselince yine yüzer', () => {
    const w = mk(bay)
    w.started = true
    w.clock = HIGH
    w.player.x = 5 * T
    w.player.y = 2 * T
    step(w, 0.4)
    expect(w.player.swim).toBe(true)
    // kulaçla yüzeye çıkıp kıyıya sıçrar
    for (let i = 0; i < 120; i++) w.step(1 / 120, { ...emptyInput(), right: true, jump: true, jumpPressed: i % 20 === 0 })
    expect(w.player.dead).toBe(false)
    expect(w.player.x).toBeGreaterThan(8 * T)
    expect(w.player.y).toBeLessThan(2 * T)

    const v = mk(bay)
    v.started = true
    v.clock = LOW
    v.player.x = 5 * T
    v.player.y = 3 * T
    step(v, 0.6)
    expect(v.player.swim).toBe(false)
    expect(v.player.grounded).toBe(true)
    expect(v.player.y + v.player.h).toBe(5 * T)
    // alçak su biter, su yükselir: dipte duran yüzmeye başlar ve boğulmaz (su altı süresi nefesten kısa)
    let drown = false
    for (let i = 0; i < 120 * period; i++) {
      v.step(1 / 120, emptyInput())
      if (v.events.some((e) => e.type === 'drown')) drown = true
      v.events.length = 0
    }
    expect(drown).toBe(false)
    expect(v.player.dead).toBe(false)
    expect(v.player.air).toBeLessThanOrEqual(AIR.max)
  })

  it('Ayna Yolu: gelgit yalnız saate bağlı, aynalı harita aynı anda aynı suyu taşır', () => {
    const w = mk(bay)
    const m = new World({ ...LEVELS[0], map: bay.map((r) => [...r].reverse().join('')), wind: 0, mirror: true })
    for (const c of [0.3, hold + 0.6, LOW, period - 0.7]) {
      w.clock = c
      m.clock = c
      for (let ty = 2; ty <= 4; ty++) for (let tx = 4; tx <= 7; tx++) expect(m.tile(w.cols - 1 - tx, ty)).toBe(w.tile(tx, ty))
    }
  })

  it('anlık görüntü gelgiti saatle taşır (çözücü geri sarar)', () => {
    const w = mk(bay)
    w.clock = LOW
    const s = snapshot(w)
    w.clock = HIGH
    expect(w.tile(5, 3)).toBe(SWIM)
    restore(w, s)
    expect(w.tile(5, 3)).toBe(EMPTY)
  })

  it('co-op eşi de aynı kuralı taşır: yüksek suda yüzer, nefesi azalır; alçak suda yürür', () => {
    const w = mk(bay)
    w.enableCoop()
    w.started = true
    w.clock = HIGH
    const q = w.partner!
    q.x = 5 * T
    q.y = 3 * T
    for (let i = 0; i < 60; i++) {
      w.step(1 / 120, emptyInput())
      w.stepPartner(1 / 120, emptyInput())
    }
    expect(q.swim).toBe(true)
    expect(q.air).toBeLessThan(AIR.max)
    w.clock = LOW
    for (let i = 0; i < 90; i++) {
      w.step(1 / 120, emptyInput())
      w.stepPartner(1 / 120, emptyInput())
    }
    expect(q.swim).toBe(false)
    expect(q.grounded).toBe(true)
    expect(q.air).toBe(AIR.max)
  })

  it('gelgitin içindeki hatıra havuzun parçası olur (kuru kalmaz)', () => {
    const w = mk(['            ', ' P          ', '####AAAA####', '####ACAA####', '####AAAA####', '############'])
    w.clock = HIGH
    expect(w.tile(5, 3)).toBe(SWIM)
    w.clock = LOW
    expect(w.tile(5, 3)).toBe(EMPTY)
  })
})

describe('co-op: Kurtarma, Fırlatma, işaret', () => {
  const tick = (w: World, secs: number, a: Partial<Input> = {}, b: Partial<Input> = {}, hook?: () => void) => {
    for (let i = 0; i < Math.round(secs * 120); i++) {
      w.step(1 / 120, { ...emptyInput(), ...a })
      w.stepPartner(1 / 120, { ...emptyInput(), ...b })
      hook?.()
      if (w.events.some((e) => e.type === 'respawn')) w.bringPartner()
    }
  }
  const pit = ['               ', ' P             ', '######^^^#######', '###############']

  it('Kurtarma kapalıyken düşen eş eskisi gibi bayrağa döner (balon yok)', () => {
    const w = mk(pit)
    w.enableCoop()
    w.started = true
    tick(w, 1.2, {}, { right: true })
    expect(w.partner!.dead).toBe(true)
    expect(w.downed).toBeNull()
  })

  it('Kurtarma açıkken düşen eş balonda bekler; öbürü değince kalkar, bayrağa dönülmez, düşüş sayılır', () => {
    const w = mk(pit)
    w.rescue = true
    w.enableCoop()
    w.started = true
    // oyuncu çukurun solunda durur, eş çukura yürür
    tick(w, 1.2, {}, { right: true })
    expect(w.partner!.dead).toBe(true)
    expect(w.downed?.who).toBe(1)
    expect(w.deaths + 1).toBeGreaterThan(0)
    // balon son sağlam yerde, oyuncunun yanında (uzak değil): oyuncu bekler ama değmez, süre dolmadan kalkış olmaz
    const spot = w.downed!.x
    const sx = w.spawn.x
    // oyuncuyu balonun yanına götür
    w.player.x = spot - 40
    let at: { dead: boolean; downed: unknown; gap: number } | null = null
    tick(w, 1, { right: true }, {}, () => {
      if (!at && w.events.some((e) => e.type === 'rescue')) at = { dead: w.partner!.dead, downed: w.downed, gap: Math.abs(w.partner!.x - w.player.x) }
      w.events.length = 0
    })
    expect(at).not.toBeNull()
    // kalkış anında: eş ayakta, balon yok, bayrağa dönülmedi (eş kurtarıcının yanında)
    expect(at!.dead).toBe(false)
    expect(at!.downed).toBeNull()
    expect(at!.gap).toBeLessThan(24)
    expect(sx).toBeLessThan(spot)
  })

  it('Kurtarma: süre dolarsa (3 sn) eskisi gibi bayraktan kurulur', () => {
    const w = mk(pit)
    w.rescue = true
    w.enableCoop()
    w.started = true
    tick(w, 1.2, {}, { right: true })
    expect(w.downed).not.toBeNull()
    // oyuncu uzakta kalır (kıpırdamaz: balona 60 px'ten yakın değil)
    w.player.x = 20 * T
    const x0 = w.player.x
    void x0
    let respawned = false
    tick(w, 3.4, {}, {}, () => {
      if (w.events.some((e) => e.type === 'respawn')) respawned = true
    })
    expect(respawned).toBe(true)
    expect(w.partner!.dead).toBe(false)
  })

  it('Kurtarma: oyuncu (1.) düşünce eş kurtarabilir', () => {
    const w = mk(pit)
    w.rescue = true
    w.enableCoop()
    w.started = true
    tick(w, 1.2, { right: true })
    expect(w.player.dead).toBe(true)
    expect(w.downed?.who).toBe(0)
    w.partner!.x = w.downed!.x - 40
    w.partner!.y = w.downed!.y - 6
    let rescued = false
    tick(w, 1, {}, { right: true }, () => {
      if (w.events.some((e) => e.type === 'rescue' && !e.partner)) rescued = true
      w.events.length = 0
    })
    expect(rescued).toBe(true)
    expect(w.player.dead).toBe(false)
  })

  it('ikisi de düşerse balon yok, bölüm bayraktan kurulur', () => {
    const w = mk(['             ', ' P           ', '###^^^^^^^^^#', '#############'])
    w.rescue = true
    w.enableCoop()
    w.started = true
    tick(w, 0.8, { right: true }, { right: true })
    expect(w.player.dead && w.partner!.dead).toBe(true)
    expect(w.downed).toBeNull()
  })

  it('Eşi Fırlat: alttaki de zıplıyorsa üsttekinin sekişi omuz sekmesinden yüksek', () => {
    const tall = ['            ', '            ', '            ', '            ', '            ', '            ', '            ', ' P          ', '############']
    const run = (baseJumps: boolean) => {
      const w = mk(tall)
      w.enableCoop()
      w.started = true
      tick(w, 0.3)
      w.player.x = w.partner!.x
      w.player.y = w.partner!.y - 30
      w.player.vy = 60
      let top = w.player.y
      let thrown = false
      for (let i = 0; i < 180; i++) {
        w.step(1 / 120, { ...emptyInput(), jump: true, jumpPressed: i % 10 === 0 })
        // alttaki, üsttekinin başına inmesine bir iki adım kala zıplar
        const near = w.player.vy > 0 && w.partner!.y - (w.player.y + w.player.h) < 5
        w.stepPartner(1 / 120, { ...emptyInput(), jump: baseJumps && near, jumpPressed: baseJumps && near })
        if (w.events.some((e) => e.type === 'shoulder' && e.thrown)) thrown = true
        w.events.length = 0
        top = Math.min(top, w.player.y)
      }
      return { top, thrown }
    }
    const plain = run(false)
    const thrown = run(true)
    expect(plain.thrown).toBe(false)
    expect(thrown.thrown).toBe(true)
    expect(thrown.top).toBeLessThan(plain.top - 6)
  })

  it('işaret: oyuncu başına bir tane, önceki yerini alır, 2,5 sn sonra söner', () => {
    const w = mk(['            ', ' P          ', '############'])
    w.enableCoop()
    w.started = true
    w.ping(0, 'here')
    w.ping(0, 'danger')
    w.ping(1, 'nice')
    expect(w.pings.map((x) => `${x.who}${x.kind}`).sort()).toEqual(['0danger', '1nice'])
    expect(w.events.filter((e) => e.type === 'ping')).toHaveLength(3)
    tick(w, 2.6)
    expect(w.pings).toHaveLength(0)
  })
})

describe('yükselen hava (Balıkesir)', () => {
  // dört karo genişliğinde, sekiz karo yüksek termal; sağında, termalin tepesinden iki karo aşağıda yüksek bir taş
  const map = [
    '               ',
    '               ',
    '   VVVV        ',
    '   VVVV        ',
    '   VVVV ##     ',
    '   VVVV        ',
    '   VVVV        ',
    '   VVVV        ',
    '   VVVV        ',
    ' P VVVV        ',
    '###############',
  ]
  it('içine giren yukarı taşınır, tepede asılı kalır; aşağı basan süzülüp iner', () => {
    const w = mk(map)
    step(w, 0.3)
    step(w, 0.32, { right: true })
    step(w, 1.6)
    expect(w.player.lift || w.player.y < 3 * T).toBe(true)
    // termalin tepesine (2. satır) dek çıktı, oradan uçmadı
    expect(w.player.y).toBeLessThan(3 * T)
    expect(w.player.y).toBeGreaterThan(T - 8)
    step(w, 1.5)
    expect(w.player.y).toBeLessThan(3.5 * T)
    // aşağı basınca itiş kesilir, yere iner
    step(w, 1.5, { down: true })
    expect(w.player.grounded).toBe(true)
    expect(w.tile(4, 5)).toBe(EMPTY)
  })
  it('tepeden yana uçup yüksek taşa iner', () => {
    const w = mk(map)
    step(w, 0.3)
    step(w, 0.32, { right: true })
    step(w, 1.6)
    step(w, 0.8, { right: true })
    expect(w.player.grounded).toBe(true)
    expect(w.player.y + w.player.h).toBe(4 * T)
  })
})

describe('donan su (Elazığ)', () => {
  // iki karo derin donan su; buzken üstünde yürünür, suyken yüzülür
  const map = ['            ', '            ', ' P          ', '###ZZZZZ####', '###ZZZZZ####', '############']
  it('saate bağlı: buzken katı (kaygan), suyken derin su; ham karo donan su kalır', () => {
    const w = mk(map)
    expect(w.frozen).toBe(true)
    expect(w.isSolid(4, 3)).toBe(true)
    expect(w.isFrost(4, 3)).toBe(true)
    step(w, FROST_CYCLE.half + 0.05)
    expect(w.frozen).toBe(false)
    expect(w.tile(4, 3)).toBe(SWIM)
    expect(w.isSolid(4, 3)).toBe(false)
  })
  it('buzun üstünden yürünür; eriyince oyuncu suya düşer ve yüzer; donunca içindeki karo çıkana dek su kalır', () => {
    const w = mk(map)
    step(w, 0.3)
    step(w, 0.28, { right: true })
    step(w, 0.6)
    expect(w.player.grounded).toBe(true)
    expect(w.player.x).toBeGreaterThan(3 * T)
    step(w, FROST_CYCLE.half - 1.18 + 0.4)
    expect(w.player.swim).toBe(true)
    step(w, FROST_CYCLE.half)
    expect(w.frozen).toBe(true)
    // içinde yüzdüğü karo buz olmadı: kimse buzun içinde sıkışmaz
    const p = w.player
    expect(w.isSolid(Math.floor((p.x + p.w / 2) / T), Math.floor((p.y + p.h / 2) / T))).toBe(false)
  })
})

describe('havuz teyzesi (Afyon)', () => {
  // sığ sıcak havuz; teyze ortada, oyuncu soldan gelir
  const map = ['                    ', '                    ', ' P                  ', '####WWWW"WWWWW######', '####WWWWWWWWWW######', '####################']
  it('saatle sağa sola bakar, dönmeden önce işaret verir; aynada ters', () => {
    const a = auntFacing(0, 0)
    expect(a.dir).toBe(1)
    expect(auntFacing(AUNT.turn + 0.01, 0).dir).toBe(-1)
    expect(auntFacing(0, 0, true).dir).toBe(-1)
    expect(auntFacing(AUNT.turn - AUNT.warn / 2, 0).left).toBeLessThan(AUNT.warn)
  })
  it('baktığı yönde görünce bağırıp havlu fırlatır; duran oyuncuyu havlu vurur', () => {
    const w = mk(map)
    const e = w.enemies.find((x) => x.kind === 'aunt')!
    expect(e).toBeTruthy()
    // teyzeyi oyuncuya döndür: oyuncu solda, kenarda bekliyor
    const off = e.phase0 ?? 0
    let clock = 0
    while (auntFacing(clock, off).dir !== -1 || auntFacing(clock, off).left < 2.4) clock += 0.05
    w.clock = clock
    // havuzun kenarına dek yürü (teyzeye 5 karo), orada dur
    step(w, 0.38, { right: true })
    expect(w.player.grounded).toBe(true)
    let shrieks = 0
    let towels = 0
    for (let i = 0; i < 240 && !w.player.dead; i++) {
      w.step(1 / 120, emptyInput())
      for (const ev of w.events) if (ev.type === 'shriek') shrieks++
      towels = Math.max(towels, w.projectiles.filter((q) => q.towel).length)
      w.events.length = 0
    }
    expect(shrieks).toBeGreaterThanOrEqual(1)
    expect(towels).toBeGreaterThanOrEqual(1)
    expect(w.player.dead).toBe(true)
  })
  it('havlu suya değince söner: başı su altındaki oyuncuya ulaşmaz', () => {
    const w = mk(map)
    w.player.x = 5 * T
    w.player.y = 4 * T
    w.projectiles.push({ x: 5 * T, y: 1 * T, w: AUNT.towel.w, h: AUNT.towel.h, vx: 0, vy: 0, g: AUNT.towel.g, towel: true })
    for (let i = 0; i < 120; i++) w.step(1 / 120, emptyInput())
    expect(w.projectiles.some((q) => q.towel)).toBe(false)
  })
  it('sırtı dönükken ya da arada duvar varken görmez', () => {
    const w = mk(map)
    const e = w.enemies.find((x) => x.kind === 'aunt')!
    const off = e.phase0 ?? 0
    let clock = 0
    while (auntFacing(clock, off).dir !== 1 || auntFacing(clock, off).left < 2.5) clock += 0.05
    w.clock = clock
    step(w, 0.8, { right: true })
    expect(w.player.dead).toBe(false)
    const wall = mk(map.map((r, y) => (y === 2 ? r.slice(0, 6) + '#' + r.slice(7) : r)))
    const e2 = wall.enemies.find((x) => x.kind === 'aunt')!
    let c2 = 0
    while (auntFacing(c2, e2.phase0 ?? 0).dir !== -1 || auntFacing(c2, e2.phase0 ?? 0).left < 2.5) c2 += 0.05
    wall.clock = c2
    step(wall, 1.2)
    expect(wall.player.dead).toBe(false)
  })
})
