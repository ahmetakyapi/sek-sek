import { describe, expect, it } from 'vitest'
import { BOSSES } from '../game/boss'
import { POSES, gait, groundBob } from '../game/heroDraw'
import { LEVELS } from '../game/levels'
import { World } from '../game/sim'
import { emptyInput, type LevelDef } from '../game/types'

const mk = (map: string[], extra: Partial<LevelDef> = {}): World =>
  new World({ ...LEVELS[0], map, ...extra })

const run = (w: World, secs: number, patch: Partial<ReturnType<typeof emptyInput>> = {}) => {
  for (let i = 0; i < secs * 120; i++) w.step(1 / 120, { ...emptyInput(), ...patch, jumpPressed: i === 0 && !!patch.jumpPressed })
}

describe('bölüm verisi', () => {
  it.each(LEVELS.map((l) => [l.name, l]))('%s: başlangıç, çıkış, 3 hatıra, 3 bilgi', (_n, l) => {
    const w = new World(l)
    expect(l.map.length).toBe(24)
    expect(w.exit.w).toBeGreaterThan(0)
    expect(w.pickups).toHaveLength(3)
    expect(l.facts).toHaveLength(3)
    expect(w.signs.length).toBeLessThanOrEqual(l.hints.length)
  })

  it.each(LEVELS.map((l) => [l.name, l]))('%s: bayraklar arası en çok 75 karo, soldan sağa numaralı', (_n, l) => {
    const w = new World(l)
    const xs = w.checkpoints.map((c) => c.x / 16)
    // meydan kapısı yolu ikiye böler: kapıya kadar yürünür, sonra varış noktasından devam edilir
    const door = w.warp!.x / 16
    const land = w.arrival!.x / 16
    const before = [0, ...xs.filter((x) => x < door), door]
    const after = [land, ...xs.filter((x) => x > land), w.exit.x / 16]
    for (const marks of [before, after]) for (let i = 1; i < marks.length; i++) expect(marks[i] - marks[i - 1]).toBeLessThanOrEqual(75)
    expect(w.checkpoints.map((c) => c.index)).toEqual(w.checkpoints.map((_, i) => i))
    expect(xs).toEqual([...xs].sort((a, b) => a - b))
  })

  it('il plakaları doğru', () => {
    expect(LEVELS.map((l) => [l.name, l.plate])).toEqual([
      ['İstanbul', 34],
      ['Edirne', 22],
      ['Kocaeli', 41],
      ['Bursa', 16],
      ['Çanakkale', 17],
      ['İzmir', 35],
      ['Antalya', 7],
      ['Ankara', 6],
      ['Konya', 42],
      ['Nevşehir', 50],
      ['Adana', 1],
      ['Gaziantep', 27],
      ['Şanlıurfa', 63],
      ['Diyarbakır', 21],
      ['Mardin', 47],
      ['Malatya', 44],
      ['Çorum', 19],
      ['Sinop', 57],
      ['Ordu', 52],
      ['Trabzon', 61],
      ['Sivas', 58],
      ['Van', 65],
      ['Erzurum', 25],
      ['Ardahan', 75],
      ['Bayburt', 69],
    ])
  })
})

describe('fizik', () => {
  const flat = ['          ', '          ', '          ', ' P        ', '##########']

  it('yere oturur ve yürür', () => {
    const w = mk(flat)
    run(w, 0.3)
    expect(w.player.grounded).toBe(true)
    const x0 = w.player.x
    run(w, 0.5, { right: true })
    expect(w.player.x).toBeGreaterThan(x0 + 30)
  })

  it('zıplar ve yaklaşık 3 kare yükselir', () => {
    const w = mk(['          ', '          ', '          ', '          ', '          ', ' P        ', '##########'])
    run(w, 0.2)
    const y0 = w.player.y
    let minY = y0
    w.step(1 / 120, { ...emptyInput(), jump: true, jumpPressed: true })
    for (let i = 0; i < 80; i++) {
      w.step(1 / 120, { ...emptyInput(), jump: true })
      minY = Math.min(minY, w.player.y)
    }
    expect(y0 - minY).toBeGreaterThan(44)
    expect(y0 - minY).toBeLessThan(56)
  })

  it('dikene düşünce ölür, bayraktan doğar', () => {
    const w = mk(['          ', ' P  F     ', '####### ^#', '##########'])
    run(w, 0.2)
    run(w, 0.5, { right: true })
    expect(w.checkpointIndex).toBe(0)
    run(w, 2, { right: true })
    expect(w.deaths).toBeGreaterThan(0)
    run(w, 1)
    expect(w.player.dead).toBe(false)
    expect(Math.abs(w.player.x - w.spawn.x)).toBeLessThan(40)
  })

  it('dash havada bir kez, yerde yenilenir', () => {
    const w = mk(flat)
    run(w, 0.2)
    w.step(1 / 120, { ...emptyInput(), dashPressed: true, right: true })
    expect(w.player.canDash).toBe(false)
    run(w, 0.6)
    expect(w.player.canDash).toBe(true)
  })

  it('hatıra toplanınca olay üretir', () => {
    const w = mk([' P C      ', '##########'])
    run(w, 0.6, { right: true })
    expect(w.pickups[0].taken).toBe(true)
  })

  it('çıkışa dokununca bölüm biter', () => {
    const w = mk(['          ', ' P  E     ', '##########'])
    run(w, 1, { right: true })
    expect(w.complete).toBe(true)
  })
})

describe('kenar yardımı', () => {
  it('kenardan bilerek yürüyen oyuncu geri çekilmez', () => {
    const w = new World({ ...LEVELS[0], map: ['            ', ' P          ', '#####       ', '#####       ', '            ', '            ', '            ', '            '] })
    for (let i = 0; i < 120; i++) w.step(1 / 120, { ...emptyInput(), right: true })
    expect(w.player.y).toBeGreaterThan(3 * 16)
  })

  it('zemini birkaç piksel ıskalayan düşüş kenara konar', () => {
    const map = ['                ', '                ', ' P              ', '        ########', '        ########']
    const w = new World({ ...LEVELS[0], map })
    const ledgeX = 8 * 16
    const p = w.player
    // kutunun sağ kenarı zeminin 3 piksel solunda, zeminin hemen üstünden düşüyor
    p.x = ledgeX - p.w - 3
    p.y = 3 * 16 - p.h - 2
    p.vx = 0
    p.vy = 160
    p.facing = 1
    p.grounded = false
    for (let i = 0; i < 6; i++) w.step(1 / 120, emptyInput())
    expect(p.grounded).toBe(true)
    expect(p.x + p.w).toBeGreaterThan(ledgeX)
  })
})

describe('bulmaca ve yeni düşmanlar', () => {
  it('saksağan altından geçene uyarıp dalar, 6 karo ötedeki tüneğe konar', () => {
    const w = mk([
      '                              ',
      '        j                     ',
      '                              ',
      '                              ',
      '                              ',
      '  P                          E',
      '##############################',
    ])
    const m = w.enemies[0]
    expect(m.kind).toBe('magpie')
    const x0 = m.x
    run(w, 0.6, { right: true })
    expect(['windup', 'charge']).toContain(m.state)
    // dalışın yalnız uçuşunu ölç: oyuncu yoldan çekilir (isabet etseydi düşmanlar başa dönerdi)
    w.player.x = 26 * 16
    run(w, 2, {})
    expect(Math.abs(Math.round(m.x - x0))).toBe(96)
    expect(m.state === 'stun' || m.state === 'idle').toBe(true)
  })

  it('kristal dash’i geri doldurur ve kaybolur', () => {
    const w = mk(['          ', ' *        ', '          ', ' P        ', '##########'])
    run(w, 0.2)
    run(w, 0.05, { jump: true, jumpPressed: true })
    w.player.canDash = false
    run(w, 0.3, { jump: true })
    expect(w.player.canDash).toBe(true)
    expect(w.crystals[0].active).toBe(false)
  })

  it('anahtar kapıyı açar', () => {
    const map = ['          ', '          ', '        D ', ' P K    D ', '##########']
    const w = mk(map)
    run(w, 0.2)
    expect(w.hasKey).toBe(false)
    run(w, 1.2, { right: true })
    expect(w.hasKey).toBe(true)
    expect(w.player.x).toBeGreaterThan(8 * 16)
  })

  it('anahtarsız kapı geçit vermez', () => {
    const w = mk(['          ', '          ', '        D ', ' P      D ', '##########'])
    run(w, 1.2, { right: true })
    expect(w.player.x).toBeLessThan(8 * 16)
  })

  it('basamak düğmesi blokları değiştirir', () => {
    const w = mk(['          ', '          ', '          ', ' P _    [ ', '##########'])
    run(w, 0.2)
    expect(w.switchOn).toBe(false)
    run(w, 0.5, { right: true })
    expect(w.switchOn).toBe(true)
  })

  it('dikenli düşmana basılmaz', () => {
    const w = mk(['          ', ' P        ', '          ', '   x      ', '##########'])
    run(w, 1.5, { right: true })
    expect(w.player.dead || w.deaths > 0).toBe(true)
  })
})

describe('yeni şehir mekanikleri', () => {
  it('balon binince yükselir, inince geri çöker', () => {
    const w = mk(['          ', '          ', '          ', '          ', '   P      ', '          ', '   BB     ', '##########'])
    const y0 = w.platforms[0].y
    run(w, 1.4)
    expect(w.player.onPlatform).toBe(w.platforms[0])
    expect(w.platforms[0].y).toBeLessThan(y0 - 20)
    run(w, 0.4, { right: true })
    run(w, 3)
    expect(w.platforms[0].y).toBe(y0)
  })

  it('sema platformu çember çizer', () => {
    const w = mk(['          ', '          ', '          ', '    OO    ', '          ', '          ', ' P        ', '##########'])
    const pl = w.platforms[0]
    const pts: [number, number][] = []
    for (let i = 0; i < 4; i++) {
      run(w, 0.6)
      pts.push([pl.x, pl.y])
    }
    const cx = pl.cx! - pl.w / 2
    for (const [x, y] of pts) expect(Math.hypot(x - cx, y - pl.cy!)).toBeCloseTo(32, 0)
  })

  it('tokmak altında kalan ezilir, beklerken geçen kurtulur', () => {
    const w = mk(['          ', '    Y     ', '          ', '          ', ' P        ', '##########'])
    run(w, 0.2)
    w.player.x = 4 * 16 + 2
    w.clock = w.hammers[0].offset > 0 ? -w.hammers[0].offset : 0
    run(w, 0.5)
    expect(w.deaths).toBe(0)
    run(w, 1.6)
    expect(w.deaths).toBeGreaterThan(0)
  })
})

describe('karakter çizimi', () => {
  it('yerdeki her pozda ayak tabanı zemine oturur, koşunun her anında adım açılınca kalça iner', () => {
    const grounded = [POSES.idle, POSES.land, POSES.wave, ...Array.from({ length: 16 }, (_, i) => gait(i / 16))]
    for (const p of grounded) expect(Number.isFinite(groundBob(p))).toBe(true)
    // temas anı (adım en açık) geçiş anından daha alçak
    expect(groundBob(gait(0))).toBeGreaterThan(groundBob(gait(0.25)))
  })
  it('koşu döngüsü kapanır: faz 0 ile 1 aynı poz', () => {
    expect(gait(1).legs[0][0]).toBeCloseTo(gait(0).legs[0][0], 6)
    expect(gait(1).arms[1][1]).toBeCloseTo(gait(0).arms[1][1], 6)
  })
})

describe('final: meydan kapısı, düğmeler, nazar boncuğu', () => {
  const step = (w: World, secs: number, patch: Partial<ReturnType<typeof emptyInput>> = {}) => {
    for (let i = 0; i < secs * 120; i++) w.step(1 / 120, { ...emptyInput(), ...patch })
  }

  it('ölünce düğme bayrağı aldığın andaki haline döner (açık köprü açığı kapandı)', () => {
    //  bayrak → plaka → dikenler: plakaya basıp ölünce bloklar eski haline dönmeli
    const w = mk(['              ', ' P F _  ^^    ', '##############'])
    step(w, 0.9, { right: true })
    expect(w.checkpointIndex).toBe(0)
    expect(w.switchOn).toBe(true)
    for (let i = 0; i < 600 && w.deaths === 0; i++) step(w, 1 / 120, { right: true })
    expect(w.deaths).toBe(1)
    step(w, 1)
    expect(w.player.dead).toBe(false)
    expect(w.switchOn).toBe(false)
  })

  it('bayraktan önce basılan düğme, ölünce de basılı kalır', () => {
    const w = mk(['              ', ' P _ F  ^^    ', '##############'])
    for (let i = 0; i < 600 && w.deaths === 0; i++) step(w, 1 / 120, { right: true })
    expect(w.deaths).toBe(1)
    step(w, 1)
    expect(w.player.dead).toBe(false)
    expect(w.switchOn).toBe(true)
  })

  it('meydan kapısı oyuncuyu varış noktasına geçirir, düğmeleri sıfırlar, doğuş yerini taşır', () => {
    const w = mk(['                    ', ' P _ @   ##  &   E  ', '####################'])
    step(w, 0.8, { right: true })
    expect(w.player.x).toBeGreaterThan(13 * 16 - 8)
    expect(w.switchOn).toBe(false)
    expect(w.spawn.x).toBeGreaterThan(12 * 16)
    expect(w.complete).toBe(false)
  })

  it.each(LEVELS.map((l) => [l.name, l]))('%s: kapı, varış, boss, kapalı meydan kapısı ve tek nazar boncuğu var', (_n, l) => {
    const w = new World(l)
    expect(w.warp).not.toBeNull()
    expect(w.arrival).not.toBeNull()
    expect(w.boss).not.toBeNull()
    expect(w.charmBox).not.toBeNull()
    expect(l.map.join('').split('!').length - 1).toBe(1)
    expect(w.exit.x).toBeGreaterThan(w.boss!.max)
    // çıkış boss yenilmeden kapalı
    const gx = Math.floor((w.boss!.max + w.boss!.w) / 16) + 1
    expect(w.isSolid(gx, 18)).toBe(true)
    w.boss!.state = 'down'
    expect(w.isSolid(gx, 18)).toBe(false)
    // her tabelanın ve her kişinin bir metni var; finalin metinleri kendi tabelalarına denk gelir
    expect(w.signs.length).toBe(l.hints.length)
    expect(w.npcs.length).toBe(l.npcs.length)
    expect(l.hints[l.hints.length - 1]).toBe(BOSSES[l.city].taunt)
  })
})

describe('yeni mekanikler: sandık ve ıslak taş', () => {
  const go = (w: World, secs: number, patch: Partial<ReturnType<typeof emptyInput>> = {}) => {
    for (let i = 0; i < secs * 120; i++) w.step(1 / 120, { ...emptyInput(), ...patch })
  }

  it('sandık yandan itilir, duvara dayanınca durur ve oyuncuyu da durdurur', () => {
    const w = mk(['            ', ' P  p     # ', '############'])
    const c = w.crates[0]
    go(w, 0.3)
    const x0 = c.x
    go(w, 2, { right: true })
    expect(c.x).toBeGreaterThan(x0 + 20)
    go(w, 6, { right: true })
    // duvar 10. sütunda: sandık 9. sütuna yaslanır, oyuncu sandığın solunda kalır
    expect(c.x).toBeCloseTo(9 * 16, 0)
    expect(w.player.x + w.player.w).toBeLessThanOrEqual(c.x + 0.01)
  })

  it('sandığın üstüne çıkılır; çukura itilen sandık köprü olur', () => {
    //  sandık bir karoluk çukurun kenarında: itilince içine düşer, üstü zeminle bir olur, üstünden yürünür
    const w = mk(['              ', ' P p          ', '#### #########', '##############', '##############'])
    go(w, 3.5, { right: true })
    const c = w.crates[0]
    expect(c.y).toBe(2 * 16)
    expect(w.deaths).toBe(0)
    expect(w.player.x).toBeGreaterThan(5 * 16)
  })

  it('ölünce sandık yerine döner', () => {
    const w = mk(['          ', ' P p   ^^ ', '##########'])
    const c = w.crates[0]
    for (let i = 0; i < 1200 && w.deaths === 0; i++) w.step(1 / 120, { ...emptyInput(), right: true })
    expect(w.deaths).toBe(1)
    go(w, 1)
    expect(c.x).toBe(c.ox)
  })

  it('ıslak taşta durmak normal zeminden uzun, buzdan kısa sürer', () => {
    const slide = (ch: string) => {
      const w = mk(['                              ', ' P                            ', ch.repeat(30)])
      go(w, 1.2, { right: true })
      const x0 = w.player.x
      go(w, 2)
      return w.player.x - x0
    }
    expect(slide('i')).toBeGreaterThan(slide('#') + 3)
    expect(slide('i')).toBeLessThan(slide('I') - 10)
  })
})
