import { describe, expect, it } from 'vitest'
import { parseRanks, rankLabel } from '../lib/listRanks'

describe('liste sıralama özeti', () => {
  it('bozuk satırı düşürür, sayıları süzer', () => {
    const r = parseRanks({ rows: [{ id: 'izmir', total: 4, leader: 'Ayşe', leaderMs: 52000, myRank: 2, myMs: 60000 }, { id: '__proto__', total: 1 }, null, { total: 3 }, { id: 'van', total: 'x', leader: 5 }] })
    expect(Object.keys(r)).toEqual(['izmir', 'van'])
    expect(r.van).toMatchObject({ total: 0, leader: null, myRank: null })
    expect(parseRanks(null)).toEqual({})
  })
  it('etiket: lider sensen, sıran, yoksa lider', () => {
    expect(rankLabel({ id: 'a', total: 5, leader: 'Sen', leaderMs: 1, myRank: 1, myMs: 1 })).toMatchObject({ kind: 'lead', total: 5 })
    expect(rankLabel({ id: 'a', total: 5, leader: 'Ayşe', leaderMs: 1000, myRank: 3, myMs: 2000 })).toMatchObject({ kind: 'rank', rank: 3, name: 'Ayşe' })
    expect(rankLabel({ id: 'a', total: 2, leader: 'Ayşe', leaderMs: 1000, myRank: null, myMs: null })).toMatchObject({ kind: 'leader', name: 'Ayşe' })
    expect(rankLabel(undefined)).toBeNull()
  })
})
