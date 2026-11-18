import { describe, expect, it } from 'vitest'
import { LEVELS } from '@/game/levels'
import { World } from '@/game/sim'
import { BOSS_SPEEDS, CITY_CODES, MAX_W, ROWS, SAMPLE_MAP, SYMBOLS, bossDesign, customLevel, customMedals, decodeMap, encodeMap, validateMap, textProblem } from '@/lib/customLevel'
import { solve } from '../scripts/solver'

const blank = (w: number) => {
  const m = Array.from({ length: ROWS }, () => ' '.repeat(w))
  return m.map((r, y) => (y >= 20 ? '#'.repeat(w) : y === 19 ? ' P' + ' '.repeat(w - 4) + 'E ' : r))
}

describe('özel harita kodu', () => {
  it('örnek harita gidiş-dönüş', () => {
    const code = encodeMap(SAMPLE_MAP, 'kayseri')
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeMap(code)).toMatchObject({ map: SAMPLE_MAP, city: 'kayseri' })
  })

  it('her şehir ve her simge, uzun koşular dahil gidiş-dönüş', () => {
    const syms = SYMBOLS.filter((s) => !'PEC$!KDp[]?nQG'.includes(s))
    let seed = 7
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
    for (const city of CITY_CODES) {
      const w = 40 + Math.floor(rnd() * (MAX_W - 40 + 1))
      const map = blank(w).map((r, y) =>
        y < 19 ? Array.from(r, () => (rnd() < 0.6 ? ' ' : syms[Math.floor(rnd() * syms.length)])).join('') : r,
      )
      const out = decodeMap(encodeMap(map, city))
      expect(out).toMatchObject({ map, city })
    }
    const wide = blank(MAX_W)
    const code = encodeMap(wide, 'bayburt')
    expect(code.length).toBeLessThan(60)
    expect(decodeMap(code)).toMatchObject({ map: wide, city: 'bayburt' })
  })

  it('şehir sırası bütün bölümleri kapsar', () => {
    expect(new Set(CITY_CODES)).toEqual(new Set(LEVELS.map((l) => l.city)))
  })

  it('bozuk ve geçersiz kodları reddeder', () => {
    const code = encodeMap(SAMPLE_MAP, 'istanbul')
    expect(decodeMap('')).toHaveProperty('error')
    expect(decodeMap('!!!')).toHaveProperty('error')
    expect(decodeMap(code.slice(0, -3))).toHaveProperty('error')
    const flipped = code.slice(0, 10) + (code[10] === 'A' ? 'B' : 'A') + code.slice(11)
    expect(decodeMap(flipped)).toHaveProperty('error')
    expect(decodeMap('AgAAPKEH1gdYB20')).toHaveProperty('error')
  })

  it('doğrulama: boyut, yasak karakter, P/E sayısı, hatıra sınırı', () => {
    expect(validateMap(SAMPLE_MAP)).toBeNull()
    expect(validateMap(SAMPLE_MAP.slice(1))).not.toBeNull()
    expect(validateMap(blank(39))).not.toBeNull()
    expect(validateMap(blank(MAX_W + 1))).not.toBeNull()
    expect(validateMap(blank(MAX_W))).toBeNull()
    expect(validateMap(SAMPLE_MAP.map((r, y) => (y === 0 ? '@' + r.slice(1) : r)))).not.toBeNull()
    expect(validateMap(SAMPLE_MAP.map((r) => r.replace('P', ' ')))).toBe('Başlangıç (P) eksik.')
    expect(validateMap(SAMPLE_MAP.map((r) => r.replace('E', ' ')))).toBe('Çıkış (E) eksik.')
    expect(validateMap(SAMPLE_MAP.map((r, y) => (y === 5 ? 'PP' + r.slice(2) : r)))).not.toBeNull()
    expect(validateMap(SAMPLE_MAP.map((r, y) => (y === 5 ? 'CCC' + r.slice(3) : r)))).not.toBeNull()
    expect(() => encodeMap(SAMPLE_MAP.map((r) => r.replace('E', ' ')), 'istanbul')).toThrow()
  })
})

describe('kod sürümleri', () => {
  // sürüm 2'den önceki kodlayıcının ürettiği kodlar: eski paylaşım bağlantıları ve yayındaki topluluk haritaları
  const OLD_SAMPLE = 'ARcAPKEH1gdYB20UBxWAA5AHCFAHA5gCGQcAkAWIAQ8KQQ8yQQ8yQQ8yQQ8g'
  const OLD_WIDE = 'ASIBQFoHuS-AtwLHArwHmwKIAA_4CQ'
  const wide320 = Array.from({ length: ROWS }, (_, y) =>
    y >= 20 ? '#'.repeat(320) : y === 19 ? ' P' + 'L'.repeat(10) + 'W'.repeat(10) + 'R'.repeat(5) + ' '.repeat(291) + 'E ' : ' '.repeat(320),
  )

  it('sürüm 1 kodları aynen açılır ve aynı haritaya yine aynı kod üretilir', () => {
    expect(decodeMap(OLD_SAMPLE)).toMatchObject({ map: SAMPLE_MAP, city: 'kayseri' })
    expect(encodeMap(SAMPLE_MAP, 'kayseri')).toBe(OLD_SAMPLE)
    expect(decodeMap(OLD_WIDE)).toMatchObject({ map: wide320, city: 'agri' })
    expect(encodeMap(wide320, 'agri')).toBe(OLD_WIDE)
  })

  it('yeni simge ya da 320 sütundan geniş harita sürüm 2 ile kodlanır', () => {
    const withStamp = SAMPLE_MAP.map((r, y) => (y === 15 ? r.slice(0, 10) + '$' + r.slice(11) : r))
    const c2 = encodeMap(withStamp, 'van')
    expect(fromCode(c2)[0]).toBe(2)
    expect(decodeMap(c2)).toMatchObject({ map: withStamp, city: 'van' })
    const wider = blank(321)
    expect(fromCode(encodeMap(wider, 'van'))[0]).toBe(2)
    expect(fromCode(encodeMap(blank(320), 'van'))[0]).toBe(1)
  })

  it('sürüm 1 kodunda yeni simge ya da 320 sütundan geniş harita olamaz', () => {
    // elle kurulmuş sürüm 1 kodu: simge sırası 25 (pul) sürüm 1'de yoktu
    const body = [(16 << 3) | 0, (25 << 3) | 0, (17 << 3) | 0, (0 << 3) | 7, 0x80 + 0x7f, 0x07]
    expect(decodeMap(toCode([1, 0, 0, 40, sum(body), ...body]))).toEqual({ error: 'Haritada izin verilmeyen bir karo var.' })
    expect(decodeMap(toCode([1, 0, 1, 0x41, sum([0]), 0]))).toHaveProperty('error')
    expect(decodeMap(toCode([4, 0, 0, 40, sum([0]), 0]))).toEqual({ error: 'Harita kodu bu sürümde açılamıyor.' })
  })
})

describe('yeni simgelerin kuralları', () => {
  const put = (m: string[], x: number, y: number, ch: string) => m.map((r, yy) => (yy === y ? r.slice(0, x) + ch + r.slice(x + 1) : r))
  it('pul, nazar ve anahtar tektir; kapı anahtar, renkli blok plaka ister; en çok iki sandık', () => {
    const b = blank(60)
    expect(validateMap(put(put(b, 5, 10, '$'), 6, 10, '$'))).toBe('Haritada yalnız bir gizli pul olabilir.')
    expect(validateMap(put(put(b, 5, 10, '!'), 6, 10, '!'))).toBe('Haritada yalnız bir nazar boncuğu olabilir.')
    expect(validateMap(put(put(b, 5, 10, 'K'), 6, 10, 'K'))).toBe('Haritada yalnız bir anahtar olabilir.')
    expect(validateMap(put(b, 5, 19, 'D'))).toBe('Kilitli kapı var ama anahtar yok.')
    expect(validateMap(put(put(b, 5, 19, 'D'), 8, 19, 'K'))).toBeNull()
    expect(validateMap(put(b, 5, 19, '['))).toBe('Renkli bloklar var ama onları değiştirecek plaka yok.')
    expect(validateMap(put(put(b, 5, 19, ']'), 8, 19, '_'))).toBeNull()
    expect(validateMap(put(put(put(b, 5, 19, 'p'), 7, 19, 'p'), 9, 19, 'p'))).toBe('En çok iki sandık konabilir.')
  })

  it('yeni simgeler oyunda kurulur: pul, nazar, anahtar, düşmanlar, platformlar, tokmak', () => {
    let m = blank(80)
    const items: Array<[number, number, string]> = [
      [10, 17, '$'], [12, 17, '!'], [14, 19, 'K'], [16, 18, 'D'], [16, 19, 'D'], [20, 19, '%'], [22, 16, '*'], [24, 19, 'p'],
      [26, 19, '_'], [28, 18, '['], [29, 18, ']'], [32, 15, 'M'], [33, 15, 'M'], [38, 15, '|'], [42, 19, 'N'], [42, 10, ':'],
      [46, 12, 'B'], [50, 10, 'Y'], [54, 19, 'h'], [56, 19, 'c'], [58, 12, 'u'], [60, 19, 'x'], [62, 12, 'j'],
    ]
    for (const [x, y, ch] of items) m = put(m, x, y, ch)
    expect(validateMap(m)).toBeNull()
    const w = new World(customLevel(m, 'ordu'))
    expect(w.stampBox).not.toBeNull()
    expect(w.charmBox).not.toBeNull()
    expect(w.keyBox).not.toBeNull()
    expect(w.crates).toHaveLength(1)
    expect(w.plates).toHaveLength(1)
    expect(w.crystals).toHaveLength(1)
    expect(w.platforms).toHaveLength(3)
    expect(w.hammers).toHaveLength(1)
    expect(w.enemies).toHaveLength(5)
    expect(decodeMap(encodeMap(m, 'ordu'))).toMatchObject({ map: m, city: 'ordu' })
  })
})

const fromCode = (c: string) => Array.from(atob(c.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0))
const toCode = (b: number[]) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const sum = (b: number[]) => b.reduce((a, x) => (a * 31 + x) % 251, 7)

describe('customLevel', () => {
  it('şehrin görünümü ve metinleri, özel ad ve madalya', () => {
    const l = customLevel(SAMPLE_MAP, 'mardin')
    const base = LEVELS.find((x) => x.city === 'mardin')!
    expect(l).toMatchObject({ id: 'ozel', city: 'mardin', name: 'Özel Harita', plate: base.plate, item: base.item, hints: [], npcs: [], finaleAt: undefined, wind: undefined })
    expect(l.facts).toBe(base.facts)
    expect(l.medals).toEqual(customMedals(60))
    expect(l.medals[0]).toBeLessThan(l.medals[1])
    expect(l.medals[1]).toBeLessThan(l.medals[2])
  })

  it('örnek harita oyunda kurulur ve çözücüyle bitirilir', () => {
    const l = customLevel(SAMPLE_MAP, 'istanbul')
    const w = new World(l)
    expect(w.pickups.length).toBe(1)
    expect(w.checkpoints.length).toBe(1)
    expect(solve(l, { exitOnly: true, budget: 4000 }).won).toBe(true)
  })
})

describe('özel harita metinleri (sürüm 3)', () => {
  const base = SAMPLE_MAP.map((r, y) => (y === 19 ? r.slice(0, 10) + '?' + r.slice(11, 14) + 'n' + r.slice(15) : r))
  it('tabela ve kişi metinleri kodla gidip gelir; metinsiz harita eski sürümde kalır', () => {
    const texts = { signs: ['Duvara tutun, yukarı sek.'], npcs: [{ name: 'Simitçi Hasan', text: 'Çay da var, simit de! Şşş… duvarın ardına bak.', look: 'usta' as const }] }
    const code = encodeMap(base, 'istanbul', texts)
    const r = decodeMap(code)
    expect('error' in r).toBe(false)
    if ('error' in r) return
    expect(r.map).toEqual(base)
    expect(r.texts).toEqual(texts)
    const lv = customLevel(r.map, r.city, r.texts)
    expect(lv.hints).toEqual(['Duvara tutun, yukarı sek.'])
    expect(lv.npcs[0]).toEqual({ name: 'Simitçi Hasan', look: 'usta', text: 'Çay da var, simit de! Şşş… duvarın ardına bak.' })
    // metin yoksa sürüm 3 değil: aynı harita aynı kod (yinelenen yayın yakalanır)
    expect(encodeMap(base, 'istanbul', { signs: [''], npcs: [] })).toBe(encodeMap(base, 'istanbul'))
  })
  it('metin sınırları ve kaba söz süzgeci', () => {
    expect(() => encodeMap(base, 'istanbul', { signs: ['x'.repeat(141)], npcs: [] })).toThrow()
    expect(textProblem({ signs: Array(9).fill('a'), npcs: [] })).not.toBeNull()
    expect(textProblem({ signs: ['Merhaba yolcu'], npcs: [] })).toBeNull()
  })
  it('yazılmamış tabela ve kişi oyunda boş kalmaz', () => {
    const lv = customLevel(base, 'istanbul')
    expect(lv.hints).toEqual(['…'])
    expect(lv.npcs[0].name).toBe('Yolcu')
  })
})

describe('özel haritada boss', () => {
  it('seçilen boss kodla gider gelir ve bölüme yazılır', () => {
    const map = SAMPLE_MAP.map((r, y) => (y === 19 ? r.slice(0, 30) + 'Q' + r.slice(31) : r))
    const r = decodeMap(encodeMap(map, 'istanbul', { signs: [], npcs: [], boss: 'denizli' }))
    expect('error' in r).toBe(false)
    if ('error' in r) return
    expect(r.texts.boss).toBe('denizli')
    const lv = customLevel(r.map, r.city, r.texts)
    expect(lv.bossOf).toBe('denizli')
    expect(new World(lv).boss?.def.name).toBe('Denizli Horozu')
  })
})

describe('Boss Tasarımcısı', () => {
  const arena = SAMPLE_MAP.map((r, y) => (y === 19 ? r.slice(0, 45) + 'Q' + r.slice(46) : r))
  it('tasarımdan önceki kod aynen açılır ve aynı kodu verir', () => {
    // bu kod Boss Tasarımcısı'ndan önceki sürümle üretildi (Van'ın boss'u, bir tabela yazısı)
    const old = 'AwAAPPMD2gcsA3ELAQMZQAMASAMMKAMHTAINAtADAEgDAkQBBw4hBzYhBzYhBzYhByR7InMiOlsiTWVyaGFiYSJdLCJuIjpbXSwiYiI6InZhbiJ9'
    const r = decodeMap(old)
    expect('error' in r).toBe(false)
    if ('error' in r) return
    expect(r.map).toEqual(arena)
    expect(r.texts).toEqual({ signs: ['Merhaba'], npcs: [], boss: 'van' })
    expect(encodeMap(r.map, r.city, r.texts)).toBe(old)
    expect(customLevel(r.map, r.city, r.texts).bossBoost).toBeUndefined()
  })
  it('ikinci boss, kademe, hız ve can kodla gider gelir ve dünyaya işler', () => {
    const design = { signs: [], npcs: [], boss: 'istanbul' as const, boss2: 'kocaeli' as const, bossTier: 3 as const, bossSpeed: 115, bossHp: 2 }
    const r = decodeMap(encodeMap(arena, 'izmir', design))
    expect('error' in r).toBe(false)
    if ('error' in r) return
    expect(r.texts).toEqual(design)
    const lv = customLevel(r.map, r.city, r.texts)
    expect(lv).toMatchObject({ bossOf: 'istanbul', bossOf2: 'kocaeli', bossBoost: { tier: 3, speed: 1.15, hp: 2 } })
    const w = new World(lv)
    expect(w.boss!.def.tier).toBe(3)
    expect(w.boss!.hp).toBe(5)
    expect(w.boss!.def.speed).toBeCloseTo(0.85 * 1.15)
    expect(w.boss2!.def.name).toBe('Pişmaniye Yumağı')
  })
  it('boss yoksa tasarım bölüme yazılmaz; bozuk değerler yok sayılır', () => {
    const lv = customLevel(SAMPLE_MAP, 'izmir', { signs: [], npcs: [], boss2: 'van', bossTier: 3 })
    expect(lv.bossOf2).toBeUndefined()
    expect(lv.bossBoost).toBeUndefined()
    expect(bossDesign(arena, { signs: [], npcs: [], bossSpeed: 100 })).toEqual({})
    expect(BOSS_SPEEDS).toContain(100)
  })
})

describe('gelgit karosu (A)', () => {
  it('kodda yer alır, kod gidip gelir ve gelgitli harita çözücüyle biter', () => {
    const map = SAMPLE_MAP.map((r, y) => (y >= 20 ? r.slice(0, 12) + 'AAAA' + r.slice(16) : r))
    expect(validateMap(map)).toBeNull()
    const code = encodeMap(map, 'istanbul')
    const back = decodeMap(code)
    expect('error' in back).toBe(false)
    if (!('error' in back)) expect(back.map).toEqual(map)
    expect(SYMBOLS).toContain('A')
    expect(solve(customLevel(map, 'istanbul'), { exitOnly: true, budget: 20000 }).won).toBe(true)
  })
})

describe('boss tasarımı boss\'suz haritada', () => {
  it('haritada Q yoksa boss seçimi koda girmez: kod tasarımsızla aynı', () => {
    const plain = encodeMap(SAMPLE_MAP, 'istanbul')
    const withDesign = encodeMap(SAMPLE_MAP, 'istanbul', { signs: [], npcs: [], boss: 'van', bossTier: 3, bossSpeed: 130, bossHp: 2 })
    expect(withDesign).toBe(plain)
  })
})
