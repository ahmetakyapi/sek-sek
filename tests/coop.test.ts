import { describe, expect, it } from 'vitest'
import { DEFAULT_DUO, bindDuo } from '../game/input'
import { coopAwards, credit, emptyShare, legTimes, pingFromKey } from '../lib/coopRules'
import type { GameEvent } from '../game/types'
import { legDuel } from '../lib/extras'

const fresh = (): [ReturnType<typeof emptyShare>, ReturnType<typeof emptyShare>] => [emptyShare(), emptyShare()]

describe('co-op payı ve unvanlar', () => {
  it('olaylar onları üreten oyuncuya yazılır: kurtarma, fırlatma, işaret', () => {
    const s = fresh()
    // 2. oyuncu düştü, 1. oyuncu kaldırdı
    credit(s, 1, { type: 'death', x: 0, y: 0 })
    credit(s, 1, { type: 'rescue', x: 0, y: 0, partner: true })
    expect(s[1].deaths).toBe(1)
    expect(s[0].rescues).toBe(1)
    // 2. oyuncu 1. oyuncunun başında sekti ve 1. oyuncu zıplıyordu: fırlatan 1. oyuncu
    credit(s, 1, { type: 'shoulder', x: 0, y: 0, partner: true, thrown: true })
    expect(s[1].boosts).toBe(1)
    expect(s[0].throws).toBe(1)
    credit(s, 0, { type: 'ping', kind: 'here', who: 1 })
    expect(s[1].pings).toBe(1)
    credit(s, 0, { type: 'shoulder', x: 0, y: 0, partner: false })
    expect(s[0].boosts).toBe(1)
    expect(s[1].throws).toBe(0)
    // ilgisiz olay payı değiştirmez
    credit(s, 0, { type: 'jump' } as GameEvent)
    expect(s[0]).toEqual({ ...emptyShare(), rescues: 1, throws: 1, boosts: 1 })
  })

  it('kişisel unvanlar eşitlikte verilmez, ikili unvanlar koşula bağlı', () => {
    const s = fresh()
    expect(coopAwards(s)).toEqual([{ who: 2, name: 'Kusursuz İkili' }])
    s[0].rescues = 2
    s[1].rescues = 1
    s[0].pings = 5
    s[1].pings = 4
    const names = coopAwards(s).map((a) => `${a.who}:${a.name}`)
    expect(names).toContain('0:Kurtarıcı')
    expect(names).toContain('0:Yol Gösterici')
    expect(names).toContain('2:Kurtarma Ekibi')
    expect(names).toContain('2:Sohbet Kuşları')
    expect(names).toContain('2:Kusursuz İkili')
    // yolculuk yarıda bittiyse ikili övgüsü yok
    expect(coopAwards(s, 'lives').filter((a) => a.who === 2).map((a) => a.name)).toEqual(['Sohbet Kuşları'])
    // düşen varsa Kusursuz yok, en az düşen Sağlam Ayak
    s[1].deaths = 2
    const n2 = coopAwards(s).map((a) => a.name)
    expect(n2).not.toContain('Kusursuz İkili')
    expect(coopAwards(s).find((a) => a.name === 'Sağlam Ayak')?.who).toBe(0)
  })

  it('Adil Paylaşım: ikisi de aynı sayıda hatıra almışsa', () => {
    const s = fresh()
    s[0].items = s[1].items = 2
    expect(coopAwards(s).map((a) => a.name)).toContain('Adil Paylaşım')
  })
})

describe('co-op işaret tuşları', () => {
  it('1-4 birinci, 7-0 ikinci oyuncunun; sırayla Burada, Bekle, Dikkat, Aferin', () => {
    expect(pingFromKey('Digit1', DEFAULT_DUO)).toEqual({ who: 0, kind: 'here' })
    expect(pingFromKey('Digit4', DEFAULT_DUO)).toEqual({ who: 0, kind: 'nice' })
    expect(pingFromKey('Digit7', DEFAULT_DUO)).toEqual({ who: 1, kind: 'here' })
    expect(pingFromKey('Digit0', DEFAULT_DUO)).toEqual({ who: 1, kind: 'nice' })
    expect(pingFromKey('KeyQ', DEFAULT_DUO)).toBeNull()
  })
  it('oyuncunun hareket tuşu olarak atadığı rakam işaret değil, hareket sayılır', () => {
    const k = bindDuo(DEFAULT_DUO, 1, 'jump', 'Digit8')
    expect(pingFromKey('Digit8', k)).toBeNull()
    expect(pingFromKey('Digit9', k)).toEqual({ who: 1, kind: 'danger' })
  })
})

describe('bayrak aralıkları', () => {
  it('birikimli sürelerden aralık süreleri çıkar, son aralık bitişe dek', () => {
    expect(legTimes([1000, 2500], 4000)).toEqual([1000, 1500, 1500])
    expect(legTimes([], 900)).toEqual([900])
  })
})

describe('düello bayrak bayrak', () => {
  it('her aralığı kimin kısa geçtiğini söyler; ortak bayraklarla sınırlı', () => {
    expect(legDuel([1000, 2500, 4000], [1200, 2400, 4100])).toEqual([
      { a: 1000, b: 1200, winner: 0 },
      { a: 1500, b: 1200, winner: 1 },
      { a: 1500, b: 1700, winner: 0 },
    ])
    expect(legDuel([1000], [1000, 2000])).toEqual([{ a: 1000, b: 1000, winner: -1 }])
    expect(legDuel([], [1000])).toEqual([])
  })
})
