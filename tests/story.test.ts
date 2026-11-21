import { describe, expect, it } from 'vitest'
import { LEVELS } from '../game/levels'
import { STORIES, STORY_KEYS, fill, nodesOf, talkOf, type Bi } from '../game/stories'
import { ASK_BIT, GIFT_BIT, MET_BIT, bondOf, cleanStory, hasAsked, mark, mergeStory, storyStats } from '../lib/storyRules'
import { cleanIncoming, clearProgress, cloudPart, defaultSave, mergeSaves } from '../lib/storage'

const allBi = (name: string): Bi[] => {
  const t = STORIES[name]
  return [t.hi, ...t.asks.flatMap((a) => [a.q, a.a]), t.gift.title, t.gift.text]
}

describe('Hikâye Gezisi: diyalog verisi', () => {
  it('her konuşma gerçek bir şehir insanına ait; adlar tekrar etmez', () => {
    const all = LEVELS.flatMap((l) => l.npcs.map((n) => n.name))
    expect(new Set(all).size).toBe(all.length)
    for (const k of STORY_KEYS) expect(all, `${k} haritada yok`).toContain(k)
  })

  it('her şehirde en az iki diyaloglu kişi vardır', () => {
    for (const l of LEVELS) {
      const n = l.npcs.filter((x) => talkOf(x.name)).length
      expect(n, l.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('her metin TR + EN dolu ve sınırlar içinde', () => {
    for (const k of STORY_KEYS) {
      const t = STORIES[k]
      for (const b of allBi(k)) {
        expect(b[0].trim().length, `${k} TR boş`).toBeGreaterThan(8)
        expect(b[1].trim().length, `${k} EN boş`).toBeGreaterThan(8)
        expect(b[0]).not.toBe(b[1])
        expect(b[0].startsWith('.') && b[1].startsWith('.')).toBe(false)
      }
      expect(t.hi[0].length, `${k} selam`).toBeLessThanOrEqual(260)
      expect(t.hi[1].length, `${k} hi`).toBeLessThanOrEqual(280)
      for (const a of t.asks) {
        expect(a.q[0].length, `${k} soru`).toBeLessThanOrEqual(80)
        expect(a.q[1].length).toBeLessThanOrEqual(90)
        expect(a.a[0].length, `${k} tepki`).toBeLessThanOrEqual(340)
        expect(a.a[1].length).toBeLessThanOrEqual(360)
      }
      expect(t.gift.title[0].length).toBeLessThanOrEqual(32)
      expect(t.gift.text[0].length, `${k} defter`).toBeLessThanOrEqual(420)
      expect(t.gift.text[1].length).toBeLessThanOrEqual(440)
      // sözler farklı olsun: aynı cümle iki yerde geçmez
      const trs = allBi(k).map((b) => b[0])
      expect(new Set(trs).size).toBe(trs.length)
    }
  })

  it('hiçbir metin başka karakterle aynı cümleyi paylaşmaz (şablon yok)', () => {
    const seen = new Map<string, string>()
    for (const k of STORY_KEYS)
      for (const b of allBi(k))
        for (const s of b[0].split(/(?<=[.!?])\s+/).filter((x) => x.length > 24)) {
          const prev = seen.get(s)
          expect(prev === undefined || prev === k, `"${s}" ${prev} ve ${k}`).toBe(true)
          seen.set(s, k)
        }
  })

  it('düğüm grafı: her hedef var, her düğüm kökten erişilir', () => {
    for (const k of STORY_KEYS) {
      const nodes = nodesOf(STORIES[k])
      const ids = new Set(nodes.map((n) => n.id))
      const reach = new Set<string>(['root'])
      const todo = ['root']
      while (todo.length) {
        const id = todo.pop()
        const n = nodes.find((x) => x.id === id)!
        for (const c of n.choices) {
          if (c.to === null) continue
          expect(ids.has(c.to), `${k} → ${c.to}`).toBe(true)
          if (!reach.has(c.to)) (reach.add(c.to), todo.push(c.to))
        }
      }
      expect(reach.size).toBe(nodes.length)
    }
  })

  it('yer tutucular dolar: {rol} ve «Uktun||Memo»', () => {
    expect(fill(['Merhaba {rol}', 'Hello {rol}'], 'tr', 'uktun')).toBe('Merhaba Haritacı')
    expect(fill(['Merhaba {rol}', 'Hello {rol}'], 'en', 'memo')).toBe('Hello Phone Fixer')
    expect(fill(['«A||B» x', '«C||D» y'], 'tr', 'memo')).toBe('B x')
    expect(fill(['«A||B» x', '«C||D» y'], 'en', 'uktun')).toBe('C y')
    for (const k of STORY_KEYS) for (const b of allBi(k)) for (const h of ['uktun', 'memo'] as const) for (const l of ['tr', 'en'] as const) expect(fill(b, l, h)).not.toMatch(/[{}«»]/)
  })
})

describe('Hikâye Gezisi: kayıt', () => {
  it('yıldız, soru sayısıdır; üç soru üç yıldız', () => {
    let log = mark(undefined, 'a', MET_BIT)
    expect(bondOf(log.a)).toBe(0)
    log = mark(log, 'a', ASK_BIT[0])
    log = mark(log, 'a', ASK_BIT[0])
    expect(bondOf(log.a)).toBe(1)
    expect(hasAsked(log.a, 0)).toBe(true)
    expect(hasAsked(log.a, 1)).toBe(false)
    log = mark(mark(log, 'a', ASK_BIT[1]), 'a', ASK_BIT[2])
    expect(bondOf(log.a)).toBe(3)
  })

  it('mark özgün nesneyi bozmaz', () => {
    const a = { x: 1 }
    const b = mark(a, 'x', 2)
    expect(a).toEqual({ x: 1 })
    expect(b.x).toBe(3)
    expect(mark(a, 'x', 1)).toBe(a)
  })

  it('birleşme bitleri birleştirir, hiçbir tanışma kaybolmaz', () => {
    const m = mergeStory({ a: 1, b: MET_BIT }, { a: 2, c: GIFT_BIT })
    expect(m).toEqual({ a: 3, b: MET_BIT, c: GIFT_BIT })
    expect(mergeStory(undefined, undefined)).toBeUndefined()
    expect(mergeStory({ a: 1 }, undefined)).toEqual({ a: 1 })
  })

  it('bozuk giriş temizlenir', () => {
    expect(cleanStory(null)).toBeUndefined()
    expect(cleanStory([1])).toBeUndefined()
    expect(cleanStory({ a: 1, b: 'x', c: -1, d: 1.5, e: 999, __proto__: 7, ['k'.repeat(61)]: 1 })).toEqual({ a: 1, e: 999 & 31 })
    const big = Object.fromEntries(Array.from({ length: 900 }, (_, i) => [`k${i}`, 1]))
    expect(Object.keys(cleanStory(big)!).length).toBe(400)
    expect(Object.getPrototypeOf(cleanStory(JSON.parse('{"__proto__":{"x":1},"y":2}'))!)).toBe(Object.prototype)
  })

  it('istatistik yalnız bilinen kişileri sayar', () => {
    const log = { a: MET_BIT | 7 | GIFT_BIT, b: MET_BIT | 1, z: MET_BIT }
    expect(storyStats(log)).toEqual({ met: 3, full: 1, stars: 4, gifts: 1 })
    expect(storyStats(log, (k) => k !== 'z').met).toBe(2)
  })

  it('kayıt buluta gider, birleşir, sıfırlanınca silinir', () => {
    const a = { ...defaultSave(), story: { x: 1 } }
    const b = { ...defaultSave(), story: { x: 2, y: MET_BIT } }
    expect(cloudPart(a).story).toEqual({ x: 1 })
    expect(mergeSaves(a, b).story).toEqual({ x: 3, y: MET_BIT })
    expect(clearProgress(a).story).toBeUndefined()
    expect(cleanIncoming({ story: { x: 1, __proto__: 3, y: 'q' } }).story).toEqual({ x: 1 })
  })

  it('kaydın boyutu küçük kalır: tüm kişiler tam dolu', () => {
    const full = Object.fromEntries(STORY_KEYS.map((k) => [k, 31]))
    expect(JSON.stringify(full).length).toBeLessThan(6000)
  })
})
