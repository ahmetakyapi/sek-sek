import { describe, expect, it } from 'vitest'
import { World } from '@/game/sim'
import { MAX_W, NPC_NAME_MAX, NPC_TEXT_MAX, ROWS, SIGN_MAX, customLevel, decodeMap, emptyTexts, encodeMap, textProblem, validateMap } from '@/lib/customLevel'
import { KEEP, NPC_TIPS, SIGN_TIPS, STAMPS, STAMP_CATS, TEMPLATES, appendBossArena, autoGround, cut, extendMap, fillRect, flipRowsV, floodFill, mapNotes, mapStats, mirrorRect, mirrorRows, placePattern, repeatRect, resizeMap, rotateRows, stampCat, stuckHint, wizardMap } from '@/lib/editorKit'
import { solve } from '../scripts/solver'

/** 80 sütun düz zemin (üst yüzey 20. satır), başlangıç solda, çıkış sağda */
const ground = () => {
  const m = Array.from({ length: ROWS }, (_, y) => (y >= 20 ? '#' : ' ').repeat(80))
  return m.map((r, y) => (y === 19 ? ' P' + r.slice(2, 77) + 'E  ' : r))
}

describe('başlangıç şablonları', () => {
  for (const tpl of TEMPLATES)
    it(`${tpl.name}: geçerli, kodlanır ve çözücüyle biter`, () => {
      const map = tpl.make()
      expect(validateMap(map)).toBeNull()
      expect(decodeMap(encodeMap(map, 'istanbul'))).toMatchObject({ map, city: 'istanbul' })
      expect(solve(customLevel(map, 'istanbul'), { exitOnly: true, budget: 20000 }).won).toBe(true)
    })
})

describe('hazır parçalar', () => {
  it('yalnız izinli simgeler ve imleç parçanın içinde', () => {
    for (const s of STAMPS) {
      expect(s.ax).toBeLessThan(s.rows[0].length)
      expect(s.ay).toBeLessThan(s.rows.length)
      expect(new Set(s.rows.map((r) => r.length)).size).toBe(1)
      const probe = placePattern(ground(), s, 30, 19).map((r) => r.replace(/[PE]/g, ' '))
      expect(probe.join('')).not.toContain(KEEP)
    }
  })

  for (const s of STAMPS)
    it(`${s.name}: düz zemine konunca harita geçerli ve çözücüyle biter`, () => {
      const map = placePattern(ground(), s, 30, 19)
      expect(validateMap(map)).toBeNull()
      const level = customLevel(map, 'kayseri')
      expect(() => new World(level)).not.toThrow()
      expect(solve(level, { exitOnly: true, budget: 30000 }).won).toBe(true)
    })

  it('duvar haritanın tepesine dek örülür, tekil simgenin eskisi kalkar', () => {
    const door = STAMPS.find((s) => s.id === 'keyDoor')!
    const map = placePattern(ground(), door, 30, 19)
    for (let y = 0; y < 15; y++) expect(map[y][39]).toBe('#')
    const twice = placePattern(map, door, 50, 19)
    expect(twice.join('').split('K').length - 1).toBe(1)
  })
})

describe('araçlar', () => {
  it('kova aynı karolu bölgeyi doldurur, sınırda durur', () => {
    const m = ground()
    const out = floodFill(m, 10, 22, '~')
    expect(out.slice(20).every((r) => /^~+$/.test(r))).toBe(true)
    expect(out[19]).toBe(m[19])
    expect(floodFill(m, 10, 22, '#')).toBe(m)
  })

  it('dikdörtgen, kesit ve ayna', () => {
    const m = fillRect(ground(), { x0: 12, y0: 18, x1: 10, y1: 17 }, '=')
    expect(m[17].slice(10, 13)).toBe('===')
    expect(m[18].slice(9, 14)).toBe(' === ')
    expect(cut(m, { x0: 10, y0: 17, x1: 12, y1: 18 })).toEqual(['===', '==='])
    expect(mirrorRows(['>#  <'])).toEqual(['>  #<'])
    const r = { x0: 0, y0: 19, x1: 79, y1: 19 }
    const flipped = mirrorRect(ground(), r)
    expect(flipped[19][78]).toBe('P')
    expect(flipped[19][2]).toBe('E')
    expect(mirrorRect(flipped, r)).toEqual(ground())
  })
})

describe('harita uyarıları', () => {
  it('düz zeminde uyarı yok; şablon ve parçalar uyarısız', () => {
    const flagged = ground().map((r, y) => (y === 19 ? r.slice(0, 40) + 'F' + r.slice(41) : r))
    expect(mapNotes(flagged)).toEqual([])
    for (const tpl of TEMPLATES) expect(mapNotes(tpl.make()), tpl.name).toEqual([])
  })
  it('havadaki başlangıç, uzak bayrak, kapısız boss, bloksuz plaka ve boşlukta biten teleferik', () => {
    const m = ground().map((r) => r + ' '.repeat(40))
    const wide = m.map((r, y) => (y >= 20 ? '#'.repeat(r.length) : r))
    const put = (rows: string[], x: number, y: number, ch: string) => rows.map((r, yy) => (yy === y ? r.slice(0, x) + ch + r.slice(x + 1) : r))
    let bad = wide.map((r, y) => (y >= 20 ? r.slice(0, 1) + '~' + r.slice(2) : r))
    bad = put(bad, 1, 19, 'P').map((r, y) => (y === 19 ? r.slice(0, 2) + ' ' + r.slice(3) : r))
    bad = put(bad, 40, 19, 'Q')
    bad = put(bad, 50, 19, '_')
    bad = put(put(put(bad, 60, 10, 'R'), 61, 10, 'R'), 62, 10, 'R')
    const texts = mapNotes(bad).map((n) => n.text)
    expect(texts.some((t) => t.startsWith('Başlangıcın altında'))).toBe(true)
    expect(texts.some((t) => t.startsWith('Bayraklar arası'))).toBe(true)
    expect(texts.some((t) => t.startsWith('Boss var'))).toBe(true)
    expect(texts.some((t) => t.startsWith('Plaka var'))).toBe(true)
    expect(mapNotes(put(put(put(wide, 40, 19, 'F'), 60, 10, 'R'), 61, 10, 'R')).some((n) => n.text.startsWith('Teleferik'))).toBe(false)
    const hole = put(put(wide, 60, 10, 'R'), 61, 10, 'R').map((r, y) => (y >= 20 ? r.slice(0, 61) + '~' + r.slice(62) : r))
    expect(mapNotes(hole).filter((n) => n.text.startsWith('Teleferik')).map((n) => n.x)).toEqual([61])
  })
})

describe('seçimi döndür ve çevir', () => {
  it('dikey ayna dikenleri çevirir, iki kez uygulanınca aynı kalır', () => {
    const rows = ['^ #', '#=v']
    expect(flipRowsV(rows)).toEqual(['#=^', 'v #'])
    expect(flipRowsV(flipRowsV(rows))).toEqual(rows)
  })
  it('çeyrek dönüş boyutu değiştirir, dört dönüş başa döner', () => {
    const rows = ['ab', 'cd', 'ef']
    expect(rotateRows(rows)).toEqual(['eca', 'fdb'])
    expect(rotateRows(rotateRows(rotateRows(rotateRows(rows))))).toEqual(rows)
  })
})

describe('hazır parça kataloğu', () => {
  it('her kategoride parça var, kimlikler tek, parça sayısı en az kırk', () => {
    expect(STAMPS.length).toBeGreaterThanOrEqual(40)
    expect(new Set(STAMPS.map((x) => x.id)).size).toBe(STAMPS.length)
    for (const c of STAMP_CATS) expect(STAMPS.filter((x) => stampCat(x) === c.id).length, c.name).toBeGreaterThanOrEqual(2)
  })
  it('en az on üç şablon', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(13)
    expect(new Set(TEMPLATES.map((x) => x.id)).size).toBe(TEMPLATES.length)
  })
})

describe('Yeni Harita Sihirbazı', () => {
  it('genişletilen harita geçerli, uyarısız ve çözücüyle biter; çıkış sonda', () => {
    for (const tpl of TEMPLATES.filter((x) => ['flat', 'mountain', 'harbor', 'training'].includes(x.id))) {
      const m = wizardMap({ template: tpl.id, width: 200, boss: false })
      expect(validateMap(m), tpl.name).toBeNull()
      expect(m[0].length).toBe(Math.max(200, tpl.make()[0].length))
      expect(mapNotes(m), tpl.name).toEqual([])
      expect(solve(customLevel(m, 'istanbul'), { exitOnly: true, budget: 60000 }).won, tpl.name).toBe(true)
    }
  })
  it('boss arenası eklenince kapı, boss ve yeni çıkış var; şablonlar biter', () => {
    for (const tpl of TEMPLATES.filter((x) => !['bossCastle', 'sample'].includes(x.id))) {
      const m = wizardMap({ template: tpl.id, width: 0, boss: true })
      expect(validateMap(m), tpl.name).toBeNull()
      const all = m.join('')
      expect(all.includes('Q') && all.includes('G'), tpl.name).toBe(true)
      expect(mapNotes(m), tpl.name).toEqual([])
      expect(solve(customLevel(m, 'kayseri'), { exitOnly: true, budget: 60000 }).won, tpl.name).toBe(true)
    }
  })
  it('uzatma ve boyutlandırma sınırlarda kalır', () => {
    const m = ground()
    expect(extendMap(m, 40)).toBe(m)
    expect(extendMap(m, 9999)[0].length).toBe(MAX_W)
    expect(resizeMap(m, 10)[0].length).toBe(40)
    expect(resizeMap(m, 100)[0].length).toBe(100)
    expect(appendBossArena(extendMap(m, MAX_W - 20))).toEqual(extendMap(m, MAX_W - 20))
  })
})

describe('çoğalt, zemin doldur, istatistik, ipucu', () => {
  it('seçim sağa art arda çoğalır, aralıklı da', () => {
    const base = placePattern(ground(), STAMPS.find((x) => x.id === 'pit')!, 10, 19)
    const rect = { x0: 10, y0: 19, x1: 13, y1: 22 }
    const out = repeatRect(base, rect, 2, 3)
    expect(cut(out, { x0: 17, y0: 20, x1: 20, y1: 22 })).toEqual(cut(base, { x0: 10, y0: 20, x1: 13, y1: 22 }))
    expect(cut(out, { x0: 24, y0: 20, x1: 27, y1: 22 })).toEqual(cut(base, { x0: 10, y0: 20, x1: 13, y1: 22 }))
    expect(out[21].slice(14, 17)).toBe('###')
  })
  it('zemin doldur yalnız seçilen alanda ve boş hücreleri kapatır', () => {
    const m = placePattern(ground(), STAMPS.find((x) => x.id === 'pit')!, 10, 19)
    // çukurun duvar sütunları zaten dolu; oyuk (iki iç sütun) ilk zemini bulamadığı için olduğu gibi kalır
    const out = autoGround(m, { x0: 10, y0: 20, x1: 13, y1: 22 })
    expect(out[20].slice(10, 14)).toBe('#  #')
    expect(out[21].slice(10, 14)).toBe('#^^#')
    const hole = ground().map((r, y) => (y === 21 ? r.slice(0, 20) + '  ' + r.slice(22) : r))
    expect(autoGround(hole, { x0: 18, y0: 19, x1: 24, y1: 23 })[21].slice(20, 22)).toBe('##')
    expect(autoGround(hole, { x0: 30, y0: 19, x1: 34, y1: 23 })).toEqual(hole)
  })
  it('istatistik: hatıra, bayrak, tehlike', () => {
    const m = placePattern(placePattern(ground(), STAMPS.find((x) => x.id === 'pit')!, 10, 19), STAMPS.find((x) => x.id === 'plaza')!, 30, 19)
    const st = mapStats(m)
    expect(st).toMatchObject({ width: 80, items: 0, spikes: 2, signs: 1, npcs: 1, boss: false })
    expect(st.hazards).toBe(2)
    expect(mapStats(wizardMap({ template: 'sample', width: 0, boss: true })).boss).toBe(true)
  })
  it('çözücü ipucu: boşluk, yüksek duvar, genel', () => {
    const put = (rows: string[], x: number, y: number, ch: string) => rows.map((r, yy) => (yy === y ? r.slice(0, x) + ch + r.slice(x + 1) : r))
    let gap = ground()
    for (let x = 31; x <= 38; x++) for (let y = 20; y < ROWS; y++) gap = put(gap, x, y, '~')
    expect(stuckHint(gap, 30, 19).text).toContain('boşluk')
    expect(stuckHint(gap, 30, 19).vars?.n).toBe(8)
    let wall = ground()
    for (let y = 12; y < 20; y++) wall = put(wall, 31, y, '#')
    expect(stuckHint(wall, 30, 19).text).toContain('duvar')
    expect(stuckHint(ground(), 30, 19).text.length).toBeGreaterThan(10)
  })
  it('hazır tabela ve kişi önerileri sınırlar içinde, kaba söz yok', () => {
    for (const s of SIGN_TIPS) expect(s.length).toBeLessThanOrEqual(SIGN_MAX)
    for (const [n, t] of NPC_TIPS) {
      expect(n.length).toBeLessThanOrEqual(NPC_NAME_MAX)
      expect(t.length).toBeLessThanOrEqual(NPC_TEXT_MAX)
    }
    expect(textProblem({ ...emptyTexts(), signs: [...SIGN_TIPS].slice(0, 8), npcs: NPC_TIPS.slice(0, 4).map(([name, text, look]) => ({ name, text, look })) })).toBeNull()
  })
})

describe('harita adı ve açıklaması', () => {
  it('koda girer, eski kod aynen kalır, düzgün açılır', () => {
    const m = ground()
    const plain = encodeMap(m, 'istanbul')
    expect(encodeMap(m, 'istanbul', emptyTexts())).toBe(plain)
    const texts = { ...emptyTexts(), title: 'Benim Yolum', desc: 'Kısa ve tatlı bir koşu.' }
    const code = encodeMap(m, 'istanbul', texts)
    const r = decodeMap(code)
    if ('error' in r) throw new Error(r.error)
    expect(r.texts).toMatchObject({ title: 'Benim Yolum', desc: 'Kısa ve tatlı bir koşu.' })
    expect(customLevel(r.map, r.city, r.texts).name).toBe('Benim Yolum')
    expect(textProblem({ ...emptyTexts(), title: 'x'.repeat(41) })).not.toBeNull()
  })
})
